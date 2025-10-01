# Conditional-Wasserstein-GAN-for-Energy-Consumption-in-Large-Buildings

Conditional Wasserstein Generative Adversarial Network with Gradient Penalty and Spectral Normalization. This solution leverages the advantages of multiple architectures:

•	The high-quality results of GANs.

•	The auxiliary information to foster a deterministic behavior of the model from the conditional case.

•	The increased stability of the training process with lower chances of mode collapse and vanishing gradients of the Wasserstein-1 distance.

•	The two-sided gradient penalty, encouraging the norm of the gradient to be as close to 1 as possible, rather than just staying below 1.

•	The simplicity and effectiveness of satisfying the 1-Lipschitz constraint with spectral normalization.

## High Level Architecture

![toate](https://user-images.githubusercontent.com/57152280/164082011-50ecd72b-5fb9-4c14-8854-3dfa1940bf73.png)

cWGAN-GP-SN architecture.

(a) The Generator structure. From noise and labels to electrical data.

(b) The Critic structure. Takes fake/real electrical records and gives scores accordingly.

(c) The bigger picture of the cWGAN-GP-SN architecture.

## Generator structure details:

•	Convolutional layers were used to learn useful patterns while generating data.

•	Upsampling increased the size of the signal.

•	Batch normalization accelerated the convergence.

•	Dense, reshape and flatten layers were used to make different data lengths match.

•	GELU activation function was preferred to avoid the vanishing gradient problem.

•	The last activation function was the hyperbolic tangent to generate data between [-1, 1].

•	Although not necessary, spectral normalization was used to regularize the weights and making the training process more stable.

## Critic structure details:

•	Spectral normalization is used to satisfy the 1-Lipschitz restriction.

•	Convolutional layers with stride equal to two halve the length of the tensors to achieve a proper size.

•	Dense, reshape, flatten and GELU were used here for the same reasons as above.

•	Dropout was used to add extra regularization.

•	The final dense layer has no activation, Wasserstein-1 distance requiring only a real value.

## Evaluation

The evaluation was carried out on the Building Data Genome data set [13] because it appeared recently and only a few projects used it as their main source of data. More specifically, only one paper used GAN before us to enrich it. It is a collection of 507 whole building electrical meters, most of them from American university campuses. Each of these has at least 8760 measurements because the data was collected every hour over the course of one year. Most of the data were obtained by conducting several site visits, but there are also from online sources. To obtain more features, Auto-ARIMA and RFFT / IRFFT were used before data normalization.

## Loss function

The generator’s loss function is complex and consists of three parts:

•	Wasserstein loss. Encourages the generator to produce more realistic data to fool the critic.

•	First order derivatives of the first FFT feature. It uses only the main frequency, so the resulted signal is a straight line.

•	Second order derivatives of the second FFT feature. It is represented by a time series generated from the first 10 dominant frequencies. It is a smooth curve that condenses the behavior of the original signal.

## Visualization vs Baseline

To perform more informative experiments, a cDCGAN model was trained to be compared to the presented cWGAN-GP-SN model. This choice was made because their architectures are very similar. The critical difference between them is the loss function.

![t-SNE](https://user-images.githubusercontent.com/57152280/164080677-7465967d-a5a3-4b94-9da2-8aa016b1b015.png)

This figure shows that more than a half of the real data (red dots) are in only one (right side) cluster, emphasizing its unbalanced character. Synthetic data produced by cDCGAN can be seen only in concentrated clusters and only those ones in the center and right side have real values nearby, which can signal the presence of mode collapse. On the other hand, cWGAN-GP-SN samples are better spread and each real point has at least one generated point nearby, encouraging the idea that this model learned the data distribution without just memorizing specific samples.

## Adversarial Attacks

A multitude of adversarial attacks have been implemented to test the robustness of the classifiers/regressors trained on synthetic data.
The attacks performed were: Fast Gradient Signed Method, Basic Iterative Method, Projected Gradient Descent, Carlini & Wagner, Boundary Attack, Elastic Net, Deep Fool and Newton Fool.

