"""
Feature engineering for IoT network traffic data.
Loads IoT-23 style data, extracts per-device behavioral features,
and prepares time-series data for CUSUM analysis.
"""

import pandas as pd
import numpy as np
import glob
import os

# IoT-23 Zeek conn.log column names
ZEEK_COLUMNS = [
    'ts', 'uid', 'id.orig_h', 'id.orig_p', 'id.resp_h', 'id.resp_p',
    'proto', 'service', 'duration', 'orig_bytes', 'resp_bytes',
    'conn_state', 'local_orig', 'local_resp', 'missed_bytes', 'history',
    'orig_pkts', 'orig_ip_bytes', 'resp_pkts', 'resp_ip_bytes',
    'tunnel_parents', 'label', 'detailed-label'
]

# RFC 1918 private IP ranges
PRIVATE_PREFIXES = ('10.', '172.16.', '172.17.', '172.18.', '172.19.',
                    '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
                    '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
                    '172.30.', '172.31.', '192.168.')


def is_private_ip(ip):
    return any(ip.startswith(p) for p in PRIVATE_PREFIXES)


def generate_synthetic_dataset(n_devices=150, n_connections=50000, malicious_ratio=0.15, seed=42):
    """Generate a realistic synthetic dataset based on IoT-23 feature schema."""
    np.random.seed(seed)

    n_malicious_devices = int(n_devices * malicious_ratio)
    n_benign_devices = n_devices - n_malicious_devices

    benign_ips = [f"192.168.1.{i}" for i in range(1, n_benign_devices + 1)]
    malicious_ips = [f"192.168.1.{i}" for i in range(n_benign_devices + 1, n_devices + 1)]
    all_ips = benign_ips + malicious_ips

    dst_ips_pool = [f"10.0.0.{i}" for i in range(1, 51)] + \
                   [f"203.0.113.{i}" for i in range(1, 101)] + \
                   [f"198.51.100.{i}" for i in range(1, 51)]

    protocols = ['tcp', 'udp', 'icmp']
    services = ['http', 'https', 'dns', 'ssh', 'telnet', 'mqtt', '-']
    conn_states = ['SF', 'S0', 'REJ', 'RSTO', 'RSTR', 'S1', 'S2', 'S3', 'OTH']

    records = []
    base_ts = 1600000000.0  # arbitrary epoch start

    for i in range(n_connections):
        src_ip = np.random.choice(all_ips)
        is_malicious = src_ip in malicious_ips
        ts = base_ts + i * np.random.uniform(0.01, 2.0)

        if is_malicious:
            # Malicious traffic patterns
            attack_type = np.random.choice(['scan', 'exfiltration', 'c2', 'ddos'], p=[0.3, 0.25, 0.25, 0.2])
            if attack_type == 'scan':
                dst_ip = np.random.choice(dst_ips_pool)
                dst_port = np.random.randint(1, 65535)
                proto = 'tcp'
                service = '-'
                duration = np.random.uniform(0, 0.5)
                orig_bytes = np.random.randint(40, 200)
                resp_bytes = np.random.randint(0, 100)
                conn_state = np.random.choice(['S0', 'REJ', 'RSTO'], p=[0.5, 0.3, 0.2])
            elif attack_type == 'exfiltration':
                dst_ip = np.random.choice([ip for ip in dst_ips_pool if not is_private_ip(ip)])
                dst_port = np.random.choice([80, 443, 8080, 8443])
                proto = 'tcp'
                service = np.random.choice(['http', 'https'])
                duration = np.random.uniform(1, 30)
                orig_bytes = np.random.randint(10000, 500000)
                resp_bytes = np.random.randint(100, 5000)
                conn_state = 'SF'
            elif attack_type == 'c2':
                dst_ip = np.random.choice([ip for ip in dst_ips_pool if not is_private_ip(ip)])
                dst_port = np.random.choice([443, 8443, 4444, 5555])
                proto = 'tcp'
                service = np.random.choice(['https', '-'])
                duration = np.random.uniform(10, 300)
                orig_bytes = np.random.randint(100, 2000)
                resp_bytes = np.random.randint(500, 10000)
                conn_state = 'SF'
            else:  # ddos
                dst_ip = np.random.choice(dst_ips_pool)
                dst_port = np.random.choice([80, 53])
                proto = np.random.choice(['tcp', 'udp'])
                service = np.random.choice(['http', 'dns'])
                duration = np.random.uniform(0, 0.1)
                orig_bytes = np.random.randint(40, 1500)
                resp_bytes = np.random.randint(0, 100)
                conn_state = np.random.choice(['S0', 'SF'])
            label = 'Malicious'
            detailed_label = f'Malicious-{attack_type}'
        else:
            # Benign traffic patterns
            dst_ip = np.random.choice(dst_ips_pool[:70])  # fewer destinations
            dst_port = np.random.choice([80, 443, 53, 8883, 1883, 123])
            proto = np.random.choice(protocols, p=[0.6, 0.3, 0.1])
            service = np.random.choice(['http', 'https', 'dns', 'mqtt', '-'], p=[0.2, 0.3, 0.2, 0.2, 0.1])
            duration = np.random.uniform(0.01, 60)
            orig_bytes = np.random.randint(40, 5000)
            resp_bytes = np.random.randint(40, 20000)
            conn_state = np.random.choice(conn_states, p=[0.6, 0.1, 0.05, 0.05, 0.05, 0.05, 0.03, 0.02, 0.05])
            label = 'Benign'
            detailed_label = 'Benign'

        records.append({
            'ts': ts,
            'uid': f'C{i:08d}',
            'id.orig_h': src_ip,
            'id.orig_p': np.random.randint(1024, 65535),
            'id.resp_h': dst_ip,
            'id.resp_p': dst_port,
            'proto': proto,
            'service': service,
            'duration': round(duration, 6),
            'orig_bytes': orig_bytes,
            'resp_bytes': resp_bytes,
            'conn_state': conn_state,
            'local_orig': '-',
            'local_resp': '-',
            'missed_bytes': 0,
            'history': '-',
            'orig_pkts': np.random.randint(1, 50),
            'orig_ip_bytes': orig_bytes + 40,
            'resp_pkts': np.random.randint(0, 50),
            'resp_ip_bytes': resp_bytes + 40 if resp_bytes > 0 else 0,
            'tunnel_parents': '-',
            'label': label,
            'detailed-label': detailed_label
        })

    df = pd.DataFrame(records)
    df = df.sort_values('ts').reset_index(drop=True)
    return df


def parse_iot23_file(filepath):
    """Parse a single IoT-23 conn.log.labeled file, handling mixed delimiters."""
    rows = []
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            # Split by tab first (standard Zeek format)
            parts = line.split('\t')
            if len(parts) >= 23:
                # Standard format: all 23 columns tab-separated
                rows.append(parts[:23])
            elif len(parts) == 21:
                # Some IoT-23 files have last 3 fields (tunnel_parents, label,
                # detailed-label) joined by spaces instead of tabs
                last_field = parts[20]
                sub_parts = last_field.split()
                if len(sub_parts) >= 3:
                    rows.append(parts[:20] + sub_parts[:3])
                elif len(sub_parts) == 2:
                    rows.append(parts[:20] + sub_parts + ['-'])
                else:
                    rows.append(parts[:20] + [last_field, '-', '-'])

    df = pd.DataFrame(rows, columns=ZEEK_COLUMNS)
    return df


def load_iot23_data(data_dir=None):
    """Load IoT-23 conn.log.labeled files or generate synthetic data."""
    if data_dir is None:
        data_dir = 'data'

    # Find all conn.log.labeled files (supports multiple scenarios)
    files_to_load = sorted(glob.glob(os.path.join(data_dir, 'conn.log.labeled*')))

    if files_to_load:
        dfs = []
        for fpath in files_to_load:
            print(f"Loading IoT-23 data from {fpath}...")
            df_part = parse_iot23_file(fpath)
            print(f"  Loaded {len(df_part)} connections")
            dfs.append(df_part)

        df = pd.concat(dfs, ignore_index=True)

        # Clean and convert types
        pd.set_option('future.no_silent_downcasting', True)
        df = df.replace(['-', '(empty)', ''], np.nan)
        df['ts'] = pd.to_numeric(df['ts'], errors='coerce')
        df['duration'] = pd.to_numeric(df['duration'], errors='coerce').fillna(0)
        df['orig_bytes'] = pd.to_numeric(df['orig_bytes'], errors='coerce').fillna(0)
        df['resp_bytes'] = pd.to_numeric(df['resp_bytes'], errors='coerce').fillna(0)
        df['orig_pkts'] = pd.to_numeric(df['orig_pkts'], errors='coerce').fillna(0)
        df['resp_pkts'] = pd.to_numeric(df['resp_pkts'], errors='coerce').fillna(0)
        df['id.orig_p'] = pd.to_numeric(df['id.orig_p'], errors='coerce').fillna(0).astype(int)
        df['id.resp_p'] = pd.to_numeric(df['id.resp_p'], errors='coerce').fillna(0).astype(int)

        # Normalize labels (IoT-23 uses inconsistent casing)
        df['label'] = df['label'].fillna('Benign').str.strip().str.capitalize()
        df.loc[~df['label'].isin(['Malicious', 'Benign']), 'label'] = 'Benign'

        # Drop rows with invalid timestamps
        df = df.dropna(subset=['ts']).reset_index(drop=True)

        print(f"\nTotal IoT-23 dataset: {len(df)} connections from {df['id.orig_h'].nunique()} devices")
        print(f"  Labels: {df['label'].value_counts().to_dict()}")
    else:
        print("No IoT-23 data found. Generating synthetic dataset...")
        df = generate_synthetic_dataset()
        print(f"Generated {len(df)} connections from {df['id.orig_h'].nunique()} devices")

    return df


def extract_device_features(df):
    """
    Extract per-device behavioral features from connection data.

    Uses a sliding window approach: each device's connections are split into
    time windows, producing multiple feature samples per device. This gives
    enough labeled samples for supervised learning even with few physical devices.
    """
    print("Extracting per-device behavioral features...")

    # Window size in seconds (30-minute windows)
    WINDOW_SECONDS = 1800

    df = df.sort_values('ts').copy()
    df['time_window'] = ((df['ts'] - df['ts'].min()) // WINDOW_SECONDS).astype(int)

    # Group by (source IP, time window) to create device-window samples
    groups = df.groupby(['id.orig_h', 'time_window'])

    features_list = []
    for (src_ip, window), group in groups:
        if len(group) < 3:
            continue  # skip tiny windows

        failed_states = ['S0', 'REJ', 'RSTO', 'RSTR']
        n_failed = group['conn_state'].isin(failed_states).sum()
        n_total = len(group)

        dst_ips = group['id.resp_h'].dropna().unique()
        n_external = sum(1 for ip in dst_ips if not is_private_ip(str(ip)))

        # Majority label for this window
        mal_count = (group['label'] == 'Malicious').sum()
        label = 'Malicious' if mal_count > n_total / 2 else 'Benign'

        features_list.append({
            'device_id': f"{src_ip}_w{window}",
            'source_ip': src_ip,
            'time_window': window,
            'bytes_sent': group['orig_bytes'].sum(),
            'bytes_received': group['resp_bytes'].sum(),
            'avg_bytes_sent': group['orig_bytes'].mean(),
            'avg_bytes_received': group['resp_bytes'].mean(),
            'packet_count': group['orig_pkts'].sum(),
            'avg_connection_duration': group['duration'].mean(),
            'total_duration': group['duration'].sum(),
            'unique_dst_ips': group['id.resp_h'].nunique(),
            'unique_dst_ports': group['id.resp_p'].nunique(),
            'connection_count': n_total,
            'protocol_diversity': group['proto'].nunique(),
            'failed_connection_ratio': n_failed / n_total if n_total > 0 else 0,
            'external_ip_ratio': n_external / len(dst_ips) if len(dst_ips) > 0 else 0,
            'label': label,
            'is_malicious': 1 if label == 'Malicious' else 0,
        })

    features = pd.DataFrame(features_list)

    print(f"Extracted features for {len(features)} device-window samples")
    print(f"  From {features['source_ip'].nunique()} unique devices")
    print(f"  Benign: {(features['is_malicious'] == 0).sum()}")
    print(f"  Malicious: {(features['is_malicious'] == 1).sum()}")

    return features


def prepare_timeseries(df):
    """Prepare raw time-series data sorted by timestamp for CUSUM analysis."""
    print("Preparing time-series data...")

    cols = ['ts', 'id.orig_h', 'orig_bytes', 'resp_bytes', 'duration',
            'id.resp_h', 'id.resp_p', 'conn_state', 'label']
    if 'detailed-label' in df.columns:
        cols.append('detailed-label')

    ts_df = df[cols].copy()
    ts_df.rename(columns={'id.orig_h': 'device_id'}, inplace=True)
    if 'detailed-label' in ts_df.columns:
        ts_df.rename(columns={'detailed-label': 'attack_type'}, inplace=True)
    ts_df = ts_df.sort_values('ts').reset_index(drop=True)

    return ts_df


def run_feature_engineering(data_dir=None, output_dir='data'):
    """Run the full feature engineering pipeline."""
    # Load data
    df = load_iot23_data(data_dir)

    # Extract features
    features = extract_device_features(df)

    # Prepare time-series
    timeseries = prepare_timeseries(df)

    # Save outputs
    features_path = os.path.join(output_dir, 'features.csv')
    timeseries_path = os.path.join(output_dir, 'timeseries.csv')

    features.to_csv(features_path, index=False)
    timeseries.to_csv(timeseries_path, index=False)

    print(f"Saved features to {features_path}")
    print(f"Saved time-series to {timeseries_path}")

    return features, timeseries


if __name__ == '__main__':
    run_feature_engineering()
