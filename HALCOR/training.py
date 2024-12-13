import optuna
import IPython
import xgboost as xgb
import argparse
import shap
import wandb
import csv, os, datetime, traceback
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import sys
from wandb.integration.keras import WandbMetricsLogger
import yaml
import tensorflow as tf
from dataset import Dataset
from keras.backend import clear_session
from keras.callbacks import EarlyStopping
from keras.layers import Bidirectional, Conv1D, Dense, Dropout, Flatten, LSTM, MaxPooling1D, RepeatVector, TimeDistributed
from keras.models import Sequential, load_model, save_model
from keras.optimizers import Adam
from math import sqrt
from matplotlib import pyplot
from numpy import concatenate
from os.path import exists
from scikeras.wrappers import KerasRegressor
from scipy import stats
from scipy.stats import pearsonr, spearmanr
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, median_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from tensorflow import keras
from tensorflow.keras.layers import Concatenate, Dense, Embedding, Input, LSTM
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers.schedules import ExponentialDecay
import warnings
warnings.filterwarnings("ignore")
# sys.path.append('../../../')

class Training():
    """
    Class for training in two different tasks, timeseries forecasting and estimation (supervised learning).
    It provides training with Machine Learning models, like XGBoost, and Deep Learning models like BiLSTM and CNN-LSTM.
    It provides functions like preprocessing of the data, training of a model, prediction, plotting. It also offers usage of the Weights & Bias framework, for saving each run with its corresponding plots and metrics.

    Args:
        task (string) : Provide the task you want. 'timeseries' or 'estimation'.
        categorical (string) : Provide whether you want categorical features to be included or not. 'on'  or 'off'.
        interval (string) : Provide an interval parameter for the data granularity. Some choices are '15min', '1h', '4h', '1d', '1w'.
        model_type (string) : Provide a model architecture for training. Some choices are 'BiLSTM', 'CNN-LSTM', 'XGBoost'.
        prediction_mode (int) : Provide a prediction mode (Single-step or Multi-step). 0 for Single-step, 1 for Multi-step.
        batch_size (int) : Provide batch size for training.
        epochs (int) : Provide number of epochs for training.
        multisteps (int) : Provide how many timestep predictions in the future you want the model to predict. For multi-step prediction only.
    """
    def __init__(self, task, categorical, interval, model_type, prediction_mode, batch_size, epochs, multisteps):
        self.interval = interval
        self.task = task
        self.categorical = categorical
        self.data = None
        self.model = None
        self.model_type = model_type
        self.prediction_mode = prediction_mode
        self.batch_size = batch_size
        self.multisteps = multisteps
        self.epochs = epochs
        self.shap_train_data = None
        self.column_names = None
        self.X_train = None
        self.Y_train = None
        self.X_val = None
        self.Y_val = None
        self.X_test = None
        self.Y_test = None
        self.predictions = None
        self.test_data = None # the data for the DMatrix, only for XGBoost
        self.features = None
        self.scaler_X = None
        self.scaler_Y = None
        self.original = None

    def preprocess_data(self):
        """
        Preprocess the data, like cleanup, feature engineering, splitting into sequences for timeseries forecasting and preparing data for model training.
        """
        if self.prediction_mode == 1 and self.task == 'timeseries':
            n_future = self.multisteps  # Number of steps we want to look into the future based on the past (Out).
        else:
            n_future = 1

        if (self.interval == '15min' or self.interval == '1h') and self.prediction_mode == 0:
            n_past = 8
        elif self.interval == '4h' and self.prediction_mode == 0:
            n_past = 6
        elif self.interval == '1d' and self.prediction_mode == 0:
            n_past = 2
        elif self.prediction_mode == 1:
            n_past = self.multisteps # case of multi-step. So past should be at least the same as future

        # Create the dataset with the specified interval
        self.data = Dataset(self.interval)
        self.data = self.data.preprocess()
        self.data.drop(columns=['Real Energy', 'Duration (min)'], inplace=True)
        self.data.rename(columns={'diff' : 'Energy'}, inplace=True)
        # Categorical data
        self.data['Product Group'] = self.data['Product Group'].apply(lambda x: str(x))
        self.data['Product Group'] = pd.Categorical(self.data['Product Group'])
        self.data['SKU code'] = self.data['SKU code'].apply(lambda x: str(x))
        self.data['SKU code'] = pd.Categorical(self.data['SKU code'])
        self.data['Event Code_plc'] = self.data['Event Code_plc'].apply(lambda x: str(x))
        self.data['Event Code_plc'] = pd.Categorical(self.data['Event Code_plc'])
        self.data['Work Center'] = self.data['Work Center'].apply(lambda x: str(x))
        self.data['Work Center'] = pd.Categorical(self.data['Work Center'])
        self.data['Event Code_mes'] = self.data['Event Code_mes'].apply(lambda x: str(x))
        self.data['Event Code_mes'] = pd.Categorical(self.data['Event Code_mes'])
        categorical_data = self.data.select_dtypes(['category'])
        # Numerical data
        if self.model_type == 'XGBoost' and self.task != 'estimation':
            for i in range(1, n_past + 1):
                self.data[f'lag_{i}'] = self.data['Energy'].shift(i)
        
        # Feature engineering of the timestamp feature into cyclical encoding
        self.data['Timestamp'] = pd.to_datetime(self.data['Timestamp'])
        self.data['hour_sin'] = np.sin(2 * np.pi * self.data['Timestamp'].dt.hour / 24)
        self.data['hour_cos'] = np.cos(2 * np.pi * self.data['Timestamp'].dt.hour / 24)
        self.data['day_of_week_sin'] = np.sin(2 * np.pi * self.data['Timestamp'].dt.dayofweek / 7)
        self.data['day_of_week_cos'] = np.cos(2 * np.pi * self.data['Timestamp'].dt.dayofweek / 7)
        self.data['month_sin'] = np.sin(2 * np.pi * self.data['Timestamp'].dt.month / 12)
        self.data['month_cos'] = np.cos(2 * np.pi * self.data['Timestamp'].dt.month / 12)
        if self.interval == '15min':
            self.data['interval_sin'] = np.sin(2 * np.pi * self.data['Timestamp'].dt.minute // 15 / 4)
            self.data['interval_cos'] = np.cos(2 * np.pi * self.data['Timestamp'].dt.minute // 15 / 4)
        self.data = self.data.drop(columns = ['Timestamp'])
        cols = list(self.data)                 
        self.data = self.data.drop(columns = ['Product Group', 'SKU code', 'Event Code_plc', 'Work Center', 'Event Code_mes'])
        self.features = len(self.data.columns)
        # Forming the sequences for both categorical and numerical data
        features = len(cols) - 1  # Number of features
        # Function to split sequences
        def split_sequence(X, Y, steps, out):
            Xs, Ys = list(), list()
            for i in range(len(X)):
                end = i + steps
                outi = end + out
                if outi > len(X)-1:
                    break
                seqx, seqy = X[i:end], Y[end:outi]
                Xs.append(seqx)
                Ys.append(seqy)
            return np.array(Xs), np.array(Ys)
        
        categorical_data = pd.get_dummies(categorical_data, columns = list(categorical_data), dtype=np.int64)
        if self.categorical == 'on':
            self.data = pd.concat([self.data, categorical_data], axis = 1)
        X = self.data.drop(columns='Energy')
        self.column_names = X.columns
        Y = self.data['Energy']
        # Train/test splitting
        X_train_temp, X_temp, y_train_temp, y_temp = train_test_split(X.values, Y.values, test_size=0.15, random_state=42, shuffle= False)
        X_val, X_test, Y_val, Y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42, shuffle= False)
        X_train, Y_train = X_train_temp, y_train_temp
        # Scale only the training data, and then apply to the rest of the splits. Also two scalers, for X and Y
        self.scaler_X = MinMaxScaler()
        self.X_train = self.scaler_X.fit_transform(X_train)
        self.scaler_Y = MinMaxScaler()
        self.Y_train = self.scaler_Y.fit_transform(Y_train.reshape(-1, 1))
        #scale val/test sets
        self.X_val = self.scaler_X.transform(X_val)
        self.Y_val = self.scaler_Y.transform(Y_val.reshape(-1, 1))
        self.X_test = self.scaler_X.transform(X_test)
        self.Y_test = self.scaler_Y.transform(Y_test.reshape(-1, 1))
        if self.model_type != "XGBoost" and self.task == 'timeseries':
            # Split into sequences before feeding into DL
            self.X_train , self.Y_train =  split_sequence(self.X_train, self.Y_train, n_past, n_future)
            self.X_val , self.Y_val =  split_sequence(self.X_val, self.Y_val, n_past, n_future)
            self.X_test , self.Y_test =  split_sequence(self.X_test, self.Y_test, n_past, n_future)

    def train_model(self):
        """
        Training the models. Depending on the task, estimation or timeseries, and depending on the model used, ML or DL models.
        """
        checkpoint_callback = keras.callbacks.ModelCheckpoint(
                    f'./models/{self.model_type}-model-{self.interval}-{self.prediction_mode}.keras',        # Path to save the model
                    monitor='val_loss',     # Metric to monitor
                    save_best_only=True,    # Save only the best model
                    mode='min',             # Save when the quantity monitored has stopped decreasing
                    verbose=1               # Verbosity mode
        )
        early_stopping_callback = keras.callbacks.EarlyStopping(
                    monitor='val_loss',     # Metric to monitor
                    patience=10,             # Number of epochs with no improvement after which training will stop
                    mode='min',             # Stop when the quantity monitored has stopped decreasing
                    verbose=1,              # Verbosity mode
                    restore_best_weights=True  # Restore model weights from the epoch with the best validation loss
        )
        if self.model_type == 'BiLSTM':
            model = self.BiLSTM()
        elif self.model_type == 'CNN-LSTM':
            model = self.CNN_LSTM()
        else:
            self.model, test_data = self.XGBoost()
            self.test_data = test_data
        
        if self.model_type != 'XGBoost':
            self.model = model
            self.model.fit(self.X_train, self.Y_train[:, :, 0], validation_data=(self.X_val, self.Y_val[:, :, 0]), epochs=self.epochs, batch_size=self.batch_size, callbacks=[checkpoint_callback, early_stopping_callback, WandbMetricsLogger()], verbose=1, shuffle=False)
        # Get predictions
        if self.task == 'estimation':
            self.predictions = self.model.predict(self.test_data)
        else:
            if self.model_type != 'XGBoost':
                self.predictions = self.model.predict(self.X_test)
            else:
                self.predictions = self.model.predict(self.test_data)

    def predict(self):
        """
        Function to make predictions (inference) on test data (unseen data).
        """
        if self.prediction_mode == 0:
            # descale
            if self.model_type == 'XGBoost':
                test_data_len = self.test_data.get_data()
                shape1 = test_data_len.shape[0]
                shape2 = test_data_len.shape[1]
            else:
                shape1 = self.X_test.shape[0]
                shape2 = self.X_test.shape[1]
            
            zeros = np.zeros((shape1, self.features))
            for i in range(zeros.shape[0]):
                zeros[i][0] = self.predictions[i]

            self.predictions = self.scaler_Y.inverse_transform(zeros)
            self.predictions = [i[0] for i in self.predictions]

            zeros = np.zeros((shape1, self.features))
            for i in range(zeros.shape[0]):
                zeros[i][0] = self.Y_test[i]
            self.original = self.scaler_Y.inverse_transform(zeros)
            self.original = [i[0] for i in self.original]

            mae = mean_absolute_error(self.original, self.predictions)
            rmse = np.sqrt(mean_squared_error(self.original, self.predictions))
            r2 = r2_score(self.original, self.predictions)
            wandb.log({"R^2 score" : r2})
            n = len(self.original)
            p = shape2
            def adjusted_r2(r2, n, p):
                """
                Calculate the adjusted R² score.
                :param r2: The R² score.
                :param n: Number of data points.
                :param p: Number of features.
                :return: Adjusted R² score.
                """
                return 1 - ((1 - r2) * (n - 1) / (n - p - 1))
            adjusted_r2_value = adjusted_r2(r2, n, p)

            print(f'Mean Absolute Error (MAE): {mae}')
            print(f'Mean squared error (MSE): {mean_squared_error(self.original, self.predictions)}')
            print(f'Root Mean Squared Error (RMSE): {rmse}')
            print(f'R² Score: {r2}')
            print(f"Adjusted R² Score: {adjusted_r2_value}")
        else:
            zeros = np.zeros((self.X_test.shape[0], self.features))
            zeros[:, :self.multisteps] = self.predictions
            self.predictions = self.scaler_Y.inverse_transform(zeros)
            self.predictions = self.predictions[:, :self.multisteps]


            zeros = np.zeros((self.X_test.shape[0], self.features))
            zeros[:, :self.multisteps] = self.Y_test[:, :, 0]
            self.original = self.scaler_Y.inverse_transform(zeros)
            self.original = self.original[:, :self.multisteps]

            # Calculate metrics
            def adjusted_r2(r2, n, p):
                """
                Calculate the adjusted R² score.
                :param r2: The R² score.
                :param n: Number of data points.
                :param p: Number of features.
                :return: Adjusted R² score.
                """
                return 1 - ((1 - r2) * (n - 1) / (n - p - 1))

            # Function to calculate MAPE
            def mean_absolute_percentage_error(y_true, y_pred):
                """
                Calculate the Mean Absolute Percentage Error (MAPE).
                :param y_true: Actual values.
                :param y_pred: Predicted values.
                :return: MAPE value.
                """
                y_true, y_pred = np.array(y_true), np.array(y_pred)
                return np.mean(np.abs((y_true - y_pred) / y_true)) * 100

            mae = mean_absolute_error(self.original, self.predictions)
            mse = mean_squared_error(self.original, self.predictions)
            rmse = np.sqrt(mse)  # Calculate RMSE
            r2 = r2_score(self.original, self.predictions)
            wandb.log({"R^2 score" : r2})

            n = len(self.original)
            p = self.X_test.shape[1] 
            adjusted_r2_value = adjusted_r2(r2, n, p)
            # Print the metrics
            print(f'Mean Absolute Error (MAE): {mae}')
            print(f'Mean Squared Error (MSE): {mse}')
            print(f'Root Mean Squared Error (RMSE): {rmse}')
            print(f'R² Score: {r2}')
            print(f"Adjusted R² Score: {adjusted_r2_value}")

    def BiLSTM(self):
        """
        Constructing the Bidirectional LSTM architecture.

        Returns:
            model (keras.model) : Returns the keras model.
        """
        lr_schedule = ExponentialDecay(0.0001, decay_steps=2500, decay_rate=0.96, staircase=True)
        model = Sequential()
        model.add(Bidirectional(LSTM(50, activation='relu', return_sequences=True, dropout= 0.1, recurrent_dropout= 0.2, input_shape=(self.X_train.shape[1], self.X_train.shape[2])), merge_mode='concat'))
        model.add(Dropout(0.2))
        model.add(Bidirectional(LSTM(50, activation='relu', return_sequences=False, dropout= 0.1, recurrent_dropout= 0.2), merge_mode='concat'))
        model.add(Dropout(0.2))
        if self.prediction_mode == 0:
            model.add(Dense(1, activation='sigmoid'))
        else:
            model.add(Dense(self.multisteps, activation='sigmoid'))
        optimizer = Adam(learning_rate=lr_schedule)
        model.compile(loss='mean_squared_error', optimizer=optimizer, metrics=['mae', 'mape'])
        return model
    
    def CNN_LSTM(self):
        """
        Constructing the CNN-LSTM architecture.

        Returns:
            model (keras.model) : Returns the keras model.
        """
        lr_schedule = ExponentialDecay(0.0001, decay_steps=2500, decay_rate=0.96, staircase=True)
        model = Sequential()
        model.add(Conv1D(filters=32, kernel_size=3, activation='relu', input_shape=(self.X_train.shape[1], self.X_train.shape[2])))
        model.add(Conv1D(filters=64, kernel_size=3, activation='relu'))
        model.add(MaxPooling1D(pool_size=2))
        model.add(Dropout(0.2))
        model.add(LSTM(128, activation='relu'))
        model.add(Dropout(0.2))
        if self.prediction_mode == 0:
            model.add(Dense(1, activation='sigmoid'))
        else:
            model.add(Dense(self.multisteps, activation='sigmoid'))
        optimizer = Adam(learning_rate=lr_schedule)
        model.compile(loss='mean_squared_error', optimizer=optimizer, metrics=['mae', 'mape'])
        return model
    
    def XGBoost(self):
        """
        Constructing the XGBoost architecture.

        Returns:
            model (xgb.Booster) : Returns the XGBoost trained model.
            test_data (xgb.DMatrix) : Returns the test data in the DMatrix format to be used later.
        """
        train_data = xgb.DMatrix(self.X_train, label=self.Y_train)
        # enforce saving the train_data here to use for plotting in save_plots() for SHAP
        self.shap_train_data = train_data
        val_data = xgb.DMatrix(self.X_val, label=self.Y_val)
        test_data = xgb.DMatrix(self.X_test, label=self.Y_test)
        params = {
            'objective': 'reg:squarederror',  # Use squared error for regression
            'eval_metric': 'rmse',  # Root Mean Squared Error as evaluation metric
            'learning_rate': 0.001,  # Small learning rate to avoid overfitting
            'max_depth': 5,         # Controls the complexity of the model (higher values may overfit)
            'n_estimators': 30000,    # Number of boosting rounds (you can tune this)
            'early_stopping_rounds': 50,  # Stop if there's no improvement after 50 rounds
            'alpha' : 0.1,
            'lambda' : 0.1,
        }
        # Use a validation set to avoid overfitting
        evals = [(train_data, 'train'), (val_data, 'eval')]
        evals_result = {}
        # Train the XGBoost model
        model = xgb.train(params, train_data, evals=evals, num_boost_round=30000, early_stopping_rounds=400, verbose_eval=100, evals_result = evals_result)
        for epoch in range(1, len(evals_result['train']['rmse']) + 1):
            wandb.log({
                "epoch": epoch,  # Log current epoch (1-indexed)
                "train_loss": evals_result['train']['rmse'][epoch-1],  # Training loss
                "val_loss": evals_result['eval']['rmse'][epoch-1]
            })
        return model , test_data

    def load_model(self):
        pass

    def save_plots(self):
        """
        Function to plot the original data over the predictions for each task and model used. Useful graphical representation (evaluation) for gaining insights of how well a model was trained for a specific task by projecting the predicted data points onto the original data points.
        """
        if self.prediction_mode == 0 or self.task == 'estimation':
            plt.figure(figsize=(20,8))
            plt.plot(self.predictions, label='prediction', color="r")
            plt.plot(self.original, label='actual', marker='.')
            plt.legend()
            plt.ylabel('Energy', size=15)
            plt.xlabel('Time step', size=15)
            plt.legend(fontsize=15)
            wandb.log({self.task: wandb.Image(plt.gcf())})
            plt.clf()
            # If the model used is XGBoost, then provide feature importance and SHAP (XAI).
            if self.task == 'estimation' or self.model_type == 'XGBoost':
                importance = self.model.get_score(importance_type='weight')
                # Convert the importance dictionary to a DataFrame for easier plotting
                importance_df = pd.DataFrame(importance.items(), columns=['Feature', 'Importance'])
                self.column_names = list(self.column_names)
                importance_df['Feature'] = importance_df['Feature'].replace(
                        {f'f{i}': self.column_names[i] for i in range(len(self.column_names))}
                )
                importance_df = importance_df.sort_values(by='Importance', ascending=False)
                plt.figure(figsize=(12, 8))
                if len(importance_df['Feature']) > 20:
                    # Plot the best 20 features
                    plt.barh(importance_df['Feature'][:20], importance_df['Importance'][:20])
                else:
                    plt.barh(importance_df['Feature'], importance_df['Importance'])
                plt.xlabel('Importance' + self.task)
                plt.title('Feature Importance')
                wandb.log({self.task: wandb.Image(plt.gcf())})
                plt.clf()

                # Initialize the SHAP explainer
                explainer = shap.Explainer(self.model, self.shap_train_data.get_data().toarray())
                shap_values = explainer(self.test_data.get_data().toarray())
                # Visualize the SHAP values
                shap.summary_plot(shap_values, self.test_data.get_data().toarray(), feature_names=self.column_names, show=False)
                wandb.log({self.task: wandb.Image(plt.gcf())})
                plt.clf()
        else:
            # Number of samples to visualize
            n_samples_to_plot = 3  # Number of samples to plot
            plt.figure(figsize=(25, 10))
            for i in range(n_samples_to_plot):
                plt.subplot(n_samples_to_plot, 1, i + 1)
                plt.plot(range(self.multisteps), self.original[i], marker='o', label='Ground Truth', color='blue')
                plt.plot(range(self.multisteps), self.predictions[i], marker='x', label='Predictions', color='red')
                plt.title(f'Sample {i + 1}')
                plt.xlabel('Time Steps')
                plt.ylabel('Value')
                plt.legend()
                plt.grid(True)

            plt.tight_layout()
            wandb.log({"Multi-step Timeseries": wandb.Image(plt.gcf())})
            plt.clf()



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Training process. Choose to train the model either with Bi-LSTM, CNN-LSTM, or XGBoost.")
    #Arguments
    parser.add_argument('--task', default = 'timeseries', help="Provide the task you want. Timeseries or Estimation.")
    parser.add_argument('--interval', default = '15min', help="Provide an interval parameter for the data granularity. Some choices are '15min', '1h', '4h', '8h', '1d'.")
    parser.add_argument('--model_type', default = 'BiLSTM', help="Provide a model architecture for training. Some choices are 'BiLSTM', 'CNN-LSTM', 'XGBoost'.")
    parser.add_argument('--prediction_mode', default = 0, type=int,  help="Provide a prediction mode (Single-step or Multi-step). 0 for single-step, 1 for Multi-step.")
    parser.add_argument('--batch_size', default = 16, type=int, help="Provide batch_size.")
    parser.add_argument('--epochs', default = 50, type=int, help="Provide epochs.")
    parser.add_argument('--multisteps', default = 4, type=int, help="Provide how many timestep predictions in the future you want the model to predict. For multi-step prediction only.")
    parser.add_argument('--categorical', default = 'off', help="Provide whether you want categorical features to be included or not.")

    #additional for training
    parser.add_argument('--config', type=str, help="Path to config YAML")
    args = parser.parse_args()

    task = args.task
    interval = args.interval
    model_type = args.model_type
    prediction_mode = args.prediction_mode
    batch_size = args.batch_size
    epochs = args.epochs
    multisteps = args.multisteps
    categorical = args.categorical
    
    if args.config:
        with open(args.config, "r") as stream:
            config = yaml.safe_load(stream)

        print("YAML configuration loaded.")
        print(config['runs'])
        for run_config in config['runs']:
            if run_config['prediction_mode'] == 0:
                name_ = f"{run_config['task']}_categorical:{run_config['categorical']}_{run_config['model_type']}_{run_config['interval']}_single-step"
            else:
                name_ = f"{run_config['task']}_categorical:{run_config['categorical']}_{run_config['model_type']}_{run_config['interval']}_multi-step:{run_config['multisteps']}"

            wandb.init(
                project = "HALCOR",
                name = name_,
                config = run_config
            )
            run = Training(run_config['task'], run_config['categorical'], run_config['interval'], run_config['model_type'], run_config['prediction_mode'], run_config['batch_size'], run_config['epochs'], run_config['multisteps'])
            run.preprocess_data()
            run.train_model()
            run.predict()
            run.save_plots()
            wandb.finish()

    else:
        run = Training(task, categorical, interval, model_type, prediction_mode, batch_size, epochs, multisteps)
        run.preprocess_data()
        run.train_model()
        run.predict()
        run.save_plots()

    # Example terminal command for running the script without a config.yaml file.
    # python3 ./training.py --task timeseries --categorical 'off' --interval '15min' --model_type 'BiLSTM' --prediction_mode 0 --batch_size 16 --epochs 50