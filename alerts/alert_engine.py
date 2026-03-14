"""
Alert Engine — generates human-readable alerts for devices
flagged with trust score < 50 (ALERT status).
"""

import pandas as pd
import numpy as np
import json
import os


def compute_baselines(features_df):
    """Compute benign baseline statistics for comparison."""
    benign = features_df[features_df['is_malicious'] == 0]
    baselines = {}
    metric_cols = [
        'bytes_sent', 'bytes_received', 'avg_bytes_sent', 'avg_bytes_received',
        'packet_count', 'avg_connection_duration', 'unique_dst_ips',
        'unique_dst_ports', 'connection_count', 'failed_connection_ratio',
        'external_ip_ratio'
    ]
    for col in metric_cols:
        baselines[col] = {
            'mean': float(benign[col].mean()),
            'std': float(benign[col].std()),
            'threshold': float(benign[col].mean() + 2 * benign[col].std())
        }
    return baselines


# Mapping of feature deviations to human-readable explanations
DEVIATION_EXPLANATIONS = {
    'unique_dst_ips': 'Contacted unusual number of external servers',
    'unique_dst_ports': 'Connected to unusually many distinct ports (possible scanning)',
    'bytes_sent': 'Abnormal outbound data volume (possible data exfiltration)',
    'bytes_received': 'Abnormal inbound data volume',
    'avg_bytes_sent': 'High average bytes per connection sent',
    'packet_count': 'Unusually high packet count',
    'connection_count': 'Excessive number of connections',
    'failed_connection_ratio': 'High rate of failed connections (possible scanning)',
    'external_ip_ratio': 'High ratio of external IP communications',
    'avg_connection_duration': 'Unusual connection duration patterns',
}


def generate_alerts(trust_df, features_df, cusum_df):
    """Generate detailed alerts for devices with ALERT status."""
    print("\n--- Alert Generation ---")

    baselines = compute_baselines(features_df)
    alert_devices = trust_df[trust_df['status'] == 'ALERT']

    if len(alert_devices) == 0:
        print("No devices in ALERT status.")
        return []

    alerts = []
    for _, device in alert_devices.iterrows():
        device_id = device['device_id']
        device_features = features_df[features_df['device_id'] == device_id].iloc[0]

        # Find deviations from baseline
        reasons = []
        deviating_features = []
        for feature, explanation in DEVIATION_EXPLANATIONS.items():
            if feature not in baselines:
                continue
            value = float(device_features[feature])
            threshold = baselines[feature]['threshold']
            baseline_mean = baselines[feature]['mean']

            if value > threshold and threshold > 0:
                deviation_pct = ((value - baseline_mean) / baseline_mean * 100) if baseline_mean > 0 else 0
                reasons.append(f"{explanation} ({value:.1f} vs baseline {baseline_mean:.1f}, +{deviation_pct:.0f}%)")
                deviating_features.append(feature)

        # Check which algorithms flagged this device
        flagged_by = []
        if 'if_prediction' in trust_df.columns and device.get('if_prediction', 1) == -1:
            flagged_by.append('Isolation Forest')
        elif device.get('if_score', 100) < 30:
            flagged_by.append('Isolation Forest')

        if device.get('xgb_score', 100) < 50:
            flagged_by.append('XGBoost')

        # CUSUM check
        cusum_row = cusum_df[cusum_df['device_id'] == device_id]
        if not cusum_row.empty and cusum_row.iloc[0]['change_point_detected']:
            change_ts = cusum_row.iloc[0]['change_point_timestamp']
            reasons.append(f"Behavior changed at {change_ts}")
            flagged_by.append('CUSUM')

        if not reasons:
            reasons.append('Multiple algorithm consensus indicates anomalous behavior')

        severity = 'CRITICAL' if device['trust_score'] < 25 else 'HIGH'

        alert = {
            'device_id': device_id,
            'trust_score': round(float(device['trust_score']), 2),
            'severity': severity,
            'status': 'ALERT',
            'flagged_by': flagged_by,
            'reasons': reasons,
            'deviating_features': deviating_features,
            'metrics': {
                'if_score': round(float(device.get('if_score', 0)), 2),
                'xgb_score': round(float(device.get('xgb_score', 0)), 2),
                'cusum_shift': bool(device.get('change_point_detected', False)),
            }
        }
        alerts.append(alert)

    # Sort by trust score (lowest first = most critical)
    alerts.sort(key=lambda x: x['trust_score'])

    print(f"Generated {len(alerts)} alerts")
    print(f"  CRITICAL: {sum(1 for a in alerts if a['severity'] == 'CRITICAL')}")
    print(f"  HIGH: {sum(1 for a in alerts if a['severity'] == 'HIGH')}")

    return alerts


def save_alerts(alerts, output_dir='data'):
    """Save alerts to JSON file."""
    output_path = os.path.join(output_dir, 'alerts.json')
    with open(output_path, 'w') as f:
        json.dump(alerts, f, indent=2)
    print(f"Alerts saved to {output_path}")
    return output_path


if __name__ == '__main__':
    trust_df = pd.read_csv('data/trust_scores.csv')
    features_df = pd.read_csv('data/features.csv')
    cusum_df = pd.read_csv('data/cusum_results.csv')
    alerts = generate_alerts(trust_df, features_df, cusum_df)
    save_alerts(alerts)
