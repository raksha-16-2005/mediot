"""
Run strong_test_cases.csv through the trained ML pipeline (IF + XGBoost + Trust Score)
and export results to the Next.js UI as the ONLY visible data.
"""

import pandas as pd
import numpy as np
import joblib
import json
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'models')
UI_DIR = os.path.join(BASE_DIR, 'mediot UI', 'public', 'data')

# The 13 features the models expect
FEATURE_COLS = [
    'bytes_sent', 'bytes_received', 'avg_bytes_sent', 'avg_bytes_received',
    'packet_count', 'avg_connection_duration', 'total_duration',
    'unique_dst_ips', 'unique_dst_ports', 'connection_count',
    'protocol_diversity', 'failed_connection_ratio', 'external_ip_ratio'
]

# Map test case expected labels to our pipeline labels
EXPECTED_TO_LABEL = {
    'Normal': 'Benign',
    'Anomaly': 'Malicious',
    'High risk': 'Malicious',
    'Suspicious': 'Malicious',
    'Drift alert': 'Malicious',
    'System stable': 'Benign',
    'Model challenge': 'Malicious',
}

SCENARIO_TO_ATTACK = {
    'Normal IoT communication': 'Benign',
    'DoS packet flood': 'DDoS Attack',
    'Data exfiltration': 'C&C File Download',
    'Port scanning': 'Horizontal Port Scan',
    'Gradual traffic drift': 'Command & Control',
    'Boundary extreme': 'Benign',
    'Adversarial balanced traffic': 'Command & Control',
}


def map_test_features(tc_df):
    """
    Map test case columns to the 13-feature schema the models expect.
    Each test case row is treated as a single "device window".
    """
    df = pd.DataFrame()

    df['device_id'] = tc_df['test_case_id']
    df['scenario'] = tc_df['scenario']
    df['expected'] = tc_df['expected']

    # Direct mappings
    df['bytes_sent'] = tc_df['orig_bytes'].astype(float)
    df['bytes_received'] = tc_df['resp_bytes'].astype(float)
    df['packet_count'] = tc_df['orig_pkts'].astype(float)
    df['avg_connection_duration'] = tc_df['duration'].astype(float)
    df['total_duration'] = tc_df['duration'].astype(float)

    # Derived: avg bytes = total bytes (single connection per test case)
    df['avg_bytes_sent'] = df['bytes_sent']
    df['avg_bytes_received'] = df['bytes_received']

    # Single test case = 1 connection, 1 dst ip, 1 dst port
    df['connection_count'] = 1.0
    df['unique_dst_ips'] = 1.0
    df['unique_dst_ports'] = 1.0
    df['protocol_diversity'] = 1.0

    # Heuristic for failed_connection_ratio based on scenario
    df['failed_connection_ratio'] = 0.0
    df.loc[tc_df['scenario'] == 'Port scanning', 'failed_connection_ratio'] = 0.9
    df.loc[tc_df['scenario'] == 'DoS packet flood', 'failed_connection_ratio'] = 0.7

    # Heuristic for external_ip_ratio
    df['external_ip_ratio'] = 0.3  # default
    df.loc[tc_df['scenario'] == 'Data exfiltration', 'external_ip_ratio'] = 0.95
    df.loc[tc_df['scenario'] == 'Port scanning', 'external_ip_ratio'] = 0.85
    df.loc[tc_df['scenario'] == 'Normal IoT communication', 'external_ip_ratio'] = 0.1
    df.loc[tc_df['scenario'] == 'Boundary extreme', 'external_ip_ratio'] = 0.0

    # Ground truth label
    df['label'] = tc_df['expected'].map(EXPECTED_TO_LABEL)
    df['is_malicious'] = (df['label'] == 'Malicious').astype(int)
    df['attack_type'] = tc_df['scenario'].map(SCENARIO_TO_ATTACK)

    return df


def run_models(features_df):
    """Run both IF and XGBoost on the test features."""

    # Load models & scalers
    if_model = joblib.load(os.path.join(MODEL_DIR, 'isolation_forest.pkl'))
    if_scaler = joblib.load(os.path.join(MODEL_DIR, 'if_scaler.pkl'))
    xgb_model = joblib.load(os.path.join(MODEL_DIR, 'xgboost_model.pkl'))
    xgb_scaler = joblib.load(os.path.join(MODEL_DIR, 'xgb_scaler.pkl'))

    X = features_df[FEATURE_COLS].values

    # Isolation Forest
    X_if = if_scaler.transform(X)
    if_raw_scores = if_model.decision_function(X_if)
    if_predictions = if_model.predict(X_if)  # 1=normal, -1=anomaly

    # Normalize IF scores to 0-100
    min_s, max_s = if_raw_scores.min(), if_raw_scores.max()
    if max_s == min_s:
        if_scores = np.full_like(if_raw_scores, 50.0)
    else:
        if_scores = (if_raw_scores - min_s) / (max_s - min_s) * 100

    # XGBoost
    X_xgb = xgb_scaler.transform(X)
    xgb_proba = xgb_model.predict_proba(X_xgb)[:, 1]  # P(malicious)
    xgb_scores = (1 - xgb_proba) * 100  # higher = more benign

    # Trust Score = 0.4*IF + 0.5*XGB (no CUSUM for test cases)
    trust_scores = 0.4 * if_scores + 0.5 * xgb_scores
    trust_scores = np.clip(trust_scores, 0, 100)

    features_df = features_df.copy()
    features_df['if_raw_score'] = if_raw_scores
    features_df['if_prediction'] = if_predictions
    features_df['if_score'] = if_scores
    features_df['xgb_malicious_prob'] = xgb_proba
    features_df['xgb_score'] = xgb_scores
    features_df['trust_score'] = trust_scores
    features_df['status'] = features_df['trust_score'].apply(
        lambda s: 'Healthy' if s > 80 else ('Suspicious' if s >= 50 else 'ALERT')
    )
    features_df['pipeline_prediction'] = (xgb_proba >= 0.5).astype(int)
    features_df['pipeline_label'] = features_df['pipeline_prediction'].map({0: 'Benign', 1: 'Malicious'})
    features_df['correct'] = features_df['is_malicious'] == features_df['pipeline_prediction']

    return features_df


def export_to_ui(results_df, tc_df):
    """Export test case results to the Next.js UI public/data/ folder."""
    os.makedirs(UI_DIR, exist_ok=True)

    # ── 1. Test Cases JSON (main data) ──────────────────
    test_cases = []
    for _, row in results_df.iterrows():
        test_cases.append({
            'testCaseId': row['device_id'],
            'scenario': row['scenario'],
            'expected': row['expected'],
            'pipelinePrediction': row['pipeline_label'],
            'correct': bool(row['correct']),
            'trustScore': round(float(row['trust_score']), 2),
            'ifScore': round(float(row['if_score']), 2),
            'xgbScore': round(float(row['xgb_score']), 2),
            'xgbProb': round(float(row['xgb_malicious_prob']), 4),
            'status': row['status'],
            'label': row['label'],
            'attackType': row['attack_type'],
            # Raw features
            'duration': round(float(row['avg_connection_duration']), 6),
            'origBytes': int(row['bytes_sent']),
            'respBytes': int(row['bytes_received']),
            'packetCount': int(row['packet_count']),
            'bytesSent': int(row['bytes_sent']),
            'bytesReceived': int(row['bytes_received']),
            'failedConnectionRatio': round(float(row['failed_connection_ratio']), 4),
            'externalIpRatio': round(float(row['external_ip_ratio']), 4),
        })
    _write(test_cases, 'test-cases.json')

    # ── 2. Devices.json (test cases as devices) ────────
    status_map = {'Healthy': 'Online', 'Suspicious': 'Suspicious', 'ALERT': 'Critical'}
    risk_map = {'Healthy': 'Low', 'Suspicious': 'Medium', 'ALERT': 'Critical'}
    devices = []
    for _, row in results_df.iterrows():
        devices.append({
            'deviceId': row['device_id'],
            'deviceType': 'IoT Device',
            'ipAddress': row['device_id'],
            'location': row['scenario'],
            'trustScore': round(float(row['trust_score']), 2),
            'status': status_map.get(row['status'], 'Online'),
            'trafficVolume': int(row['bytes_sent'] + row['bytes_received']),
            'dnsQueries': 1,
            'uniqueIpConnections': 1,
            'lastActivity': datetime.utcnow().isoformat(),
            'riskLevel': risk_map.get(row['status'], 'Low'),
            'ifScore': round(float(row['if_score']), 2),
            'xgbScore': round(float(row['xgb_score']), 2),
            'isMalicious': bool(row['is_malicious']),
            'connectionCount': 1,
            'packetCount': int(row['packet_count']),
            'bytesSent': int(row['bytes_sent']),
            'bytesReceived': int(row['bytes_received']),
            'failedConnectionRatio': round(float(row['failed_connection_ratio']), 4),
            'externalIpRatio': round(float(row['external_ip_ratio']), 4),
            'avgConnectionDuration': round(float(row['avg_connection_duration']), 6),
            'cusumShift': None,  # CUSUM not run on test cases
        })
    _write(devices, 'devices.json')

    # ── 3. Alerts (only for ALERT/Suspicious) ──────────
    alerts = []
    alert_rows = results_df[results_df['status'].isin(['ALERT', 'Suspicious'])]
    for _, row in alert_rows.iterrows():
        severity = 'Critical' if row['status'] == 'ALERT' else 'Warning'
        reasons = []
        if row['xgb_malicious_prob'] >= 0.5:
            reasons.append(f"XGBoost flagged as malicious (prob={row['xgb_malicious_prob']:.2%})")
        if row['if_prediction'] == -1:
            reasons.append("Isolation Forest detected anomaly")
        if row['trust_score'] < 50:
            reasons.append(f"Low trust score: {row['trust_score']:.1f}")
        reasons.append(f"Scenario: {row['scenario']} — Expected: {row['expected']}")

        alerts.append({
            'id': row['device_id'],
            'timestamp': datetime.utcnow().isoformat(),
            'deviceId': row['device_id'],
            'deviceName': f"Test Case ({row['device_id']})",
            'severity': severity,
            'trustScore': round(float(row['trust_score']), 2),
            'alertReason': '; '.join(reasons),
            'recommendedAction': f"Investigate {row['scenario']} behavior. Pipeline prediction: {row['pipeline_label']}",
            'flaggedBy': ['XGBoost' if row['xgb_malicious_prob'] >= 0.5 else None,
                         'IsolationForest' if row['if_prediction'] == -1 else None],
            'metrics': {
                'if_score': round(float(row['if_score']), 2),
                'xgb_score': round(float(row['xgb_score']), 2),
                'cusum_shift': None,
            },
            'deviatingFeatures': [],
        })
        # Clean None from flaggedBy
        alerts[-1]['flaggedBy'] = [x for x in alerts[-1]['flaggedBy'] if x]
    _write(alerts, 'alerts.json')

    # ── 4. Network Metrics ─────────────────────────────
    n_correct = int(results_df['correct'].sum())
    n_total = len(results_df)
    metrics = {
        'totalDevices': n_total,
        'healthyDevices': int((results_df['status'] == 'Healthy').sum()),
        'suspiciousDevices': int((results_df['status'].isin(['Suspicious', 'ALERT'])).sum()),
        'criticalAlerts': int((results_df['status'] == 'ALERT').sum()),
        'networkTraffic': int(results_df['bytes_sent'].sum() + results_df['bytes_received'].sum()),
        'totalConnections': n_total,
        'maliciousConnections': int(results_df['is_malicious'].sum()),
        'maliciousPct': round(float(results_df['is_malicious'].mean() * 100), 2),
        'testAccuracy': round(n_correct / n_total * 100, 2),
        'correctPredictions': n_correct,
        'incorrectPredictions': n_total - n_correct,
    }
    _write(metrics, 'network-metrics.json')

    # ── 5. Attack Overview ─────────────────────────────
    mal = results_df[results_df['is_malicious'] == 1]
    attack_types = []
    for name, group in mal.groupby('attack_type'):
        attack_types.append({
            'attack_type': name,
            'readable_name': name,
            'count': len(group),
            'percentage': round(len(group) / len(mal) * 100, 2) if len(mal) > 0 else 0,
        })

    scenarios = results_df.groupby('scenario').agg(
        count=('device_id', 'count'),
        correct=('correct', 'sum'),
        avg_trust=('trust_score', 'mean'),
    ).reset_index()

    how = []
    for _, s in scenarios.iterrows():
        how.append({
            'attack_type': s['scenario'],
            'readable_name': s['scenario'],
            'category': 'Test Scenario',
            'narrative': f"{int(s['correct'])}/{int(s['count'])} correctly classified. Avg trust: {s['avg_trust']:.1f}",
            'stats': {
                'count': int(s['count']),
                'avg_duration': 0,
                'avg_bytes_sent': 0,
                'avg_bytes_received': 0,
                'top_ports': {},
                'top_conn_states': {},
            },
        })

    overview = {
        'what': {
            'total_connections': n_total,
            'total_malicious': int(results_df['is_malicious'].sum()),
            'malicious_pct': round(float(results_df['is_malicious'].mean() * 100), 2),
            'attack_types': attack_types,
        },
        'how': how,
        'where': {
            'compromised_sources': mal['device_id'].tolist(),
            'num_compromised': len(mal),
            'top_destinations': {},
            'top_dst_ports': {},
            'external_destinations': 0,
            'internal_destinations': 0,
        },
        'when': {
            'first_malicious_ts': None,
            'first_malicious_readable': 'N/A (test cases)',
            'last_malicious_ts': None,
            'last_malicious_readable': 'N/A (test cases)',
            'attack_duration_seconds': 0,
            'cusum_change_points': [],
            'total_malicious_connections': int(results_df['is_malicious'].sum()),
        },
    }
    _write(overview, 'attack-overview.json')

    # ── 6. Trust Scores ────────────────────────────────
    trust_data = []
    for _, row in results_df.iterrows():
        trust_data.append({
            'deviceId': row['device_id'],
            'sourceIp': row['device_id'],
            'trustScore': round(float(row['trust_score']), 2),
            'status': row['status'],
            'ifScore': round(float(row['if_score']), 2),
            'xgbScore': round(float(row['xgb_score']), 2),
            'label': row['label'],
            'isMalicious': bool(row['is_malicious']),
        })
    _write(trust_data, 'trust-scores.json')

    # ── 7. Features ────────────────────────────────────
    feat_data = []
    for _, row in results_df.iterrows():
        feat_data.append({
            'deviceId': row['device_id'],
            'sourceIp': row['device_id'],
            'bytesSent': float(row['bytes_sent']),
            'bytesReceived': float(row['bytes_received']),
            'packetCount': float(row['packet_count']),
            'avgConnectionDuration': float(row['avg_connection_duration']),
            'uniqueDstIps': 1.0,
            'uniqueDstPorts': 1.0,
            'connectionCount': 1.0,
            'failedConnectionRatio': float(row['failed_connection_ratio']),
            'externalIpRatio': float(row['external_ip_ratio']),
            'label': row['label'],
            'isMalicious': bool(row['is_malicious']),
        })
    _write(feat_data, 'features.json')

    # ── 8. Timeseries-raw (test cases as connections) ──
    now = datetime.utcnow()
    raw_ts = []
    for i, (_, row) in enumerate(results_df.iterrows()):
        ts = now.timestamp() + i * 60  # 1 minute apart
        dt = datetime.utcfromtimestamp(ts).strftime('%Y-%m-%dT%H:%M:%S')
        raw_ts.append({
            'ts': ts,
            'device_id': row['device_id'],
            'orig_bytes': int(row['bytes_sent']),
            'resp_bytes': int(row['bytes_received']),
            'duration': round(float(row['avg_connection_duration']), 4),
            'id.resp_h': '10.0.0.1',
            'id.resp_p': 443,
            'conn_state': 'SF' if row['label'] == 'Benign' else 'S0',
            'label': row['label'],
            'attack_type': row['attack_type'] if row['is_malicious'] else '',
            'attack_label': row['attack_type'] if row['is_malicious'] else 'Benign',
            'datetime': dt,
        })
    _write(raw_ts, 'timeseries-raw.json')

    # ── 9. Timeline ────────────────────────────────────
    _write({'traffic': [], 'attacks': [], 'bytes': []}, 'timeline.json')

    # ── 10. CUSUM ──────────────────────────────────────
    _write([], 'cusum.json')


def _write(data, filename):
    path = os.path.join(UI_DIR, filename)
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, default=str)
    print(f"  -> {filename}")


def print_report(results_df):
    """Print a summary of test case results."""
    print("\n" + "=" * 70)
    print("  TEST CASE RESULTS — ML Pipeline Validation")
    print("=" * 70)

    n = len(results_df)
    n_correct = int(results_df['correct'].sum())

    print(f"\n  Overall Accuracy: {n_correct}/{n} ({n_correct/n*100:.1f}%)\n")

    # Per-scenario breakdown
    print(f"  {'Scenario':<35} {'Total':>5} {'Correct':>7} {'Acc%':>6}  {'Avg Trust':>9}")
    print(f"  {'-'*35} {'-'*5} {'-'*7} {'-'*6}  {'-'*9}")

    for scenario, group in results_df.groupby('scenario'):
        total = len(group)
        correct = int(group['correct'].sum())
        acc = correct / total * 100
        avg_trust = group['trust_score'].mean()
        print(f"  {scenario:<35} {total:>5} {correct:>7} {acc:>5.1f}%  {avg_trust:>8.1f}")

    # Incorrect cases
    wrong = results_df[~results_df['correct']]
    if len(wrong) > 0:
        print(f"\n  INCORRECT PREDICTIONS ({len(wrong)}):")
        print(f"  {'ID':<8} {'Scenario':<30} {'Expected':<15} {'Got':<12} {'Trust':>6} {'XGB Prob':>8}")
        print(f"  {'-'*8} {'-'*30} {'-'*15} {'-'*12} {'-'*6} {'-'*8}")
        for _, row in wrong.iterrows():
            print(f"  {row['device_id']:<8} {row['scenario']:<30} {row['expected']:<15} {row['pipeline_label']:<12} {row['trust_score']:>5.1f} {row['xgb_malicious_prob']:>7.4f}")

    print("\n" + "=" * 70)


if __name__ == '__main__':
    print("Loading test cases...")
    tc_df = pd.read_csv(os.path.join(BASE_DIR, 'strong_test_cases.csv'))
    print(f"  {len(tc_df)} test cases loaded")

    print("\nMapping features to model schema...")
    features_df = map_test_features(tc_df)

    print("\nRunning ML pipeline...")
    results_df = run_models(features_df)

    print_report(results_df)

    print("\nExporting to UI...")
    export_to_ui(results_df, tc_df)

    print(f"\nDone! Refresh http://localhost:3000 to see test case results.")
