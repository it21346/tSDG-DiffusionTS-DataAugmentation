import torch
import torch.nn.functional as f
from torch import nn
import pandas as pd
import numpy as np
from collections import OrderedDict
from sklearn.preprocessing import OneHotEncoder
from sklearn.preprocessing import QuantileTransformer
from sklearn.model_selection import train_test_split
from torch.utils.data import TensorDataset
from torch.utils.data import DataLoader
import argparse
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score
from sklearn.metrics import f1_score
import matplotlib.pyplot as plt
import os

def get_one_hot_data(df):
    df_int = df.select_dtypes(['float', 'integer']).values # get the float and integers values
    continuous_columns_list = list(df.select_dtypes(['float', 'integer']).columns) # get a list of the column names of the continuous values

    scaler = QuantileTransformer(n_quantiles = 2000, output_distribution = 'uniform')
    df_int = scaler.fit_transform(df_int)

    df_cat = df.select_dtypes('object') # get the categorical values
    df_cat_names = list(df.select_dtypes('object').columns) # get a list of the column names of the categorical values

    numerical_array = df_int
    ohe = OneHotEncoder()
    one_hot_array = ohe.fit_transform(df_cat)

    cat_lens = [i.shape[0] for i in ohe.categories_] # list of the size of categories for each column
    discrete_columns_ordereddict = OrderedDict(zip(df_cat_names, cat_lens)) # create a dictionary with the column name as key and the size of the categories available in that column as value
    final_array = np.hstack((numerical_array, one_hot_array.toarray())) # concatenation horizontally (column wise)
    return ohe, scaler, discrete_columns_ordereddict, continuous_columns_list, final_array


def get_original_data(df_transformed, df_orig, ohe, scaler):
    """
    Basically return the data to its original form with reverse transforming
    """
    df_one_hot_int = df_transformed[:, :df_orig.select_dtypes(['float', 'integer']).shape[1]]
    df_one_hot_int = scaler.inverse_transform(df_one_hot_int)
    df_one_hot_cats = df_transformed[:, df_orig.select_dtypes(['float', 'integer']).shape[1]:]
    df_one_hot_cats = ohe.inverse_transform(df_one_hot_cats)

    df_int = pd.DataFrame(df_one_hot_int, columns=df_orig.select_dtypes(['float', 'integer']).columns)
    df_cat = pd.DataFrame(df_one_hot_cats, columns=df_orig.select_dtypes('object').columns)
    return pd.concat([df_int, df_cat], axis=1)


def prepare_data(df, batch_size):
    ohe, scaler, discrete_columns, continuous_columns, df_transformed = get_one_hot_data(df)
    input_dim = df_transformed.shape[1]

    ##########
    X_train, X_test = train_test_split(df_transformed, test_size=0.1, shuffle=True, random_state= 5)
    data_train = X_train.copy()
    data_test = X_test.copy()

    data = torch.from_numpy(data_train).float()
    train_ds = TensorDataset(data)
    train_dl = DataLoader(train_ds, batch_size=batch_size, drop_last=True)
    return ohe, scaler, input_dim, discrete_columns, continuous_columns, train_dl, data_train, data_test


class Generator(nn.Module):
    def __init__(self, input_dim, continuous_columns, discrete_columns):
        super(Generator, self).__init__()
        self._input_dim = input_dim
        self._discrete_columns = discrete_columns
        self._num_continuous_columns = len(continuous_columns)
        self.lin1 = nn.Linear(self._input_dim, self._input_dim)
        self.lin_numerical = nn.Linear(self._input_dim, self._num_continuous_columns)
        self.lin_cat = nn.ModuleDict()
        for key,value in self._discrete_columns.items():
            self.lin_cat[key] = nn.Linear(self._input_dim, value)

    def forward(self, x):
        x = torch.relu(self.lin1(x))
        x_numerical = f.relu(self.lin_numerical(x))
        x_cat = []
        for key in self.lin_cat:
            x_cat.append(f.gumbel_softmax(self.lin_cat[key](x), tau=0.2))
        x_final = torch.cat((x_numerical, *x_cat), 1)
        return x_final

class Discriminator(nn.Module):
    def __init__(self, input_dim):
        super(Discriminator, self).__init__()
        self._input_dim = input_dim
        self.dense1 = nn.Linear(self._input_dim, self._input_dim)
        self.dense2 = nn.Linear(self._input_dim, self._input_dim)

    def forward(self, x):
        x = f.leaky_relu(self.dense1(x))
        x = f.leaky_relu(self.dense2(x))
        return x

def get_gradient(crit, real, fake, epsilon):
    mixed_data = real * epsilon + fake * (1 - epsilon)

    mixed_scores = crit(mixed_data)

    gradient = torch.autograd.grad(
        inputs=mixed_data,
        outputs=mixed_scores,
        grad_outputs=torch.ones_like(mixed_scores),
        create_graph=True,
        retain_graph=True,
    )[0]
    return gradient
def gradient_penalty(gradient):
    gradient = gradient.view(len(gradient), -1)
    gradient_norm = gradient.norm(2, dim=1)

    penalty = torch.mean((gradient_norm - 1) ** 2)
    return penalty
def get_gen_loss(discr_fake_pred):
    gen_loss = -1. * torch.mean(discr_fake_pred)

    return gen_loss
def get_discr_loss(discr_fake_pred, discr_real_pred, gp, c_lambda):
    discr_loss = torch.mean(discr_fake_pred) - torch.mean(discr_real_pred) + c_lambda * gp
    return discr_loss  

def train(df, device, epochs = 500, batch_size = 64):
    ohe, scaler, input_dim, discrete_columns, continuous_columns, train_dl, data_train, data_test = prepare_data(df, batch_size)
    generator = Generator(input_dim, continuous_columns, discrete_columns).to(device)
    discriminator = Discriminator(input_dim).to(device)
    gen_optimizer = torch.optim.Adam(generator.parameters(), lr=0.0002, betas=(0.5, 0.999))
    discr_optimizer = torch.optim.Adam(discriminator.parameters(), lr=0.0002, betas=(0.5, 0.999))

    discr_losses = []
    generator_losses = []
    cur_step = 0
    for i in range(epochs):
        print("epoch {}".format(i + 1))
        for data in train_dl:
            data[0] = data[0].to(device)
            discr_repeat = 4
            mean_iteration_discr_loss = 0
            for k in range(discr_repeat):
                # training the discriminator
                discr_optimizer.zero_grad()
                fake_noise = torch.randn(size=(batch_size, input_dim), device=device).float()
                fake = generator(fake_noise)
                discr_fake_pred = discriminator(fake.detach())
                discr_real_pred = discriminator(data[0])
                epsilon = torch.rand(batch_size, input_dim, device=device, requires_grad=True)
                gradient = get_gradient(discriminator, data[0], fake.detach(), epsilon)
                gp = gradient_penalty(gradient)
                discr_loss = get_discr_loss(discr_fake_pred, discr_real_pred, gp, c_lambda=10)
                mean_iteration_discr_loss += discr_loss.item() / discr_repeat
                discr_loss.backward(retain_graph=True)
                discr_optimizer.step()
            if cur_step > 50:
                discr_losses += [mean_iteration_discr_loss]

            # training the generator
            gen_optimizer.zero_grad()
            fake_noise_2 = torch.randn(size=(batch_size, input_dim), device=device).float()
            fake_2 = generator(fake_noise_2)
            discr_fake_pred = discriminator(fake_2)
            gen_loss = get_gen_loss(discr_fake_pred)
            gen_loss.backward()
            # Update the weights
            gen_optimizer.step()
            # Keep track of the average generator loss
            #################################
            # if cur_step > 50:
            #     generator_losses += [gen_loss.item()]
            # if cur_step % 50 == 0 and cur_step > 0:
            #     gen_mean = sum(generator_losses[-display_step:]) / display_step
            #     crit_mean = sum(discr_losses[-display_step:]) / display_step
            #     print("Step {}: Generator loss: {}, discriminator loss: {}".format(cur_step, gen_mean, crit_mean))
            #     step_bins = 20
            #     num_examples = (len(generator_losses) // step_bins) * step_bins
            #     plt.plot(
            #         range(num_examples // step_bins),
            #         torch.Tensor(generator_losses[:num_examples]).view(-1, step_bins).mean(1),
            #         label="Generator Loss"
            #     )
            #     plt.plot(
            #         range(num_examples // step_bins),
            #         torch.Tensor(discr_losses[:num_examples]).view(-1, step_bins).mean(1),
            #         label="Critic Loss"
            #     )
            #     plt.legend()
            #     plt.show()
            cur_step += 1

    return generator, discriminator, ohe, scaler, data_train, data_test, input_dim    

def train_plot(df, device, epochs, batch_size):
    generator, discriminator, ohe, scaler, data_train, data_test, input_dim = train(df, device, epochs = epochs, batch_size = batch_size)
    return generator, discriminator, ohe, scaler, data_train, data_test, input_dim

def print2file(buf, outFile):
    outfd = open(outFile, 'a')
    outfd.write(buf + '\n')
    outfd.close()
if __name__ == "__main__":
    device = torch.device("cuda:0" if (torch.cuda.is_available() and 1 > 0) else "cpu")
    parser = argparse.ArgumentParser()
    # parser.add_argument("df_name", help="Reference dataframe", type=str)
    parser.add_argument("num_epochs", help="Total number of epochs", type=int)
    parser.add_argument("batch_size", help="the batch size", type=int)
    parser.add_argument("fake_name", help="name of the produced csv file", type=str)
    parser.add_argument("size_of_fake_data", help="how many data records to generate", type=int)
    args = parser.parse_args()
    df = pd.read_csv('../Datasets/Adults/adult.csv')
    display_step = 50
    outfile = "results.log"
    for i in range(1):
        if i == 0:
            first_line = "num_trainings: %d, num_epochs: %d, batchsize: %d" % (
            1, args.num_epochs, args.batch_size)
            print(first_line)
            print2file(first_line, outfile)
            second_line = "train_idx ,accuracy_original, accuracy_generated, difference_accuracy, f1_original, f1_generated, difference_f1, demographic_parity_data, demographic_parity_classifier"
            print(second_line)
            print2file(second_line, outfile)
        generator, critic, ohe, scaler, data_train, data_test, input_dim = train_plot(df, device, args.num_epochs, args.batch_size)
        fake_numpy_array = generator(torch.randn(size=(args.size_of_fake_data, input_dim), device=device)).cpu().detach().numpy()
        # fake_df = get_original_data(fake_numpy_array, df, ohe, scaler)
        # print(data_train.shape)
        fake_df_x = fake_numpy_array[:, :-2]
        fake_df_y = np.argmax(fake_numpy_array[:, -2:], axis=1)
        # fake_df = fake_df[df.columns]
        # fake_df.to_csv(args.fake_name, index=False)
        
        # Save the model
        torch.save(generator.state_dict(), os.path.join('', '{}_G_AB.pt'.format('tabfair')))
        # evaluate
        data_train_x = data_train[:, :-2]
        data_train_y = np.argmax(data_train[:, -2:], axis=1)
        data_test_x = data_test[:, :-2]
        data_test_y = np.argmax(data_test[:, -2:], axis=1)
        
        # Original data
        clf = DecisionTreeClassifier()
        clf = clf.fit(data_train_x, data_train_y)
        accuracy_original = accuracy_score(clf.predict(data_test_x), data_test_y)
        f1_original = f1_score(clf.predict(data_test_x), data_test_y)

        # Generated data
        clf = DecisionTreeClassifier()
        clf = clf.fit(fake_df_x, fake_df_y)
        accuracy_generated = accuracy_score(clf.predict(data_test_x), data_test_y)
        f1_generated = f1_score(clf.predict(data_test_x), data_test_y)

        difference_accuracy = accuracy_original - accuracy_generated
        difference_f1 = f1_original - f1_generated
        buf = '%d, %f, %f , %f, %f, %f, %f' % (
            i, accuracy_original, accuracy_generated, difference_accuracy, f1_original, f1_generated, difference_f1)
        print(buf)
        print2file(buf, outfile)


        fake_df = get_original_data(fake_numpy_array, df, ohe, scaler)
        fake_df = fake_df[df.columns]
        fake_df.to_csv(args.fake_name, index=False)