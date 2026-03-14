# MedIoT Shield — Healthcare IoT Security Monitoring System

A real-time security monitoring platform for healthcare IoT networks that detects malicious activity using an ensemble of three ML algorithms, assigns trust scores to devices, and provides a comprehensive Next.js dashboard for visualization and analysis.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   IoT-23 Dataset                     │
│        (Zeek conn.log.labeled files)                 │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  Preprocessing  │
              │  & Feature Eng  │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  ┌───────────┐  ┌──────────┐  ┌──────────┐
  │ Isolation  │  │ XGBoost  │  │  CUSUM   │
  │  Forest    │  │Classifier│  │ Change   │
  │(Anomaly)   │  │(Supervised)│ │ Point    │
  └─────┬─────┘  └────┬─────┘  └────┬─────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
              ┌────────▼────────┐
              │  Trust Score    │
              │    Engine       │
              └────────┬────────┘
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
     ┌──────────┐ ┌─────────┐ ┌─────────────┐
     │  Alerts  │ │ Attack  │ │  Next.js    │
     │  Engine  │ │Overview │ │  Dashboard  │
     └──────────┘ └─────────┘ └─────────────┘
```

## ML Pipeline

### 1. Isolation Forest (Unsupervised Anomaly Detection)
- Trained on **benign-only** traffic to learn normal behavior
- `contamination=0.1`, `n_estimators=100`
- Flags connections that deviate from learned baseline

### 2. XGBoost Classifier (Supervised Classification)
- Binary classifier trained on labeled IoT-23 data (80/20 stratified split)
- `n_estimators=100`, `max_depth=6`
- Achieves **97.2% accuracy** on the test set

### 3. CUSUM (Change-Point Detection)
- Cumulative Sum analysis on 5-minute time windows per device
- Detects sudden shifts in `bytes_sent` and `connection_count`
- `threshold=8.0`, `drift=1.0`

### Trust Score Formula

```
trust = 0.4 * IF_score + 0.5 * XGB_score - CUSUM_penalty
```

- **IF_score**: Min-max normalized anomaly score (0–100)
- **XGB_score**: `(1 - malicious_probability) * 100`
- **CUSUM_penalty**: 10 if change-point detected, else 0
- Final score clamped to 0–100

| Score Range | Classification |
|-------------|---------------|
| > 80        | Healthy       |
| 50–80       | Suspicious    |
| < 50        | ALERT         |

## Dataset

Uses the **IoT-23 dataset** from Stratosphere Lab (Czech Technical University) — real network traffic captured from IoT devices including both malicious (botnet) and benign behavior.

- **29,634 connections** from **30 devices** (19 unique after filtering)
- **21,254 malicious** / **8,380 benign** connections
- Attack types: DDoS, C&C, Horizontal Port Scan, C&C Heartbeat, File Download, Okiru Botnet, Data Exfiltration

Source files:
- `conn.log.labeled.malware` — CTU-34-1 (Mirai botnet)
- `conn.log.labeled.malware2` — CTU-42-1
- `conn.log.labeled.malware3` — CTU-44-1
- `conn.log.labeled.benign` — Honeypot-4-1
- `conn.log.labeled.benign2` — Honeypot-5-1

## Dashboard (Next.js 14)

A real-time monitoring dashboard built with Next.js 14, Tailwind CSS, and Recharts.

### Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview with device health distribution, trust score gauges, alert timeline |
| **Attack Intel** | Narrative attack overview — What/How/Where/When with stats and visualizations |
| **Devices** | Device grid with trust scores, click any device for full IP deep-dive |
| **Alerts** | Alert feed with severity filtering, deviation explanations |
| **Analytics** | Feature distributions, algorithm performance comparisons |
| **Architecture** | System architecture and pipeline documentation |

### IP Deep-Dive Panel

Click any device to see:
- Trust score with classification badge
- Individual algorithm scores (Isolation Forest, XGBoost, CUSUM)
- Trust formula breakdown
- Attack type distribution with bar charts
- Traffic statistics (10 metrics)
- Behavioral features (ML input values)
- Network targets (top destination IPs/ports)
- Connection state analysis
- Alert history
- Raw connections table (last 20 Zeek records)

## Project Structure

```
MedIoT_Eclipse/
├── main.py                      # Pipeline orchestrator (7 phases)
├── run_test_cases.py            # Run test cases through trained models
├── strong_test_cases.csv        # 150 test cases (7 attack scenarios)
├── requirements.txt             # Python dependencies
│
├── preprocessing/
│   └── feature_engineering.py   # IoT-23 parsing, sliding window features
│
├── models/
│   ├── anomaly_model.py         # Isolation Forest training & scoring
│   ├── xgboost_model.py         # XGBoost training & evaluation
│   └── cusum_detector.py        # CUSUM change-point detection
│
├── scoring/
│   └── trust_score.py           # Trust score computation & merging
│
├── alerts/
│   ├── alert_engine.py          # Alert generation with explanations
│   └── attack_overview.py       # Narrative attack report (What/How/Where/When)
│
├── data/                        # IoT-23 dataset files & pipeline outputs
│   ├── conn.log.labeled.*       # Raw Zeek connection logs
│   ├── timeseries.csv           # Processed connection data
│   ├── device_features.csv      # Sliding window feature vectors
│   ├── trust_scores.csv         # Final trust scores per device
│   └── attack_overview.json     # Structured attack report
│
└── mediot UI/                   # Next.js 14 dashboard
    ├── app/                     # App router pages
    ├── components/              # React components
    ├── contexts/                # Global filter state
    ├── lib/                     # Types, API helpers
    └── public/data/             # Static JSON data for dashboard
```

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

### Run the ML Pipeline

```bash
pip install -r requirements.txt
python main.py
```

This runs all 7 phases:
1. Data loading & preprocessing
2. Feature engineering (30-min sliding windows)
3. Isolation Forest training
4. XGBoost training & evaluation
5. CUSUM change-point detection
6. Trust score computation & alerts
7. Attack overview generation

### Run Test Cases

```bash
python run_test_cases.py
```

Runs 150 test cases through trained models and exports results to the dashboard.

### Launch the Dashboard

```bash
cd "mediot UI"
npm install
npm run dev
```

Open http://localhost:3000 to view the dashboard.

## Tech Stack

**Backend / ML Pipeline:**
- Python, Pandas, NumPy
- scikit-learn (Isolation Forest)
- XGBoost
- Custom CUSUM implementation

**Frontend / Dashboard:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- React Context API

## Authors

Built for hackathon by Team Eclipse.
