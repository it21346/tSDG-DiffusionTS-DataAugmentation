# README (Work-in-progress)

This repository contains the complete pipeline for the paper *"Diffusion-based data augmentation for short-term multivariate energy
prediction in data-scarce scenarios"*. Synthetic multivariate time series are generated with **Diffusion-TS** and then used to augment training data for downstream forecasting models evaluated on the ETTh1 benchmark dataset.

---

## Repository Structure

```
.
├── Diffusion-TS/                        # Generative model (Diffusion-TS, ICLR 2024)
│   ├── Config/                          # YAML configs per dataset (etth.yaml, ...)
│   ├── Data/                            # Dataloader & dataset utilities
│   ├── engine/                          # Solver, logger, LR scheduler
│   ├── Models/                          # Interpretable diffusion model
│   ├── Utils/                           # Evaluation metrics & data utilities
│   ├── Experiments/                     # Evaluation notebooks (discriminative, predictive, FID)
│   ├── KL_div_Wasserstein.ipynb         # Distribution comparison: real vs synthetic
│   ├── main.py                          # Train / sample entry point
│   └── requirements.txt
│
└── Pipeline/
    ├── Electricity Transformer Dataset/
    │   └── ETTh1.csv                    # Raw dataset
    └── Models/DL_XGBoost/ETTh1_dataset_Pipeline/
        ├── forecasting_pipeline_ETTh1_dataset.ipynb   # Main training & augmentation pipeline
        ├── wandb_experiments.ipynb                    # Results visualisation (heatmaps, lift plots)
        ├── Variance_Bias_Plots.ipynb                  # Bias–variance decomposition
        ├── wandb_mse_updated.csv                      # Exported W&B runs (point forecasting)
        └── wandb_pinball_updated.csv                  # Exported W&B runs (quantile forecasting)
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

Place `ETTh1.csv` in `Pipeline/Electricity Transformer Dataset/`. For Diffusion-TS training, also place `ETTh.csv` in `Diffusion-TS/Data/datasets/` (download from the [Diffusion-TS Google Drive link](https://drive.google.com/file/d/11DI22zKWtHjXMnNGPWNUbyGz-JiEtZy6/view?usp=sharing)).

---

## Step 1 — Generate Synthetic Data with Diffusion-TS

Diffusion-TS ([Yuan & Qiao, ICLR 2024](https://openreview.net/forum?id=4h1apFjO99)) is an encoder–decoder transformer diffusion model that disentangles trend and seasonal components to generate realistic multivariate time series.

### Environment setup

```bash
cd Diffusion-TS
pip install -r requirements.txt
```

### Train

```bash
python main.py --name etth --config_file Config/etth.yaml --gpu 0 --train
```

Key hyperparameters in `Config/etth.yaml`:

| Parameter | Value |
|-----------|-------|
| Sequence length | 24 |
| Features | 7 |
| Diffusion timesteps | 500 |
| Max epochs | 18 000 |
| Beta schedule | cosine |
| Loss | L1 |

### Sample (unconditional)

```bash
python main.py --name etth --config_file Config/etth.yaml --gpu 0 \
    --sample 0 --milestone <checkpoint_number>
```

The output `.npy` file (e.g. `OUTPUT/etth/ddpm_fake_etth.npy`) contains the synthetic windows. Copy this file to `Pipeline/Electricity Transformer Dataset/ETTh1_ddpm_fake_energy_raw.npy` for use in the forecasting pipeline.

---

## Step 2 — Forecasting Pipeline

The pipeline is implemented in `Pipeline/Models/DL_XGBoost/ETTh1_dataset_Pipeline/forecasting_pipeline_ETTh1_dataset.ipynb`.

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
| Train | 80 % | Model fitting |
| Val 1 | 5 % | Hyperparameter selection |
| Val 2 | 5 % | Secondary validation |
| Test | 10 % | Final evaluation |

During the **testing stage**, Val 1 is merged into the training set and Val 2 is used for validation, so the test set remains held-out throughout.

### Data augmentation

Set `data_augmentation=True` and `fake_data_length` to a multiplier of the training set size (e.g. `400` → 400 % extra samples). Synthetic windows are loaded from `ETTh1_ddpm_fake_energy_raw.npy`, scaled with the same scaler fitted on real data, and concatenated to the training set.

### Loss modes

| Mode | Description |
|------|-------------|
| **MSE** (`pinball_loss_usage=False`) | Standard point forecasting |
| **Pinball** (`pinball_loss_usage=True`) | Quantile regression at τ ∈ {0.05, 0.50, 0.95} |

### Metrics

**Point forecasting:** MAE, MSE, RMSE, R², SMAPE, MASE

**Quantile forecasting:** Pinball loss (τ = 0.05 / 0.50 / 0.95), 90 % coverage, sharpness (interval width)

---

## Step 3 — Experiment Tracking & Analysis

All runs are tracked with [Weights & Biases](https://wandb.ai) under the `synthetic-data-gan` entity.

| W&B Project | Contents |
|-------------|----------|
| `ETTh1-ENERGY-TIMESERIES-FORECASTING-MSE-TESTING` | Point forecasting sweeps |
| `ETTh1-ENERGY-TIMESERIES-FORECASTING-PINBALL-TESTING` | Quantile forecasting sweeps |

Experiments use W&B Sweeps (grid search) over model type, batch size, seed, and `fake_data_length`. Predictions are logged as W&B artifacts (`.npz` files) for post-hoc analysis.

### Analysis notebooks

| Notebook | Description |
|----------|-------------|
| `wandb_experiments.ipynb` | Boxplots and heatmaps of MSE / pinball metrics; lift plots showing the effect of augmentation ratio |
| `Variance_Bias_Plots.ipynb` | Bias–variance decomposition (Δ% relative to no-augmentation baseline) for both point and quantile forecasting |
| `Diffusion-TS/KL_div_Wasserstein.ipynb` | KL divergence and Wasserstein distance between real and synthetic distributions |

---

## Key Results

Plots are saved under `Pipeline/Models/DL_XGBoost/ETTh1_dataset_Pipeline/Plots/`:

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
