# README

This repository contains the complete pipeline for the paper *"Diffusion-based data augmentation for short-term multivariate energy
prediction in data-scarce scenarios"*. Synthetic multivariate time series are generated with **Diffusion-TS** and then used to augment training data for downstream forecasting models evaluated on the ETTh1 benchmark dataset.

---

## Repository Structure

```
.
├── Diffusion-TS/                        # Generative model (Diffusion-TS, ICLR 2024)
│   ├── Config/                          # YAML configs per dataset (energy.yaml, ...)
│   ├── Data/
│   │   └── datasets/
│   │       ├── ETTh1.csv                            # Raw ETTh1 dataset
│   │       ├── ETTh1_data_split_training.ipynb       # Feature engineering + 85% train split
│   │       └── ETTh1_energy_data.csv                 # Engineered training data used by Diffusion-TS
│   ├── engine/                          # Solver, logger, LR scheduler
│   ├── Models/                          # Interpretable diffusion model
│   ├── Utils/                           # Evaluation metrics & data utilities
│   ├── Experiments/                     # Evaluation notebooks (discriminative, predictive, FID)
│   ├── energy_results/ETTh1/            # Checkpoints & generated synthetic windows
│   ├── figures/                         # PCA / t-SNE / kernel-density plots
│   ├── Tutorial_0.ipynb                 # Main notebook: train & sample Diffusion-TS on ETTh1
│   ├── KL_div_Wasserstein.ipynb         # Distribution comparison: real vs synthetic
│   └── requirements.txt
│
└── Pipeline/
    ├── Electricity Transformer Dataset/
    │   └── ETTh1.csv                    # Raw dataset
    ├── forecasting_pipeline_ETTh1_dataset.ipynb   # Main training & augmentation pipeline
    ├── wandb_experiments.ipynb                    # Results visualisation (heatmaps, lift plots)
    ├── Variance_Bias_Plots.ipynb                  # Bias–variance decomposition
    ├── wandb_mse_updated.csv                      # Exported W&B runs (point forecasting)
    ├── wandb_pinball_updated.csv                  # Exported W&B runs (quantile forecasting)
    ├── Plots/                                     # Heatmaps (MSE / pinball / augmentation ratio)
    ├── lift_plots_PF/                             # Lift curves (point forecasting)
    └── lift_plots_QF/                             # Lift curves (quantile forecasting)
```

---

## Dataset

**ETTh1** (Electricity Transformer Temperature – hourly) from the [ETT benchmark](https://github.com/zhouhaoyi/ETDataset).

| Column | Description |
|--------|-------------|
| HUFL / HULL | High/Low useful load |
| MUFL / MULL | High/Low middle useful load |
| LUFL / LULL | High/Low low useful load |
| **OT** | Oil temperature (forecast target) |

Place `ETTh1.csv` in `Pipeline/Electricity Transformer Dataset/` and in `Diffusion-TS/Data/datasets/`. Running `Diffusion-TS/Data/datasets/ETTh1_data_split_training.ipynb` engineers the time features and writes `ETTh1_energy_data.csv` (the 85% training split used to fit Diffusion-TS, so no val/test rows leak into the generator).

---

## Step 1 — Generate Synthetic Data with Diffusion-TS

Diffusion-TS ([Yuan & Qiao, ICLR 2024](https://openreview.net/forum?id=4h1apFjO99)) is an encoder–decoder transformer diffusion model that disentangles trend and seasonal components to generate realistic multivariate time series.

### Environment setup

```bash
cd Diffusion-TS
pip install -r requirements.txt
```

### Train & sample

Training and sampling are run from **`Diffusion-TS/Tutorial_0.ipynb`**, not from the command line. Open the notebook and run the cells in order:

1. **Build dataset and settings** — loads `Config/energy.yaml` and builds the dataloader from `Data/datasets/ETTh1_energy_data.csv`.
2. **Training models** — calls `trainer.train()`.
3. **Sampling** — calls `trainer.sample(...)` and unnormalizes the output back to raw scale.

Key hyperparameters in `Config/energy.yaml`:

| Parameter | Value |
|-----------|-------|
| Sequence length | 169 |
| Features | 13 |
| Diffusion timesteps | 1000 |
| Max epochs | 25 000 |
| Beta schedule | cosine |
| Loss | L1 |

The final cell saves the synthetic windows to `Diffusion-TS/energy_results/ETTh1/ETTh1_ddpm_fake_energy_raw.npy`. Copy this file to `Pipeline/Electricity Transformer Dataset/ETTh1_ddpm_fake_energy_raw.npy` for use in the forecasting pipeline.

---

## Step 2 — Evaluate Synthetic Data Quality

Before using the generated windows for augmentation, their fidelity to the real ETTh1 distribution is assessed from a few complementary angles, using `Diffusion-TS/Data/datasets/ETTh1_energy_data.csv` (real) against `Diffusion-TS/energy_results/ETTh1/ETTh1_ddpm_fake_energy_raw.npy` (synthetic).

### Distributional similarity

| Metric | What it measures | Where |
|--------|-------------------|-------|
| **PCA plot** | 2-D projection overlap between real and synthetic samples | `Diffusion-TS/figures/ETTh1_pca_plot.png` |
| **t-SNE plot** | Non-linear manifold overlap between real and synthetic samples | `Diffusion-TS/figures/ETTh1_tsne_plot.png` |
| **Kernel density plot** | Per-feature marginal distribution overlap | `Diffusion-TS/figures/ETTh1_kernel_density_plot.png` |
| **KL divergence** | Histogram-based divergence per feature, averaged across features (mean ± std) | `Diffusion-TS/KL_div_Wasserstein.ipynb` |
| **Wasserstein distance** | Earth-mover's distance per feature, averaged across features (mean ± std) | `Diffusion-TS/KL_div_Wasserstein.ipynb` |

The PCA / t-SNE / kernel-density plots are produced by the `visualization()` helper in `Diffusion-TS/Utils/metric_utils.py`, called from `Diffusion-TS/Experiments/metric_tensorflow.ipynb`.

### Downstream utility (`Diffusion-TS/Experiments/`)

| Metric | What it measures | Notebook |
|--------|-------------------|----------|
| **Discriminative score** | \|classification accuracy − 0.5\| of a post-hoc RNN trained to tell real from synthetic windows apart — closer to 0 is better | `metric_tensorflow.ipynb` |
| **Predictive score** | Train-on-synthetic, test-on-real one-step-ahead MAE using a post-hoc RNN | `metric_tensorflow.ipynb` |


Discriminative and predictive scores are exported to `Diffusion-TS/figures/ETTh1_discr_pred_metrics.csv`.

---

## Step 3 — Forecasting Pipeline

The pipeline is implemented in `Pipeline/forecasting_pipeline_ETTh1_dataset.ipynb`.

### Models

| Model | Type |
|-------|------|
| **LSTM** | Stacked LSTM (128 → 64 units) |
| **BiLSTM** | Bidirectional LSTM (128 → 128 units) |
| **XGBoost** | Gradient-boosted trees |

### Features

- Raw sensor readings (HUFL, HULL, MUFL, MULL, LUFL, LULL)
- OT lagged values (lag 0–3 for XGBoost; sliding window of 168 h for DL models)
- Cyclical time encodings: hour, month, day-of-week (sin/cos)

### Data split

| Split | Size | Purpose |
|-------|------|---------|
| Train | 85 % | Model fitting |
| Val 1 | 5 % | Hyperparameter selection |
| Test | 10 % | Final evaluation |

### Data augmentation

Set `data_augmentation=True` and `fake_data_length` to the desired synthetic-to-real ratio: `0.1`, `0.25`, `0.5`, `0.75`, or `1.0` (e.g. `0.5` → 50 % extra samples relative to the training set size). Synthetic windows are loaded from `ETTh1_ddpm_fake_energy_raw.npy`, scaled with the same scaler fitted on real data, and concatenated to the training set.

### Loss modes

| Mode | Description |
|------|-------------|
| **MSE** (`pinball_loss_usage=False`) | Standard point forecasting |
| **Pinball** (`pinball_loss_usage=True`) | Quantile regression at τ ∈ {0.05, 0.50, 0.95} |

### Metrics

**Point forecasting:** MAE, MSE, RMSE, R², SMAPE, MASE

**Quantile forecasting:** Pinball loss (τ = 0.05 / 0.50 / 0.95), 90 % coverage, sharpness (interval width)

---

## Step 4 — Experiment Tracking & Analysis

All runs are tracked with [Weights & Biases](https://wandb.ai) under the `synthetic-data-gan` entity.

| W&B Project | Contents |
|-------------|----------|
| `ETTh1-ENERGY-TIMESERIES-FORECASTING-MSE-TESTING` | Point forecasting sweeps |
| `ETTh1-ENERGY-TIMESERIES-FORECASTING-PINBALL-TESTING` | Quantile forecasting sweeps |

Experiments use W&B Sweeps (grid search) over model type, batch size, seed, and `fake_data_length`. Predictions are logged as W&B artifacts (`.npz` files) for post-hoc analysis.

### Analysis notebooks

| Notebook | Description |
|----------|-------------|
| `Pipeline/wandb_experiments.ipynb` | Boxplots and heatmaps of MSE / pinball metrics; lift plots showing the effect of augmentation ratio |
| `Pipeline/Variance_Bias_Plots.ipynb` | Bias–variance decomposition (Δ% relative to no-augmentation baseline) for both point and quantile forecasting |

> Synthetic data fidelity (KL divergence, Wasserstein distance, PCA/t-SNE/KDE, discriminative/predictive/Context-FID/correlational scores) is covered in [Step 2](#step-2--evaluate-synthetic-data-quality) above.

---

## Key Results

Plots are saved under `Pipeline/Plots/`:

- `heatmap_mse_testing.png` — forecaster comparison on point forecasting metrics
- `heatmap_quant_pinball_testing.png` / `heatmap_stand_pinball_testing.png` — quantile metrics
- `heatmap_augmentation_quantiles.png` — performance vs. augmentation ratio
- `lift_plots_PF/` — lift curves (point forecasting)
- `lift_plots_QF/` — lift curves (quantile forecasting)

---

## Citation

If you use the Diffusion-TS model, please cite:

```bibtex
@inproceedings{yuan2024diffusionts,
  title={Diffusion-{TS}: Interpretable Diffusion for General Time Series Generation},
  author={Xinyu Yuan and Yan Qiao},
  booktitle={The Twelfth International Conference on Learning Representations},
  year={2024},
  url={https://openreview.net/forum?id=4h1apFjO99}
}
```
