"""
XGBoost supervised classifier for known attack pattern detection.
Trains on labeled dataset (benign vs malicious).
"""

import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.preprocessing import StandardScaler
import joblib
import os

FEATURE_COLS = [
    'bytes_sent', 'bytes_received', 'avg_bytes_sent', 'avg_bytes_received',
    'packet_count', 'avg_connection_duration', 'total_duration',
    'unique_dst_ips', 'unique_dst_ports', 'connection_count',
    'protocol_diversity', 'failed_connection_ratio', 'external_ip_ratio'
]


def train_xgboost(features_df, model_dir='models'):
    """Train XGBoost classifier on labeled data."""
    print("\n--- XGBoost Classifier Training ---")

    X = features_df[FEATURE_COLS]
    y = features_df['is_malicious']

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Stratified train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Training set: {len(X_train)} | Test set: {len(X_test)}")
    print(f"Malicious ratio - Train: {y_train.mean():.2%} | Test: {y_test.mean():.2%}")

    # Train model
    model = XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss'
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    metrics = {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1
    }

    print(f"\nXGBoost Performance:")
    print(f"  Accuracy:  {accuracy:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['Benign', 'Malicious'])}")

    # Score ALL devices
    all_proba = model.predict_proba(X_scaled)[:, 1]  # P(malicious)
    features_df = features_df.copy()
    features_df['xgb_malicious_prob'] = all_proba

    # Feature importance
    importance = dict(zip(FEATURE_COLS, model.feature_importances_))
    print("Top features:")
    for feat, imp in sorted(importance.items(), key=lambda x: -x[1])[:5]:
        print(f"  {feat}: {imp:.4f}")

    # Save model and scaler
    model_path = os.path.join(model_dir, 'xgboost_model.pkl')
    scaler_path = os.path.join(model_dir, 'xgb_scaler.pkl')
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"\nModel saved to {model_path}")

    return features_df, model, scaler, metrics


if __name__ == '__main__':
    df = pd.read_csv('data/features.csv')
    result, _, _, metrics = train_xgboost(df)
    print(result[['device_id', 'xgb_malicious_prob']].head(10))
