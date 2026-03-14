"""
Isolation Forest anomaly detection model.
Trains on benign-only data to detect novel/unknown anomalies.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os

FEATURE_COLS = [
    'bytes_sent', 'bytes_received', 'avg_bytes_sent', 'avg_bytes_received',
    'packet_count', 'avg_connection_duration', 'total_duration',
    'unique_dst_ips', 'unique_dst_ports', 'connection_count',
    'protocol_diversity', 'failed_connection_ratio', 'external_ip_ratio'
]


def train_isolation_forest(features_df, model_dir='models'):
    """Train Isolation Forest on benign-only data."""
    print("\n--- Isolation Forest Training ---")

    # Train on benign data only (unsupervised approach)
    benign_data = features_df[features_df['is_malicious'] == 0][FEATURE_COLS]
    print(f"Training on {len(benign_data)} benign device profiles")

    # Scale features
    scaler = StandardScaler()
    benign_scaled = scaler.fit_transform(benign_data)

    # Train model
    model = IsolationForest(
        contamination=0.1,
        n_estimators=100,
        random_state=42,
        n_jobs=-1
    )
    model.fit(benign_scaled)

    # Score ALL devices (benign + malicious)
    all_data = features_df[FEATURE_COLS]
    all_scaled = scaler.transform(all_data)

    # decision_function: higher = more normal, lower = more anomalous
    scores = model.decision_function(all_scaled)
    predictions = model.predict(all_scaled)  # 1 = normal, -1 = anomaly

    features_df = features_df.copy()
    features_df['if_raw_score'] = scores
    features_df['if_prediction'] = predictions

    n_anomalies = (predictions == -1).sum()
    print(f"Anomalies detected: {n_anomalies}/{len(features_df)}")

    # Save model and scaler
    model_path = os.path.join(model_dir, 'isolation_forest.pkl')
    scaler_path = os.path.join(model_dir, 'if_scaler.pkl')
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"Model saved to {model_path}")

    return features_df, model, scaler


if __name__ == '__main__':
    df = pd.read_csv('data/features.csv')
    result, _, _ = train_isolation_forest(df)
    print(result[['device_id', 'if_raw_score', 'if_prediction']].head(10))
