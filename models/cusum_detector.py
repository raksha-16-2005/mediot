"""
CUSUM (Cumulative Sum) change-point detection for temporal anomaly detection.
Detects when a device's behavior shifts over time.
"""

import pandas as pd
import numpy as np
import os


def cusum_detect(values, threshold=8.0, drift=1.0):
    """
    Apply CUSUM algorithm to detect change points.

    Parameters:
        values: array of observations
        threshold: decision threshold (h) for detecting a change
        drift: allowance parameter (k) - expected shift magnitude / 2

    Returns:
        change_point_idx: index of first detected change point, or None
        s_pos: positive cumulative sum array
        s_neg: negative cumulative sum array
    """
    n = len(values)
    if n < 5:
        return None, np.zeros(n), np.zeros(n)

    mean = np.mean(values[:max(5, n // 3)])  # baseline from early data
    std = np.std(values[:max(5, n // 3)])
    if std == 0:
        std = 1.0

    # Normalize
    normalized = (values - mean) / std

    s_pos = np.zeros(n)
    s_neg = np.zeros(n)
    change_point = None

    for i in range(1, n):
        s_pos[i] = max(0, s_pos[i - 1] + normalized[i] - drift)
        s_neg[i] = max(0, s_neg[i - 1] - normalized[i] - drift)

        if change_point is None and (s_pos[i] > threshold or s_neg[i] > threshold):
            change_point = i

    return change_point, s_pos, s_neg


def run_cusum_detection(timeseries_df, window_minutes=5):
    """
    Run CUSUM on per-device time-windowed metrics.

    Groups connections into time windows, computes bytes_sent and
    connection_count per window, then applies CUSUM to detect shifts.
    """
    print("\n--- CUSUM Change-Point Detection ---")

    results = []

    devices = timeseries_df['device_id'].unique()
    print(f"Analyzing {len(devices)} devices for behavioral changes...")

    for device_id in devices:
        device_data = timeseries_df[timeseries_df['device_id'] == device_id].copy()

        if len(device_data) < 10:
            results.append({
                'device_id': device_id,
                'change_point_detected': False,
                'change_point_timestamp': None,
                'cusum_metric': 'insufficient_data'
            })
            continue

        # Create time windows
        device_data['window'] = pd.to_datetime(device_data['ts'], unit='s')
        device_data['window'] = device_data['window'].dt.floor(f'{window_minutes}min')

        # Aggregate per window
        windowed = device_data.groupby('window').agg(
            bytes_sent=('orig_bytes', 'sum'),
            connection_count=('device_id', 'count')
        ).reset_index()

        if len(windowed) < 5:
            results.append({
                'device_id': device_id,
                'change_point_detected': False,
                'change_point_timestamp': None,
                'cusum_metric': 'insufficient_windows'
            })
            continue

        # Apply CUSUM on bytes_sent
        cp_bytes, _, _ = cusum_detect(windowed['bytes_sent'].values)

        # Apply CUSUM on connection_count
        cp_conn, _, _ = cusum_detect(windowed['connection_count'].values)

        # Use earliest change point from either metric
        change_detected = False
        change_ts = None
        metric_triggered = None

        if cp_bytes is not None and cp_conn is not None:
            if cp_bytes <= cp_conn:
                change_detected = True
                change_ts = str(windowed.iloc[cp_bytes]['window'])
                metric_triggered = 'bytes_sent'
            else:
                change_detected = True
                change_ts = str(windowed.iloc[cp_conn]['window'])
                metric_triggered = 'connection_count'
        elif cp_bytes is not None:
            change_detected = True
            change_ts = str(windowed.iloc[cp_bytes]['window'])
            metric_triggered = 'bytes_sent'
        elif cp_conn is not None:
            change_detected = True
            change_ts = str(windowed.iloc[cp_conn]['window'])
            metric_triggered = 'connection_count'

        results.append({
            'device_id': device_id,
            'change_point_detected': change_detected,
            'change_point_timestamp': change_ts,
            'cusum_metric': metric_triggered if metric_triggered else 'none'
        })

    cusum_df = pd.DataFrame(results)
    n_changes = cusum_df['change_point_detected'].sum()
    print(f"Change points detected: {n_changes}/{len(devices)} devices")

    return cusum_df


def save_cusum_results(cusum_df, output_dir='data'):
    """Save CUSUM results to CSV."""
    output_path = os.path.join(output_dir, 'cusum_results.csv')
    cusum_df.to_csv(output_path, index=False)
    print(f"CUSUM results saved to {output_path}")
    return output_path


if __name__ == '__main__':
    ts_df = pd.read_csv('data/timeseries.csv')
    cusum_results = run_cusum_detection(ts_df)
    save_cusum_results(cusum_results)
    print(cusum_results.head(10))
