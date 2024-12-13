import os

from datetime import datetime
import numpy as np
import torch
import torchvision.utils as vutils
import utils

from cgan import Generator as cganG
from cgan import Discriminator as cganD

class Model(object):
    def __init__(self, name, device, data_loader, classes, channels, img_size, latent_dim):
        self.name = name
        self.device = device
        self.data_loader = data_loader
        self.classes = classes
        self.channels = channels
        self.img_size = img_size
        self.latent_dim = latent_dim

        if self.name == 'cgan':
            self.netG = cganG(self.classes, self.channels, self.img_size, self.latent_dim)
            self.netD = cganD(self.classes, self.channels, self.img_size, self.latent_dim)
        self.netG.to(self.device)
        self.netD.to(self.device)
        self.optim_G = None
        self.optim_D = None

    def create_optim(self, lr, alpha = 0.5, beta = 0.999):
        self.optim_G = torch.optim.Adam(filter(lambda p: p.requires_grad, self.netG.parameters()), lr = lr, betas = (alpha, beta))
        self.optim_D = torch.optim.Adam(filter(lambda p: p.requires_grad, self.netD.parameters()), lr = lr, betas = (alpha, beta))

    def train(self, epochs, log_interval = 100, out_dir = '', verbose = True):
        self.netG.train()
        self.netD.train()
        nrows = self.data_loader.batch_size // 8
        viz_noise = torch.randn(self.data_loader.batch_size, self.latent_dim, device = self.device)
        viz_label = torch.LongTensor(np.array([num for _ in range(nrows) for num in range(8)])).to(self.device)
        for epoch in range(epochs):
            for batch_idx, (data, target) in enumerate(self.data_loader):
                data, target = data.to(self.device), target.to(self.device)
                batch_size = data.size(0)
                real_label = torch.full((batch_size, 1), 1., device = self.device)
                fake_label = torch.full((batch_size, 1), 0., device = self.device)

                # Train G
                self.netG.zero_grad()
                z_noise = torch.randn(batch_size, self.latent_dim, device = self.device)
                x_fake_labels = torch.randint(0, self.classes, (batch_size,), device = self.device)
                x_fake = self.netG(z_noise, x_fake_labels)
                y_fake_g = self.netD(x_fake, x_fake_labels)
                g_loss = self.netD.loss(y_fake_g, real_label)
                g_loss.backward()
                self.optim_G.step()

                # Train D
                self.netD.zero_grad()
                y_real = self.netD(data, target)
                d_real_loss = self.netD.loss(y_real, real_label)
                y_fake_d = self.netD(x_fake.detach(), x_fake_labels)
                d_fake_loss = self.netD.loss(y_fake_d, fake_label)
                d_loss = (d_real_loss + d_fake_loss) / 2
                d_loss.backward()
                self.optim_D.step()



                if verbose and batch_idx % log_interval == 0 and batch_idx > 0:
                    print('Epoch {} [{}/{}] loss_D: {:.4f} loss_G: {:.4f}'.format(
                              epoch, batch_idx, len(self.data_loader),
                              d_loss.mean().item(),
                              g_loss.mean().item()
                              ))
                    vutils.save_image(data, os.path.join(out_dir, 'real_samples.png'), normalize=True)
                
                with torch.no_grad():
                    viz_sample = self.netG(viz_noise, viz_label)
                    vutils.save_image(viz_sample, os.path.join(out_dir, 'fake_samples_{}.png'.format(epoch)), nrow = 8, normalize = True)
            self.save_to(path = out_dir, name = self.name, verbose = True)

    def save_to(self, path = '', name = None, verbose = True):
        if name is None:
            name = self.name
        if verbose:
            print('\nSaving models to {}_G.pt and {}_D.pt ...'.format(name, name))
        torch.save(self.netG.state_dict(), os.path.join(path, '{}_G.pt'.format(name)))
        torch.save(self.netD.state_dict(), os.path.join(path, '{}_D.pt'.format(name)))

    def eval(self, mode = None, batch_size = None):
        self.netG.eval()
        self.netD.eval()
        if batch_size is None:
            batch_size = self.data_loader.batch_size
        nrows = batch_size // 8

        # Labels for all classes
        # viz_labels = np.array([num for _ in range(nrows) for num in range(8)])
        # viz_labels = torch.LongTensor(viz_labels).to(self.device)
        #Label for a specific class
        spec_class = 5
        viz_labels = np.array([spec_class for _ in range(batch_size)])
        viz_labels = torch.LongTensor(viz_labels).to(self.device)
        print(viz_labels.shape)
        with torch.no_grad():
            # viz_tensor = torch.randn(batch_size, self.latent_dim, 1, 1, device = self.device)
            viz_tensor = torch.randn(batch_size, self.latent_dim, device = self.device)
            viz_sample = self.netG(viz_tensor, viz_labels)
            viz_vector = utils.to_np(viz_tensor).reshape(batch_size, self.latent_dim)
            cur_time = datetime.now().strftime("%Y%m%d-%H%M%S")
            np.savetxt('vec_{}.txt'.format(cur_time), viz_vector)
            vutils.save_image(viz_sample, 'img_{}.png'.format(cur_time), nrow=8, normalize=True)

    def load_from(self, path = '', name = None, verbose = True):
        if name is None:
            name = self.name
        if verbose:
            print('\nLoading models from {}_G.pt and {}_D.pt ...'.format(name, name))
        ckpt_G = torch.load(os.path.join(path, '{}_G.pt'.format(name)))
        if isinstance(ckpt_G, dict) and 'state_dict' in ckpt_G:
            self.netG.load_state_dict(ckpt_G['state_dict'], strict=True)
        else:
            self.netG.load_state_dict(ckpt_G, strict=True)
        ckpt_D = torch.load(os.path.join(path, '{}_D.pt'.format(name)))
        if isinstance(ckpt_D, dict) and 'state_dict' in ckpt_D:
            self.netD.load_state_dict(ckpt_D['state_dict'], strict=True)
        else:
            self.netD.load_state_dict(ckpt_D, strict=True)
