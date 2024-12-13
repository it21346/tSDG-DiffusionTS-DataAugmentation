# Mathematical apparatus of NNs

## Linear algebra
- **Scalars** : A single number
- **Vectors** : One-dimensional array of numbers
- **Matrices** : Two-dimensional array of numbers
- **Tensors** : Multi-dimensional array with properties like *Rank*, *Shape* and *Data type*
    - *Rank* : Indicates the number of array dimensions. For example, a tensor of rank 2 is a matrix. Also, the tensor has no limit on the number of dimensions.
    - *Shape* : The size of each dimension
    - *Data type* : Indicates the data types of the tensor elements (e.g, integer(8|16|32|64), float(16|32|64))

- Tensorflow and Pytorch use tensors as their main data structure
- The **transpose** of an *mxn* matrix is an *nxm* matrix
- **Matrix-scalar multiplication** is the multiplication of a matrix by a scalar value
- **Matrix-matrix addition** is the element-wise addition of one matrix with another. Matrices must have the same size
- **Matrix-vector multiplication** is the multiplication of a matrix by a vector. The number of matrix columns must be equal to the vector length. The result of an *mxn* matrix and an *n*-dimensional vector is an *m*-dimensional vector
- **Matrix multiplication** is the multiplication of one matrix with another. The number of columns of the first matrix must be equal to the number of rows of the second. It can be considered as multiple matrix-vector multiplications, where each column of the second matrix is one vector. The result of an *mxn* matrix and an *nxp* matrix  is an *mxp* matrix.

## Probability theory

- **Statistical experiment** : It has the following properties:
  - Consists of multiple independent trials
  - The outcome of each trial is non-deterministic
  - It has more than one possible outcome. These outcomes are known as **events**
  - All the possible outcomes of the experiment are known in advance
  
- **Probability** is the likelihood that some event *e* could occur and can be denoted with \( P(e)\):
    \[ P(e) = \frac{\text{Number of successful outcomes}}{\text {total number of outcomes}} \]


- **Probability Distributions** :
    - **Binomial Distribution** : Used in binomial experiments. A binomial experiment has only two possible outcomes, success or failure. An example of such is the coin toss experiment.
    - **Normal (Gaussian) Distribution** : It resembles a bell-shaped curve and has the following properties. First, the curve is symmetric along its center, which is also the maximum value. In addition, the shape and location of the curve are fully described by the mean and standard deviation.

## Information theory

- We can think of **entropy** as a measurement of uncertainty or chaos. Entropy is highest when the outcomes are equally likely and decreases when one outcome becomes prevalent

- Now, let's assume we have a random Varible \( X\) and two different propability distributions over it. This is the usual scenario where a NN produces some output propability distribution \( Q(X)\) and we compare it to a target distribution \( P(X)\) during training. We can measure the difference between these two distributions with **cross-entropy**:

    \[ H(P,Q)  = - \sum_{i=1}^{n} P(X = x_i)\log{Q(X = x_i)} \]

- Another measure of the difference between two propabilities is the **Kullback-Leibler divergence (KL divergence)**. It measures the difference between the target and predicted log propabilities. It also holds a relationship between the entropy and cross-entropy.

    \[ {D_K}_L(P || Q) = H(P,Q) - H(P) \]


## Differential calculus

- Let's say we have a function \( f(x)\) with a single parameter \( x\). We can get a relative idea of how \( f(x)\) changes with respect to \( x\) at any value of \( x\) by calculating the slope of the function at that point. If the slope is positive, the function increases and if it's negative, it decreases. We can calculate this with the **derivatives**. The process of findinf the derivative is called **differentiation**.

- **Softmax** is an activation function of the output layer in classification problems.

    \[ f(z_i) = \frac{exp(z_i)}{\sum_{j=1}^{n}exp(z_j)}\]
The denominator in this formula acts as a normalizer. *Softmax* has some important properties:
  - Every value is in the \([0,1]\) range.
  - The total sum of values of *z* is equal to 1.
  - The function is differentiable.

In other words, we can interpret the softmax output as a propability distribution of a discrete random variable. It also has the effect to increase the propability of the higher scores compared to lower ones.
# Hands-On Generative Adversarial Networks with PyTorch 1.x-Packt Publishing (2019)

## Model design cheat sheet

### Overall model architecture design
There are two different design processes for DL models, generally.
- Design the whole network directly, especially for shallow networks.
- Design a small block/cell and repeat the blocks several times to form the whole network.

For example, U-net-shaped and ResNet-shaped networks are architectures designed via a block-based approach and use skip connections to connect non-adjacent layers. 

In addition, there are two forms of data flow in neural networks:
- *Plain network*: Any layer within the network only has at most one input and one output.
- *Branching network*: At least one of the layers is connected to more than two other layers, such as ResNet. 

Often, plain networks are used for the discriminators and branching architectures for the generators.

When dealing with branches in a network, how several branches are merged has a great impact on the network's performance. Some recommended approaches are:
- Concatenate all the tensors into a list and create another convolution layer to map this list to a smaller tensor. This way, information from all the input branches is reserved and the relationship between them is learned by the convolution layer. For very deep networks, this approach might be more memory consuming and more parameters means its more vulnerable to overfitting.
- Directly sum the overall input tensors. This is easy to implement but may not perform well when there are too many input branches.
- Assign trainable weight factors to the branches before summing them up. This way the merged tensor would be the weighted sum of the input tensors. It allows the network to figure out which inputs it should reply to and gives you a chance to remove any unnecessary branches if their trained weight factors are too close to 0.

### Choosing a convolution operation method
There are various types of convolution operations, with different configurations and results.
1. **Vanilla convolution**: The most common operation in CNNs. A convolution takes fewer parameters than a FC layer and can be calculated pretty fast. (**`im2col`**)
2. **Grouped convolution**: The connections between the input/output neurons are separated into groups. One can create a grouped convolution by calling **`nn.Conv2d`** when assigning the *`groups`* argument. It is ofter followed by another convolution layer with a kernel size of 1 so that the information from different groups can be mixed together. It has fewer parameters than a vanilla convolution.
3. **Depthwise separable convolution**: This is a grouped convolution where the group size equals the input channels, followed by a \(1 x 1\) convolution. It also has fewer parameters than a vanilla convolution and is extremely popular among tiny networks for mobile devices. It is often used to see whether two depthwise separable convolutions appear together and result in better performance.
```
class SepConv(nn.Module):
    def __init__(self, C_in, C_out, kernel_size, stride, padding, affine = True):
        super(SepConv, self).__init__()
        self.op = nn.Sequential(
            nn.ReLU(inplace = False),
            nn.Conv2d(C_in, C_in, kernel_size = kernel_size, stride = stride, padding= padding, groups = C_in, bias = False),
            nn.Conv2d(C_in, C_in, kernel_size = 1, padding = 0, bias = False),
            nn.BatchNorm2d(C_in, affine = affine),
            nn.ReLU(inplace=False),
            nn.Conv2d(C_in, C_in, kernel_size = kernel_size, stride = 1, padding = padding, groups = C_in, bias = False),
            nn.Conv2d(C_in, C_out, kernel_size = 1, padding = 0, bias = False),
            nn.BatchNorm2d(C_out, affine = affine)
        )
    
    def forward(self, x):
        return self.op(x)
```
4. **Dilation convolution** : This has a larger reception field compared to vanilla convolution. For example, a \(3x3\) dilation has a \(5x5\) sliding window, in which input pixels are samples - one for every two adjacent steps. It is recommended to not use other variations of convolution with dilation convolution in the same network.

```
class DilConv(nn.Module):
    def __init__(self, C_in, C_out, kernel_size, stride, padding, dilation, affine = True):
        super(DilConv, self).__init__()
        self.op = nn.Sequential(
            nn.ReLU(inplace = False),
            nn.Conv2d(C_in, C_in, kernel_size=kernel_size, stride=stride, padding=padding, dilation=dilation, groups=C_in, bias=False),
            nn.Conv2d(C_in, C_out, kernel_size = 1, padding = 0, bias = False),
            nn.BatchNorm2d(C_out, affine = affine)
        )
    def forward(self, x):
        return self.op(x)
```
### Choosing a downsampling operation method
Downsampling is often trickier than upsampling since we don't want to lose too much useful information in the smaller tensors. Similarly to the convolution operations, downsampling operations are several:

1. **Max-pooling** (`nn.MaxPool2d`): This operation selects the maximum value in the sliding window. It is quite popular but at the same time, the maximum value is not necessarily the most significant feature in a feature map.
2. **Average-pooling** (`nn.AvgPool2d` or `nn.AdaptiveAvgPool2d`): This operation takes the average value over a sliding window. It is becoming more and more popular than max-pooling. If you want to perform fast downsampling, you should choose average-pooling over max-pooling.
3. **Strided convolution**: It is a convolution with a stride size larger than 1. This approach can extract features and decrease the tensor size at the same time. Worth noting is that there can be a huge amount of information loss, because the sliding window skips a lot of pixels while it's calculating. A decrease in the feature map size is often accompanied by an increase in the channel size. For example, a mini-batch tensor \([32, 8, 256, 256]\) is often downsampled to \([32, 16, 128, 128]\), so the output tensor contains a similar amount of information to the input tensor.
4. **Factorized reduction**: It performs two strided convolutions with a slight shift. In this approach, the second convolution covers the skipped pixels by the first convolution. It contains more parameters and takes longer to train. If you have more than enough GPU memory to spare, use factorized reduction in your model. If not, using the strided convolution would save a lot of memory.
```
class FactorizedReduce(nn.Module):
    def __init__(self, C_in, C_out, affine = True):
        super(FactorizedReduce, self).__init__()
        assert C_out % 2 == 0
        self.relu = nn.ReLU(inplace = False)
        self_conv_1 = nn.Conv2d(C_in, C_out // 2, 1, stride=2, padding=0, bias=False)
        self_conv_2 = nn.Conv2d(C_in, C_out // 2, 1, stride=2, padding=0, bias=False)
        self.bn = nn.BatchNorm2d(C_out, affine = affine)
        
    def forward(self, x):
        x = self.relu(x)
        #For conv_2 the input tensor is sliced to remove the first row and the first column. 
        #This effectively shifts the feature map and creates different receptive fields which can make the network capture more diverse spatial information.
        out = torch.cat([self.conv_1(x), self.conv_2(x[:, :, 1:, 1:])], dim = 1)
        out = self.bn(out)
        return out
```

### Model training cheat sheet

- Uniform distributions `nn.init.uniform_(tensor, a, b)` are often used for fully-connected layers and normal distributions `nn.init.normal_(tensor, a, b)` are often used for convolution layers.
- There are two common regularization terms, **L1-loss** and **L2-loss**. The L1-loss produces more sparse results (where few outliers with values larger than 0 are tolerated), while the L2-loss tends to produce more dense results (where most values are closer to 0). It is worth noting that L2-regularization (**L2-penalty**) on the parameters is essentially the same as **weight decay**.
- The gradient basically tells us how to update our parameters. Larger gradients lead to bigger changes being applied to our parameters. This may lead to jumping far away from the region we are searching and make us start looking for optimal solutions in another region. Therefore, **Gradient clipping** and setting limitations on their maximum/minimum values can make sure we don't jeopardize our previous search results while spending a long time training. (`nn.utils.clip_grad_norm`) 


# Python Deep Learning_ Exploring deep learning techniques, neural network architectures and GANs with PyTorch, Keras and Tensorflow (2019)

## Example 1
After loading the Iris dataset and appropriately preprocessing, we create a Sequential model. This is achieved with `torch.nn.Sequential()` and the layers of this specific model can be `torch.nn.ReLU()` or `torch.nn.Linear()`.

Then for a specified number of epochs, we loop through them and initialize our **inputs** and **targets**. 

```inputs = torch.autograd.Variable(torch.Tensor('input').float())```
```targets = torch.autograd.Variable(torch.Tensor('target').long()) ```

The `torch.autograd` provides classes and functions implementing automatic differentiation of arbitrary scalar valued functions. You only need to declare the `Tensor`.

Next, we first need to clear out the gradients stored in the parameters of the model, with `optimizer.zero_grad()`. This is just in case there are parameters stored from previous runs.

Passing the *inputs* variable into our model (**forward pass**) and initializing our loss function is the next step. For this example, the loss is going to be `torch.nn.CrossEntropyLoss()` where we pass as parameters the *output of our model* and the *targets* variables.

Following, we need to compute the gradients of the loss function with respect to the parameters of the model by using the `loss.backward()` (**backward pass**). PyTorch accumulates the gradients in the parameters' `.grad()` attributes, and in this case the `.zero_grad()`.

Next, we use the `torch.optim.SGD()` as our optimizer and we need to update the the parameters of the model. We do this by using `optimizer.step()`. 

This was all for the training of the model. We now need to check the final accuracy with the testset.

We initialize the *inputs* and *targets* like in training, but this time we use the testset. We `optimizer.zero_grad()` and do the forward-pass like in training. However, now we have the output of the forward-pass from our model and therefore we can compute the prediction of the model.

We do this process by passing our output data to `torch.max()` and specifically `torch.max('out', 1)` along dimension 1. Now we have the maximum from each row from our `torch.Tensor()` and these are the predictions of the model for each sample in the testset.

Continuing, we calculate the accuracy of our model by the sum of the correctly predicted targets, divided by the size of our testset.