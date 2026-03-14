"""
Export pipeline data to JSON for the Next.js UI.
Reads CSVs/JSONs from data/ and writes to 'mediot UI/public/data/'.
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
UI_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mediot UI', 'public', 'data')

ATTACK_TYPE_NAMES = {
    'PartOfAHorizontalPortScan': 'Horizontal Port Scan',
    'DDoS': 'DDoS Attack',
    'C&C': 'Command & Control',
    'C&C-HeartBeat': 'C&C Heartbeat',
    'C&C-FileDownload': 'C&C File Download',
    'FileDownload': 'Malicious File Download',
}


def export_all():
    os.makedirs(UI_DIR, exist_ok=True)

    trust_df = pd.read_csv(os.path.join(DATA_DIR, 'trust_scores.csv'))
    features_df = pd.read_csv(os.path.join(DATA_DIR, 'features.csv'))
    timeseries_df = pd.read_csv(os.path.join(DATA_DIR, 'timeseries.csv'))
    cusum_df = pd.read_csv(os.path.join(DATA_DIR, 'cusum_results.csv'))

    with open(os.path.join(DATA_DIR, 'alerts.json')) as f:
        alerts_raw = json.load(f)
    with open(os.path.join(DATA_DIR, 'attack_overview.json')) as f:
        overview = json.load(f)

    # ── 1. Devices ────────────────────────────────────────
    # Aggregate per source IP from trust_df + features_df
    features_df['source_ip'] = features_df['device_id'].str.rsplit('_w', n=1).str[0]
    trust_df['source_ip'] = trust_df['device_id'].str.rsplit('_w', n=1).str[0]

    ip_trust = trust_df.groupby('source_ip').agg(
        trust_score=('trust_score', 'mean'),
        if_score=('if_score', 'mean'),
        xgb_score=('xgb_score', 'mean'),
        is_malicious=('is_malicious', 'max'),
        status=('status', lambda x: 'ALERT' if 'ALERT' in x.values else ('Suspicious' if 'Suspicious' in x.values else 'Healthy')),
        change_point_detected=('change_point_detected', 'max'),
    ).reset_index()

    ip_features = features_df.groupby('source_ip').agg(
        bytes_sent=('bytes_sent', 'sum'),
        bytes_received=('bytes_received', 'sum'),
        packet_count=('packet_count', 'sum'),
        connection_count=('connection_count', 'sum'),
        unique_dst_ips=('unique_dst_ips', 'max'),
        unique_dst_ports=('unique_dst_ports', 'max'),
        failed_connection_ratio=('failed_connection_ratio', 'mean'),
        external_ip_ratio=('external_ip_ratio', 'mean'),
        avg_connection_duration=('avg_connection_duration', 'mean'),
    ).reset_index()

    devices_merged = ip_trust.merge(ip_features, on='source_ip', how='left')

    status_map = {'Healthy': 'Online', 'Suspicious': 'Suspicious', 'ALERT': 'Critical'}
    risk_map = {'Healthy': 'Low', 'Suspicious': 'Medium', 'ALERT': 'Critical'}

    devices = []
    for _, row in devices_merged.iterrows():
        devices.append({
            'deviceId': row['source_ip'],
            'deviceType': 'IoT Device',
            'ipAddress': row['source_ip'],
            'location': 'Network',
            'trustScore': round(float(row['trust_score']), 2),
            'status': status_map.get(row['status'], 'Online'),
            'trafficVolume': int(row.get('bytes_sent', 0) + row.get('bytes_received', 0)),
            'dnsQueries': int(row.get('unique_dst_ips', 0)),
            'uniqueIpConnections': int(row.get('unique_dst_ips', 0)),
            'lastActivity': datetime.utcnow().isoformat(),
            'riskLevel': risk_map.get(row['status'], 'Low'),
            'ifScore': round(float(row['if_score']), 2),
            'xgbScore': round(float(row['xgb_score']), 2),
            'isMalicious': bool(row['is_malicious']),
            'connectionCount': int(row.get('connection_count', 0)),
            'packetCount': int(row.get('packet_count', 0)),
            'bytesSent': int(row.get('bytes_sent', 0)),
            'bytesReceived': int(row.get('bytes_received', 0)),
            'failedConnectionRatio': round(float(row.get('failed_connection_ratio', 0)), 4),
            'externalIpRatio': round(float(row.get('external_ip_ratio', 0)), 4),
            'avgConnectionDuration': round(float(row.get('avg_connection_duration', 0)), 4),
            'cusumShift': bool(row.get('change_point_detected', False)),
        })

    _write(devices, 'devices.json')

    # ── 2. Alerts ─────────────────────────────────────────
    ui_alerts = []
    for a in alerts_raw:
        src_ip = a['device_id'].rsplit('_w', 1)[0]
        severity = 'Critical' if a['severity'] == 'CRITICAL' else 'Warning'
        ui_alerts.append({
            'id': a['device_id'],
            'timestamp': datetime.utcnow().isoformat(),
            'deviceId': src_ip,
            'deviceName': f"IoT Device ({src_ip})",
            'severity': severity,
            'trustScore': a['trust_score'],
            'alertReason': '; '.join(a['reasons'][:2]) if a['reasons'] else 'Anomalous behavior detected',
            'recommendedAction': f"Flagged by: {', '.join(a['flagged_by'])}. Investigate immediately.",
            'flaggedBy': a['flagged_by'],
            'metrics': a['metrics'],
            'deviatingFeatures': a.get('deviating_features', []),
        })
    _write(ui_alerts, 'alerts.json')

    # ── 3. Network Metrics ────────────────────────────────
    n_healthy = len(devices_merged[devices_merged['status'] == 'Healthy'])
    n_suspicious = len(devices_merged[devices_merged['status'] == 'Suspicious'])
    n_alert = len(devices_merged[devices_merged['status'] == 'ALERT'])
    metrics = {
        'totalDevices': len(devices_merged),
        'healthyDevices': n_healthy,
        'suspiciousDevices': n_suspicious + n_alert,
        'criticalAlerts': len([a for a in alerts_raw if a['severity'] == 'CRITICAL']),
        'networkTraffic': int(features_df['bytes_sent'].sum() + features_df['bytes_received'].sum()),
        'totalConnections': int(overview['what']['total_connections']),
        'maliciousConnections': int(overview['what']['total_malicious']),
        'maliciousPct': float(overview['what']['malicious_pct']),
    }
    _write(metrics, 'network-metrics.json')

    # ── 4. Attack Overview ────────────────────────────────
    _write(overview, 'attack-overview.json')

    # ── 5. Timeline Data ──────────────────────────────────
    ts = timeseries_df.copy()
    ts['datetime'] = pd.to_datetime(ts['ts'], unit='s')
    ts['hour'] = ts['datetime'].dt.floor('1h')

    # Hourly bins
    hourly = ts.groupby(['hour', 'label']).size().reset_index(name='count')
    hourly['hour'] = hourly['hour'].dt.strftime('%Y-%m-%dT%H:%M:%S')
    timeline_all = hourly.to_dict(orient='records')

    # Attack type timeline
    mal = ts[ts['label'] == 'Malicious'].copy()
    if 'attack_type' in mal.columns:
        mal['attack_label'] = mal['attack_type'].map(
            lambda x: ATTACK_TYPE_NAMES.get(str(x), str(x)) if pd.notna(x) else 'Unknown'
        )
        attack_hourly = mal.groupby(['hour', 'attack_label']).size().reset_index(name='count')
        attack_hourly['hour'] = attack_hourly['hour'].dt.strftime('%Y-%m-%dT%H:%M:%S')
        timeline_attacks = attack_hourly.to_dict(orient='records')
    else:
        timeline_attacks = []

    # Bytes over time
    bytes_hourly = ts.groupby('hour').agg(
        bytes_out=('orig_bytes', 'sum'),
        bytes_in=('resp_bytes', 'sum'),
    ).reset_index()
    bytes_hourly['hour'] = bytes_hourly['hour'].dt.strftime('%Y-%m-%dT%H:%M:%S')
    bytes_timeline = bytes_hourly.to_dict(orient='records')

    _write({
        'traffic': timeline_all,
        'attacks': timeline_attacks,
        'bytes': bytes_timeline,
    }, 'timeline.json')

    # ── 5b. Raw timeseries for client-side filtering ──────
    raw_ts = timeseries_df[['ts', 'device_id', 'orig_bytes', 'resp_bytes',
                            'duration', 'id.resp_h', 'id.resp_p', 'conn_state',
                            'label']].copy()
    if 'attack_type' in timeseries_df.columns:
        raw_ts['attack_type'] = timeseries_df['attack_type'].fillna('')
        raw_ts['attack_label'] = raw_ts['attack_type'].map(
            lambda x: ATTACK_TYPE_NAMES.get(str(x), str(x)) if x else 'Benign'
        )
    raw_ts['datetime'] = pd.to_datetime(raw_ts['ts'], unit='s').dt.strftime('%Y-%m-%dT%H:%M:%S')
    # Round floats to reduce file size
    raw_ts['orig_bytes'] = raw_ts['orig_bytes'].round(0).astype(int)
    raw_ts['resp_bytes'] = raw_ts['resp_bytes'].round(0).astype(int)
    raw_ts['duration'] = raw_ts['duration'].round(4)
    raw_ts['id.resp_p'] = raw_ts['id.resp_p'].astype(int)
    _write(raw_ts.to_dict(orient='records'), 'timeseries-raw.json')

    # ── 6. Trust Score Distribution ───────────────────────
    trust_data = []
    for _, row in trust_df.iterrows():
        trust_data.append({
            'deviceId': row['device_id'],
            'sourceIp': row['source_ip'],
            'trustScore': round(float(row['trust_score']), 2),
            'status': row['status'],
            'ifScore': round(float(row['if_score']), 2),
            'xgbScore': round(float(row['xgb_score']), 2),
            'label': row['label'],
            'isMalicious': bool(row['is_malicious']),
        })
    _write(trust_data, 'trust-scores.json')

    # ── 7. Features for scatter/explorer ──────────────────
    feat_data = []
    for _, row in features_df.iterrows():
        feat_data.append({
            'deviceId': row['device_id'],
            'sourceIp': row['source_ip'],
            'bytesSent': float(row['bytes_sent']),
            'bytesReceived': float(row['bytes_received']),
            'packetCount': float(row['packet_count']),
            'avgConnectionDuration': float(row['avg_connection_duration']),
            'uniqueDstIps': float(row['unique_dst_ips']),
            'uniqueDstPorts': float(row['unique_dst_ports']),
            'connectionCount': float(row['connection_count']),
            'failedConnectionRatio': float(row['failed_connection_ratio']),
            'externalIpRatio': float(row['external_ip_ratio']),
            'label': row['label'],
            'isMalicious': bool(row['is_malicious']),
        })
    _write(feat_data, 'features.json')

    # ── 8. CUSUM data ─────────────────────────────────────
    cusum_data = []
    for _, row in cusum_df.iterrows():
        cusum_data.append({
            'deviceId': row['device_id'],
            'changePointDetected': bool(row['change_point_detected']),
            'changePointTimestamp': str(row.get('change_point_timestamp', '')),
        })
    _write(cusum_data, 'cusum.json')

    print(f"Exported all pipeline data to {UI_DIR}")


def _write(data, filename):
    path = os.path.join(UI_DIR, filename)
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, default=str)
    print(f"  -> {filename}")


if __name__ == '__main__':
    export_all()
