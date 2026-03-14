"""
Attack Overview — Reasoning & Narrative Report

Generates a human-readable narrative answering:
  WHAT happened, HOW, WHERE, and WHEN.
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime


# Map raw IoT-23 detailed-label values to readable names
ATTACK_TYPE_NAMES = {
    'PartOfAHorizontalPortScan': 'Horizontal Port Scan',
    'DDoS': 'DDoS Attack',
    'C&C': 'Command & Control',
    'C&C-HeartBeat': 'C&C Heartbeat',
    'C&C-HeartBeat-Attack': 'C&C Heartbeat + Attack',
    'C&C-Torii': 'C&C (Torii Botnet)',
    'C&C-FileDownload': 'C&C File Download',
    'Attack': 'Generic Attack',
    'Okiru': 'Okiru Botnet',
    'DDoS-Attack': 'DDoS Attack',
    'FileDownload': 'Malicious File Download',
    # Synthetic labels
    'Malicious-scan': 'Port Scan',
    'Malicious-exfiltration': 'Data Exfiltration',
    'Malicious-c2': 'Command & Control',
    'Malicious-ddos': 'DDoS Attack',
}

# Narrative descriptions per attack category
ATTACK_NARRATIVES = {
    'scan': 'Scanning involves rapid probing of many ports/IPs to discover open services. '
            'Characterized by short-lived connections, high failure rates, and many unique destinations.',
    'ddos': 'Distributed Denial-of-Service floods a target with traffic to exhaust resources. '
            'Marked by high volume, short durations, and repeated connections to few destinations.',
    'c&c': 'Command & Control traffic maintains communication between compromised devices and an attacker\'s server. '
           'Typically long-lived connections with periodic beaconing and moderate data exchange.',
    'exfiltration': 'Data exfiltration transfers stolen data to external servers. '
                    'Characterized by high outbound byte volume with connections to external IPs.',
    'generic': 'Malicious activity detected through behavioral anomalies that deviate significantly from baseline.',
}


def _classify_attack_category(attack_type):
    """Map an attack_type string to a broad category for narrative lookup."""
    t = str(attack_type).lower()
    if any(k in t for k in ['scan', 'portscan']):
        return 'scan'
    if 'ddos' in t:
        return 'ddos'
    if 'c&c' in t or 'c2' in t or 'command' in t:
        return 'c&c'
    if 'exfil' in t or 'filedownload' in t:
        return 'exfiltration'
    return 'generic'


def _fmt_ts(epoch):
    """Format an epoch timestamp to readable string."""
    try:
        return datetime.utcfromtimestamp(float(epoch)).strftime('%Y-%m-%d %H:%M:%S UTC')
    except (ValueError, TypeError, OSError):
        return str(epoch)


def generate_attack_overview(timeseries_df, trust_df, cusum_df, alerts):
    """
    Generate a narrative attack overview from pipeline results.

    Returns:
        narrative (str): Formatted console output
        overview (dict): Structured data for JSON export
    """
    overview = {'what': {}, 'how': {}, 'where': {}, 'when': {}}

    has_attack_type = 'attack_type' in timeseries_df.columns
    mal = timeseries_df[timeseries_df['label'] == 'Malicious'].copy()
    total_connections = len(timeseries_df)
    total_malicious = len(mal)

    # ── WHAT ──────────────────────────────────────────────────
    if has_attack_type and total_malicious > 0:
        type_counts = mal['attack_type'].value_counts()
        what_entries = []
        for atype, count in type_counts.items():
            readable = ATTACK_TYPE_NAMES.get(str(atype), str(atype))
            pct = count / total_connections * 100
            what_entries.append({
                'attack_type': str(atype),
                'readable_name': readable,
                'count': int(count),
                'percentage': round(pct, 2),
            })
        overview['what'] = {
            'total_connections': total_connections,
            'total_malicious': total_malicious,
            'malicious_pct': round(total_malicious / total_connections * 100, 2),
            'attack_types': what_entries,
        }
    else:
        overview['what'] = {
            'total_connections': total_connections,
            'total_malicious': total_malicious,
            'malicious_pct': round(total_malicious / total_connections * 100, 2) if total_connections else 0,
            'attack_types': [],
        }

    # ── HOW ──────────────────────────────────────────────────
    how_entries = []
    if has_attack_type and total_malicious > 0:
        for atype in mal['attack_type'].unique():
            subset = mal[mal['attack_type'] == atype]
            category = _classify_attack_category(atype)
            readable = ATTACK_TYPE_NAMES.get(str(atype), str(atype))
            entry = {
                'attack_type': str(atype),
                'readable_name': readable,
                'category': category,
                'narrative': ATTACK_NARRATIVES.get(category, ATTACK_NARRATIVES['generic']),
                'stats': {
                    'count': int(len(subset)),
                    'avg_duration': round(float(subset['duration'].mean()), 4),
                    'avg_bytes_sent': round(float(subset['orig_bytes'].mean()), 1),
                    'avg_bytes_received': round(float(subset['resp_bytes'].mean()), 1),
                    'top_ports': subset['id.resp_p'].value_counts().head(5).to_dict(),
                    'top_conn_states': subset['conn_state'].value_counts().head(5).to_dict(),
                },
            }
            # Convert numpy types in top_ports/top_conn_states
            entry['stats']['top_ports'] = {str(k): int(v) for k, v in entry['stats']['top_ports'].items()}
            entry['stats']['top_conn_states'] = {str(k): int(v) for k, v in entry['stats']['top_conn_states'].items()}
            how_entries.append(entry)
    overview['how'] = how_entries

    # ── WHERE ────────────────────────────────────────────────
    if total_malicious > 0:
        src_ips = mal['device_id'].unique().tolist()
        dst_counts = mal['id.resp_h'].value_counts()
        top_dst_ips = dst_counts.head(5).to_dict()
        top_dst_ports = mal['id.resp_p'].value_counts().head(5).to_dict()

        from preprocessing.feature_engineering import is_private_ip
        all_dst = mal['id.resp_h'].dropna().unique()
        n_external = sum(1 for ip in all_dst if not is_private_ip(str(ip)))
        n_internal = len(all_dst) - n_external

        overview['where'] = {
            'compromised_sources': src_ips,
            'num_compromised': len(src_ips),
            'top_destinations': {str(k): int(v) for k, v in top_dst_ips.items()},
            'top_dst_ports': {str(k): int(v) for k, v in top_dst_ports.items()},
            'external_destinations': n_external,
            'internal_destinations': n_internal,
        }
    else:
        overview['where'] = {
            'compromised_sources': [],
            'num_compromised': 0,
            'top_destinations': {},
            'top_dst_ports': {},
            'external_destinations': 0,
            'internal_destinations': 0,
        }

    # ── WHEN ─────────────────────────────────────────────────
    if total_malicious > 0:
        first_ts = float(mal['ts'].min())
        last_ts = float(mal['ts'].max())
        duration_sec = last_ts - first_ts

        # CUSUM change points
        change_points = []
        if 'change_point_detected' in cusum_df.columns:
            cp_rows = cusum_df[cusum_df['change_point_detected'] == True]
            if not cp_rows.empty and 'change_point_timestamp' in cp_rows.columns:
                change_points = cp_rows['change_point_timestamp'].dropna().tolist()

        overview['when'] = {
            'first_malicious_ts': first_ts,
            'first_malicious_readable': _fmt_ts(first_ts),
            'last_malicious_ts': last_ts,
            'last_malicious_readable': _fmt_ts(last_ts),
            'attack_duration_seconds': round(duration_sec, 2),
            'cusum_change_points': [str(cp) for cp in change_points],
            'total_malicious_connections': total_malicious,
        }
    else:
        overview['when'] = {
            'first_malicious_ts': None,
            'last_malicious_ts': None,
            'attack_duration_seconds': 0,
            'cusum_change_points': [],
            'total_malicious_connections': 0,
        }

    # ── Build narrative string ───────────────────────────────
    lines = []
    lines.append("")
    lines.append("=" * 60)
    lines.append("  ATTACK OVERVIEW — Reasoning & Narrative Report")
    lines.append("=" * 60)

    # WHAT
    lines.append("")
    lines.append("[WHAT] Attack Summary")
    lines.append("-" * 40)
    w = overview['what']
    lines.append(f"  Total connections analyzed: {w['total_connections']:,}")
    lines.append(f"  Malicious connections:      {w['total_malicious']:,} ({w['malicious_pct']:.1f}%)")
    if w['attack_types']:
        lines.append("  Attack types detected:")
        for at in w['attack_types']:
            lines.append(f"    - {at['readable_name']}: {at['count']:,} ({at['percentage']:.1f}%)")

    # HOW
    lines.append("")
    lines.append("[HOW] Attack Techniques")
    lines.append("-" * 40)
    if how_entries:
        for entry in how_entries:
            s = entry['stats']
            lines.append(f"  {entry['readable_name']}:")
            lines.append(f"    {entry['narrative']}")
            lines.append(f"    Connections: {s['count']:,} | Avg duration: {s['avg_duration']:.3f}s | "
                         f"Avg bytes out: {s['avg_bytes_sent']:.0f} | Avg bytes in: {s['avg_bytes_received']:.0f}")
            top_ports_str = ", ".join(f"{p}({c})" for p, c in list(s['top_ports'].items())[:3])
            lines.append(f"    Top ports: {top_ports_str}")
    else:
        lines.append("  No detailed attack type information available.")

    # WHERE
    lines.append("")
    lines.append("[WHERE] Network Topology")
    lines.append("-" * 40)
    wh = overview['where']
    lines.append(f"  Compromised source IPs: {wh['num_compromised']}")
    if wh['compromised_sources']:
        for ip in wh['compromised_sources'][:10]:
            lines.append(f"    - {ip}")
        if wh['num_compromised'] > 10:
            lines.append(f"    ... and {wh['num_compromised'] - 10} more")
    lines.append(f"  External destinations: {wh['external_destinations']} | Internal: {wh['internal_destinations']}")
    if wh['top_destinations']:
        lines.append("  Top targeted IPs:")
        for ip, cnt in list(wh['top_destinations'].items())[:5]:
            lines.append(f"    - {ip}: {cnt:,} connections")
    if wh['top_dst_ports']:
        top_ports_str = ", ".join(f"{p}({c})" for p, c in list(wh['top_dst_ports'].items())[:5])
        lines.append(f"  Top targeted ports: {top_ports_str}")

    # WHEN
    lines.append("")
    lines.append("[WHEN] Timeline")
    lines.append("-" * 40)
    wn = overview['when']
    if wn['first_malicious_ts'] is not None:
        lines.append(f"  First malicious activity: {wn['first_malicious_readable']}")
        lines.append(f"  Last malicious activity:  {wn['last_malicious_readable']}")
        dur = wn['attack_duration_seconds']
        if dur > 3600:
            lines.append(f"  Attack duration: {dur/3600:.1f} hours ({dur:.0f}s)")
        elif dur > 60:
            lines.append(f"  Attack duration: {dur/60:.1f} minutes ({dur:.0f}s)")
        else:
            lines.append(f"  Attack duration: {dur:.1f} seconds")
        lines.append(f"  Total malicious connections: {wn['total_malicious_connections']:,}")
        if wn['cusum_change_points']:
            lines.append(f"  CUSUM change points detected: {len(wn['cusum_change_points'])}")
            for cp in wn['cusum_change_points'][:5]:
                lines.append(f"    - {_fmt_ts(cp)}")
    else:
        lines.append("  No malicious activity detected in the dataset.")

    lines.append("")
    lines.append("=" * 60)

    narrative = "\n".join(lines)
    return narrative, overview


def save_attack_overview(overview, output_dir='data'):
    """Save structured attack overview to JSON."""
    output_path = os.path.join(output_dir, 'attack_overview.json')
    with open(output_path, 'w') as f:
        json.dump(overview, f, indent=2, default=str)
    print(f"Attack overview saved to {output_path}")
    return output_path
