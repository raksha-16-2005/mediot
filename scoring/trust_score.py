"""
Trust Score Engine — combines Isolation Forest, XGBoost, and CUSUM
outputs into a single 0-100 trust score per device.
"""

import pandas as pd
import numpy as np
import os


def normalize_if_scores(raw_scores):
    """
    Normalize Isolation Forest decision_function scores to 0-100.
    Higher raw score = more normal → higher trust.
    """
    min_s = raw_scores.min()
    max_s = raw_scores.max()
    if max_s == min_s:
        return np.full_like(raw_scores, 50.0)
    normalized = (raw_scores - min_s) / (max_s - min_s) * 100
    return normalized


def compute_trust_scores(features_df, cusum_df):
    """
    Compute trust scores by combining all three algorithm outputs.

    Trust Score = 0.4 * IF_score + 0.5 * XGB_score - CUSUM_penalty
    """
    print("\n--- Trust Score Computation ---")

    # Merge CUSUM results — CUSUM uses source_ip, features use device_id (ip_wN)
    # Extract source IP from device_id for joining
    if 'source_ip' in features_df.columns:
        merge_key = 'source_ip'
    else:
        features_df = features_df.copy()
        features_df['source_ip'] = features_df['device_id']
        merge_key = 'source_ip'

    cusum_merge = cusum_df.rename(columns={'device_id': merge_key})
    merged = features_df.merge(
        cusum_merge[[merge_key, 'change_point_detected', 'change_point_timestamp']],
        on=merge_key, how='left'
    )

    # Normalize Isolation Forest scores (0-100, higher = more normal)
    merged['if_score'] = normalize_if_scores(merged['if_raw_score'].values)

    # XGBoost score (0-100, higher = more benign)
    merged['xgb_score'] = (1 - merged['xgb_malicious_prob']) * 100

    # CUSUM penalty
    merged['cusum_penalty'] = merged['change_point_detected'].apply(
        lambda x: 10 if x else 0
    )

    # Weighted ensemble
    merged['trust_score'] = (
        0.4 * merged['if_score'] +
        0.5 * merged['xgb_score'] -
        merged['cusum_penalty']
    )
    merged['trust_score'] = np.clip(merged['trust_score'], 0, 100)

    # Classification
    def classify(score):
        if score > 80:
            return 'Healthy'
        elif score >= 50:
            return 'Suspicious'
        else:
            return 'ALERT'

    merged['status'] = merged['trust_score'].apply(classify)

    # Summary
    status_counts = merged['status'].value_counts()
    print(f"Devices analyzed: {len(merged)}")
    for status in ['Healthy', 'Suspicious', 'ALERT']:
        count = status_counts.get(status, 0)
        print(f"  {status}: {count}")

    return merged


def save_trust_scores(trust_df, output_dir='data'):
    """Save trust scores to CSV."""
    output_cols = [
        'device_id', 'trust_score', 'status',
        'if_score', 'xgb_score', 'cusum_penalty',
        'change_point_detected', 'change_point_timestamp',
        'label', 'is_malicious'
    ]
    output_path = os.path.join(output_dir, 'trust_scores.csv')
    trust_df[output_cols].to_csv(output_path, index=False)
    print(f"Trust scores saved to {output_path}")
    return output_path


if __name__ == '__main__':
    features = pd.read_csv('data/features.csv')
    cusum = pd.read_csv('data/cusum_results.csv')
    trust = compute_trust_scores(features, cusum)
    save_trust_scores(trust)
