"""
MedIoT Shield — Interactive Attack Dashboard
Tableau/Power BI style interactive dashboard with cross-filtering,
drill-down, and multi-tab navigation.
"""

import streamlit as st
import pandas as pd
import numpy as np
import json
import os
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

# ── Theme & Colors ───────────────────────────────────────
COLORS = {
    "Healthy": "#00d26a",
    "Suspicious": "#f5a623",
    "ALERT": "#ff4757",
    "Benign": "#00d26a",
    "Malicious": "#ff4757",
    "CRITICAL": "#ff4757",
    "HIGH": "#f5a623",
    "bg_card": "#1a1a2e",
    "bg_dark": "#16213e",
    "accent": "#0f3460",
    "text": "#e8e8e8",
    "blue": "#4facfe",
    "purple": "#a855f7",
    "cyan": "#06d6a0",
    "orange": "#ff9f43",
}

ATTACK_COLORS = {
    "C&C": "#a855f7",
    "DDoS": "#ff4757",
    "PartOfAHorizontalPortScan": "#f5a623",
    "C&C-FileDownload": "#4facfe",
    "FileDownload": "#06d6a0",
    "Command & Control": "#a855f7",
    "DDoS Attack": "#ff4757",
    "Horizontal Port Scan": "#f5a623",
    "C&C File Download": "#4facfe",
    "Malicious File Download": "#06d6a0",
}

ATTACK_TYPE_NAMES = {
    "PartOfAHorizontalPortScan": "Horizontal Port Scan",
    "DDoS": "DDoS Attack",
    "C&C": "Command & Control",
    "C&C-HeartBeat": "C&C Heartbeat",
    "C&C-FileDownload": "C&C File Download",
    "FileDownload": "Malicious File Download",
}


# ── Page Config ──────────────────────────────────────────
st.set_page_config(
    page_title="MedIoT Shield",
    page_icon="\u26a1",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ───────────────────────────────────────────
st.markdown("""
<style>
    /* Dark theme overrides */
    .stApp { background-color: #0e1117; }

    /* KPI cards */
    .kpi-card {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid #2a2a4a;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 5px 0;
    }
    .kpi-value {
        font-size: 2.2rem;
        font-weight: 700;
        margin: 0;
        line-height: 1.2;
    }
    .kpi-label {
        font-size: 0.85rem;
        color: #8892b0;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 4px;
    }
    .kpi-delta {
        font-size: 0.9rem;
        margin-top: 2px;
    }

    /* Section headers */
    .section-header {
        font-size: 1.4rem;
        font-weight: 600;
        color: #e8e8e8;
        border-bottom: 2px solid #4facfe;
        padding-bottom: 8px;
        margin: 30px 0 15px 0;
    }

    /* Sidebar styling */
    section[data-testid="stSidebar"] {
        background-color: #0a0e1a;
        border-right: 1px solid #1a1a2e;
    }

    /* Alert severity badges */
    .badge-critical {
        background: #ff4757; color: white; padding: 3px 10px;
        border-radius: 12px; font-size: 0.75rem; font-weight: 600;
    }
    .badge-high {
        background: #f5a623; color: white; padding: 3px 10px;
        border-radius: 12px; font-size: 0.75rem; font-weight: 600;
    }

    /* Hide default streamlit elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}

    /* Tab styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        padding: 10px 24px;
        border-radius: 8px 8px 0 0;
    }

    /* Metric cards in dark mode */
    [data-testid="stMetric"] {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid #2a2a4a;
        border-radius: 10px;
        padding: 15px;
    }
</style>
""", unsafe_allow_html=True)


# ── Data Loading ─────────────────────────────────────────
@st.cache_data
def load_data():
    trust = pd.read_csv(os.path.join(DATA_DIR, "trust_scores.csv"))
    features = pd.read_csv(os.path.join(DATA_DIR, "features.csv"))
    timeseries = pd.read_csv(os.path.join(DATA_DIR, "timeseries.csv"))
    cusum = pd.read_csv(os.path.join(DATA_DIR, "cusum_results.csv"))
    with open(os.path.join(DATA_DIR, "alerts.json")) as f:
        alerts = json.load(f)
    with open(os.path.join(DATA_DIR, "attack_overview.json")) as f:
        overview = json.load(f)

    # Enrich timeseries with datetime
    timeseries["datetime"] = pd.to_datetime(timeseries["ts"], unit="s")
    timeseries["attack_label"] = timeseries["attack_type"].map(
        lambda x: ATTACK_TYPE_NAMES.get(str(x), str(x)) if pd.notna(x) else "Benign"
    )

    # Enrich features with source_ip from device_id
    if "source_ip" not in features.columns:
        features["source_ip"] = features["device_id"].str.rsplit("_w", n=1).str[0]

    return trust, features, timeseries, cusum, alerts, overview


trust_df, features_df, ts_df, cusum_df, alerts, overview = load_data()


# ── Helper: KPI Card ────────────────────────────────────
def kpi_card(label, value, delta=None, color="#4facfe"):
    delta_html = ""
    if delta is not None:
        delta_color = "#ff4757" if "%" in str(delta) else "#8892b0"
        delta_html = f'<p class="kpi-delta" style="color:{delta_color}">{delta}</p>'
    st.markdown(f"""
    <div class="kpi-card">
        <p class="kpi-value" style="color:{color}">{value}</p>
        <p class="kpi-label">{label}</p>
        {delta_html}
    </div>
    """, unsafe_allow_html=True)


# ── Helper: Plotly theme ────────────────────────────────
def apply_theme(fig, height=400):
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#e8e8e8", size=12),
        height=height,
        margin=dict(l=40, r=20, t=50, b=40),
        legend=dict(
            bgcolor="rgba(0,0,0,0)",
            borderwidth=0,
            font=dict(size=11),
        ),
        xaxis=dict(gridcolor="#1a1a2e", zerolinecolor="#1a1a2e"),
        yaxis=dict(gridcolor="#1a1a2e", zerolinecolor="#1a1a2e"),
    )
    return fig


# ══════════════════════════════════════════════════════════
# SIDEBAR — Global Filters
# ══════════════════════════════════════════════════════════
with st.sidebar:
    st.markdown("## \u26a1 MedIoT Shield")
    st.caption("Healthcare IoT Security Monitor")
    st.divider()

    st.markdown("### Filters")

    # Date range filter
    min_dt = ts_df["datetime"].min().date()
    max_dt = ts_df["datetime"].max().date()
    date_range = st.date_input(
        "Date Range",
        value=(min_dt, max_dt),
        min_value=min_dt,
        max_value=max_dt,
    )

    # Device IP filter
    all_ips = sorted(ts_df["device_id"].unique())
    selected_ips = st.multiselect(
        "Source IPs",
        options=all_ips,
        default=[],
        placeholder="All devices",
    )

    # Attack type filter
    attack_types = [t for t in ts_df["attack_label"].unique() if t != "Benign"]
    selected_attacks = st.multiselect(
        "Attack Types",
        options=sorted(attack_types),
        default=[],
        placeholder="All attack types",
    )

    # Label filter
    label_filter = st.radio(
        "Traffic Type",
        ["All", "Malicious Only", "Benign Only"],
        index=0,
    )

    # Severity filter
    severity_filter = st.multiselect(
        "Alert Severity",
        ["CRITICAL", "HIGH"],
        default=["CRITICAL", "HIGH"],
    )

    # Trust score range
    trust_range = st.slider(
        "Trust Score Range",
        min_value=0.0,
        max_value=100.0,
        value=(0.0, 100.0),
        step=1.0,
    )

    st.divider()
    st.caption("Data refreshed from pipeline output")

# ── Apply Filters ────────────────────────────────────────
filtered_ts = ts_df.copy()

# Date filter
if isinstance(date_range, tuple) and len(date_range) == 2:
    filtered_ts = filtered_ts[
        (filtered_ts["datetime"].dt.date >= date_range[0])
        & (filtered_ts["datetime"].dt.date <= date_range[1])
    ]

# IP filter
if selected_ips:
    filtered_ts = filtered_ts[filtered_ts["device_id"].isin(selected_ips)]

# Attack type filter
if selected_attacks:
    filtered_ts = filtered_ts[
        (filtered_ts["attack_label"].isin(selected_attacks))
        | (filtered_ts["label"] == "Benign")
    ]

# Label filter
if label_filter == "Malicious Only":
    filtered_ts = filtered_ts[filtered_ts["label"] == "Malicious"]
elif label_filter == "Benign Only":
    filtered_ts = filtered_ts[filtered_ts["label"] == "Benign"]

# Filter trust/features by trust range
filtered_trust = trust_df[
    (trust_df["trust_score"] >= trust_range[0])
    & (trust_df["trust_score"] <= trust_range[1])
]
if selected_ips:
    filtered_trust = filtered_trust[
        filtered_trust["device_id"].str.rsplit("_w", n=1).str[0].isin(selected_ips)
    ]

filtered_features = features_df[features_df["device_id"].isin(filtered_trust["device_id"])]

# Filter alerts
filtered_alerts = [
    a for a in alerts
    if a["severity"] in severity_filter
    and a["trust_score"] >= trust_range[0]
    and a["trust_score"] <= trust_range[1]
]
if selected_ips:
    filtered_alerts = [
        a for a in filtered_alerts
        if a["device_id"].rsplit("_w", 1)[0] in selected_ips
    ]

# Filtered malicious subset
mal_filtered = filtered_ts[filtered_ts["label"] == "Malicious"]


# ══════════════════════════════════════════════════════════
# HEADER — KPI Row
# ══════════════════════════════════════════════════════════
k1, k2, k3, k4, k5, k6 = st.columns(6)
with k1:
    kpi_card("Total Connections", f"{len(filtered_ts):,}", color="#4facfe")
with k2:
    mal_pct = len(mal_filtered) / len(filtered_ts) * 100 if len(filtered_ts) > 0 else 0
    kpi_card("Malicious", f"{len(mal_filtered):,}", f"{mal_pct:.1f}%", color="#ff4757")
with k3:
    kpi_card("Devices", f"{filtered_ts['device_id'].nunique()}", color="#a855f7")
with k4:
    kpi_card("Alerts", f"{len(filtered_alerts)}", color="#f5a623")
with k5:
    n_sources = mal_filtered["device_id"].nunique() if len(mal_filtered) > 0 else 0
    kpi_card("Compromised IPs", f"{n_sources}", color="#ff6b81")
with k6:
    avg_trust = filtered_trust["trust_score"].mean() if len(filtered_trust) > 0 else 0
    kpi_card("Avg Trust Score", f"{avg_trust:.1f}", color="#06d6a0")

st.markdown("")

# ══════════════════════════════════════════════════════════
# TABS
# ══════════════════════════════════════════════════════════
tab_overview, tab_timeline, tab_network, tab_trust, tab_alerts, tab_explore = st.tabs([
    "Attack Overview", "Timeline", "Network", "Trust Scores", "Alerts", "Feature Explorer"
])


# ── TAB 1: Attack Overview ──────────────────────────────
with tab_overview:
    st.markdown('<p class="section-header">Attack Breakdown</p>', unsafe_allow_html=True)

    col1, col2 = st.columns([1, 1])

    with col1:
        # Attack type donut
        if len(mal_filtered) > 0:
            type_counts = mal_filtered["attack_label"].value_counts().reset_index()
            type_counts.columns = ["Attack Type", "Count"]
            fig = px.pie(
                type_counts,
                values="Count",
                names="Attack Type",
                hole=0.5,
                color="Attack Type",
                color_discrete_map=ATTACK_COLORS,
            )
            fig.update_traces(
                textinfo="label+percent",
                textfont_size=12,
                hovertemplate="<b>%{label}</b><br>Connections: %{value:,}<br>Share: %{percent}<extra></extra>",
            )
            apply_theme(fig, height=420)
            fig.update_layout(title="Attack Type Distribution", showlegend=True)
            st.plotly_chart(fig, use_container_width=True, key="pie_overview")
        else:
            st.info("No malicious connections in current filter.")

    with col2:
        # Attack type bar with stats
        if len(mal_filtered) > 0:
            type_stats = mal_filtered.groupby("attack_label").agg(
                count=("attack_label", "size"),
                avg_bytes=("orig_bytes", "mean"),
                avg_duration=("duration", "mean"),
            ).reset_index().sort_values("count", ascending=True)

            fig = px.bar(
                type_stats,
                x="count",
                y="attack_label",
                orientation="h",
                color="attack_label",
                color_discrete_map=ATTACK_COLORS,
                custom_data=["avg_bytes", "avg_duration"],
            )
            fig.update_traces(
                hovertemplate=(
                    "<b>%{y}</b><br>"
                    "Connections: %{x:,}<br>"
                    "Avg bytes out: %{customdata[0]:,.0f}<br>"
                    "Avg duration: %{customdata[1]:.3f}s<extra></extra>"
                ),
                texttemplate="%{x:,}",
                textposition="outside",
            )
            apply_theme(fig, height=420)
            fig.update_layout(
                title="Connections by Attack Type",
                showlegend=False,
                xaxis_title="Connections",
                yaxis_title="",
            )
            st.plotly_chart(fig, use_container_width=True, key="bar_overview")

    # Attack technique details
    st.markdown('<p class="section-header">Attack Technique Details</p>', unsafe_allow_html=True)

    if len(mal_filtered) > 0:
        for atype in mal_filtered["attack_label"].unique():
            subset = mal_filtered[mal_filtered["attack_label"] == atype]
            # Find matching narrative from overview
            narrative = ""
            for entry in overview["how"]:
                if entry["readable_name"] == atype:
                    narrative = entry["narrative"]
                    break

            with st.expander(f"{atype} — {len(subset):,} connections", expanded=False):
                if narrative:
                    st.markdown(f"*{narrative}*")
                c1, c2, c3, c4, c5 = st.columns(5)
                c1.metric("Connections", f"{len(subset):,}")
                c2.metric("Avg Duration", f"{subset['duration'].mean():.3f}s")
                c3.metric("Avg Bytes Out", f"{subset['orig_bytes'].mean():,.0f}")
                c4.metric("Avg Bytes In", f"{subset['resp_bytes'].mean():,.0f}")
                c5.metric("Unique Targets", f"{subset['id.resp_h'].nunique()}")

                # Mini charts side by side
                mc1, mc2 = st.columns(2)
                with mc1:
                    port_counts = subset["id.resp_p"].value_counts().head(8).reset_index()
                    port_counts.columns = ["Port", "Count"]
                    port_counts["Port"] = port_counts["Port"].astype(str)
                    fig = px.bar(port_counts, x="Port", y="Count", title="Top Ports")
                    apply_theme(fig, height=250)
                    st.plotly_chart(fig, use_container_width=True, key=f"ports_{atype}")

                with mc2:
                    state_counts = subset["conn_state"].value_counts().head(6).reset_index()
                    state_counts.columns = ["State", "Count"]
                    fig = px.bar(state_counts, x="State", y="Count", title="Connection States",
                                 color="State")
                    apply_theme(fig, height=250)
                    fig.update_layout(showlegend=False)
                    st.plotly_chart(fig, use_container_width=True, key=f"states_{atype}")


# ── TAB 2: Timeline ─────────────────────────────────────
with tab_timeline:
    st.markdown('<p class="section-header">Traffic Timeline</p>', unsafe_allow_html=True)

    # Time granularity selector
    granularity = st.select_slider(
        "Time Granularity",
        options=["10min", "30min", "1h", "6h", "1D"],
        value="1h",
    )

    # Traffic over time — stacked by label
    ts_binned = filtered_ts.copy()
    ts_binned["time_bin"] = ts_binned["datetime"].dt.floor(granularity)

    traffic_over_time = ts_binned.groupby(["time_bin", "label"]).size().reset_index(name="count")
    fig = px.area(
        traffic_over_time,
        x="time_bin",
        y="count",
        color="label",
        color_discrete_map=COLORS,
        labels={"time_bin": "Time", "count": "Connections", "label": "Traffic Type"},
    )
    apply_theme(fig, height=400)
    fig.update_layout(title="All Traffic Over Time", hovermode="x unified")
    st.plotly_chart(fig, use_container_width=True, key="timeline_all")

    # Attack type breakdown over time
    if len(mal_filtered) > 0:
        mal_binned = mal_filtered.copy()
        mal_binned["time_bin"] = mal_binned["datetime"].dt.floor(granularity)
        attack_over_time = mal_binned.groupby(["time_bin", "attack_label"]).size().reset_index(name="count")

        fig = px.area(
            attack_over_time,
            x="time_bin",
            y="count",
            color="attack_label",
            color_discrete_map=ATTACK_COLORS,
            labels={"time_bin": "Time", "count": "Connections", "attack_label": "Attack Type"},
        )
        apply_theme(fig, height=380)
        fig.update_layout(title="Malicious Traffic by Attack Type", hovermode="x unified")
        st.plotly_chart(fig, use_container_width=True, key="timeline_attacks")

    # Bytes over time
    col_b1, col_b2 = st.columns(2)
    with col_b1:
        bytes_time = ts_binned.groupby("time_bin").agg(
            bytes_out=("orig_bytes", "sum"),
            bytes_in=("resp_bytes", "sum"),
        ).reset_index()
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=bytes_time["time_bin"], y=bytes_time["bytes_out"],
            name="Bytes Out", fill="tozeroy", line=dict(color="#ff4757"),
        ))
        fig.add_trace(go.Scatter(
            x=bytes_time["time_bin"], y=bytes_time["bytes_in"],
            name="Bytes In", fill="tozeroy", line=dict(color="#4facfe"),
        ))
        apply_theme(fig, height=300)
        fig.update_layout(title="Data Volume Over Time", hovermode="x unified")
        st.plotly_chart(fig, use_container_width=True, key="bytes_time")

    with col_b2:
        # Connections per device over time (top 5 most active)
        top_devices = ts_binned["device_id"].value_counts().head(5).index.tolist()
        dev_time = ts_binned[ts_binned["device_id"].isin(top_devices)]
        dev_time_agg = dev_time.groupby(["time_bin", "device_id"]).size().reset_index(name="count")
        fig = px.line(
            dev_time_agg,
            x="time_bin",
            y="count",
            color="device_id",
            labels={"time_bin": "Time", "count": "Connections"},
        )
        apply_theme(fig, height=300)
        fig.update_layout(title="Top 5 Devices Activity", hovermode="x unified")
        st.plotly_chart(fig, use_container_width=True, key="device_time")


# ── TAB 3: Network ──────────────────────────────────────
with tab_network:
    st.markdown('<p class="section-header">Network Topology</p>', unsafe_allow_html=True)

    col_n1, col_n2 = st.columns([1, 1])

    with col_n1:
        # Source IP breakdown
        if len(mal_filtered) > 0:
            src_stats = mal_filtered.groupby("device_id").agg(
                connections=("device_id", "size"),
                bytes_out=("orig_bytes", "sum"),
                unique_targets=("id.resp_h", "nunique"),
            ).reset_index().sort_values("connections", ascending=False)

            fig = px.bar(
                src_stats.head(15),
                x="connections",
                y="device_id",
                orientation="h",
                color="bytes_out",
                color_continuous_scale="Reds",
                custom_data=["bytes_out", "unique_targets"],
            )
            fig.update_traces(
                hovertemplate=(
                    "<b>%{y}</b><br>"
                    "Connections: %{x:,}<br>"
                    "Total bytes out: %{customdata[0]:,.0f}<br>"
                    "Unique targets: %{customdata[1]}<extra></extra>"
                )
            )
            apply_theme(fig, height=450)
            fig.update_layout(
                title="Compromised Source IPs",
                xaxis_title="Malicious Connections",
                yaxis_title="",
            )
            st.plotly_chart(fig, use_container_width=True, key="src_ips")

    with col_n2:
        # Destination IP breakdown
        if len(mal_filtered) > 0:
            dst_stats = mal_filtered.groupby("id.resp_h").agg(
                connections=("id.resp_h", "size"),
                bytes_in=("resp_bytes", "sum"),
                unique_sources=("device_id", "nunique"),
            ).reset_index().sort_values("connections", ascending=False)

            fig = px.bar(
                dst_stats.head(15),
                x="connections",
                y="id.resp_h",
                orientation="h",
                color="unique_sources",
                color_continuous_scale="Purples",
                custom_data=["bytes_in", "unique_sources"],
            )
            fig.update_traces(
                hovertemplate=(
                    "<b>%{y}</b><br>"
                    "Connections: %{x:,}<br>"
                    "Total bytes in: %{customdata[0]:,.0f}<br>"
                    "Unique sources: %{customdata[1]}<extra></extra>"
                )
            )
            apply_theme(fig, height=450)
            fig.update_layout(
                title="Top Targeted Destinations",
                xaxis_title="Connections",
                yaxis_title="",
            )
            st.plotly_chart(fig, use_container_width=True, key="dst_ips")

    # Port analysis
    st.markdown('<p class="section-header">Port Analysis</p>', unsafe_allow_html=True)
    col_p1, col_p2 = st.columns(2)

    with col_p1:
        if len(mal_filtered) > 0:
            port_stats = mal_filtered["id.resp_p"].value_counts().head(15).reset_index()
            port_stats.columns = ["Port", "Count"]
            port_stats["Port"] = port_stats["Port"].astype(str)
            fig = px.bar(
                port_stats,
                x="Port",
                y="Count",
                color="Count",
                color_continuous_scale="YlOrRd",
            )
            apply_theme(fig, height=350)
            fig.update_layout(title="Most Targeted Ports (Malicious)")
            st.plotly_chart(fig, use_container_width=True, key="port_bar")

    with col_p2:
        # Connection state distribution — malicious vs benign
        state_mal = mal_filtered["conn_state"].value_counts().reset_index()
        state_mal.columns = ["State", "Malicious"]
        benign_ts = filtered_ts[filtered_ts["label"] == "Benign"]
        state_ben = benign_ts["conn_state"].value_counts().reset_index()
        state_ben.columns = ["State", "Benign"]
        state_cmp = state_mal.merge(state_ben, on="State", how="outer").fillna(0)

        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=state_cmp["State"], y=state_cmp["Malicious"],
            name="Malicious", marker_color="#ff4757",
        ))
        fig.add_trace(go.Bar(
            x=state_cmp["State"], y=state_cmp["Benign"],
            name="Benign", marker_color="#00d26a",
        ))
        apply_theme(fig, height=350)
        fig.update_layout(title="Connection States: Malicious vs Benign", barmode="group")
        st.plotly_chart(fig, use_container_width=True, key="conn_states_cmp")

    # Source-to-Destination flow (Sankey)
    if len(mal_filtered) > 0:
        st.markdown('<p class="section-header">Attack Flow (Source \u2192 Destination)</p>', unsafe_allow_html=True)
        flow = mal_filtered.groupby(["device_id", "id.resp_h"]).size().reset_index(name="count")
        flow = flow.nlargest(20, "count")

        all_nodes = list(pd.concat([flow["device_id"], flow["id.resp_h"]]).unique())
        node_idx = {n: i for i, n in enumerate(all_nodes)}

        fig = go.Figure(go.Sankey(
            node=dict(
                label=all_nodes,
                color=["#ff4757" if n in flow["device_id"].values else "#4facfe" for n in all_nodes],
                pad=15,
                thickness=20,
            ),
            link=dict(
                source=[node_idx[s] for s in flow["device_id"]],
                target=[node_idx[t] for t in flow["id.resp_h"]],
                value=flow["count"].tolist(),
                color="rgba(255,71,87,0.3)",
            ),
        ))
        apply_theme(fig, height=450)
        fig.update_layout(title="Top 20 Attack Flows (Source \u2192 Destination)")
        st.plotly_chart(fig, use_container_width=True, key="sankey")


# ── TAB 4: Trust Scores ─────────────────────────────────
with tab_trust:
    st.markdown('<p class="section-header">Trust Score Analysis</p>', unsafe_allow_html=True)

    col_ts1, col_ts2 = st.columns([1, 1])

    with col_ts1:
        status_counts = filtered_trust["status"].value_counts().reset_index()
        status_counts.columns = ["Status", "Count"]
        fig = px.pie(
            status_counts,
            values="Count",
            names="Status",
            hole=0.5,
            color="Status",
            color_discrete_map=COLORS,
        )
        fig.update_traces(
            textinfo="label+value+percent",
            hovertemplate="<b>%{label}</b><br>Devices: %{value}<br>Share: %{percent}<extra></extra>",
        )
        apply_theme(fig, height=400)
        fig.update_layout(title="Device Status Distribution")
        st.plotly_chart(fig, use_container_width=True, key="trust_pie")

    with col_ts2:
        fig = px.histogram(
            filtered_trust,
            x="trust_score",
            nbins=40,
            color="status",
            color_discrete_map=COLORS,
            marginal="rug",
        )
        apply_theme(fig, height=400)
        fig.update_layout(
            title="Trust Score Distribution",
            xaxis_title="Trust Score",
            yaxis_title="Count",
            bargap=0.05,
        )
        st.plotly_chart(fig, use_container_width=True, key="trust_hist")

    # Trust score scatter: IF score vs XGBoost score
    st.markdown('<p class="section-header">Algorithm Comparison</p>', unsafe_allow_html=True)
    col_a1, col_a2 = st.columns(2)

    with col_a1:
        fig = px.scatter(
            filtered_trust,
            x="if_score",
            y="xgb_score",
            color="status",
            color_discrete_map=COLORS,
            size="trust_score",
            size_max=15,
            hover_data=["device_id", "trust_score"],
            opacity=0.7,
        )
        apply_theme(fig, height=400)
        fig.update_layout(
            title="Isolation Forest vs XGBoost Score",
            xaxis_title="Isolation Forest Score",
            yaxis_title="XGBoost Score",
        )
        # Add quadrant lines
        fig.add_hline(y=50, line_dash="dash", line_color="#2a2a4a")
        fig.add_vline(x=50, line_dash="dash", line_color="#2a2a4a")
        st.plotly_chart(fig, use_container_width=True, key="algo_scatter")

    with col_a2:
        # Trust score by actual label (box plot)
        fig = px.box(
            filtered_trust,
            x="label",
            y="trust_score",
            color="label",
            color_discrete_map=COLORS,
            points="all",
        )
        apply_theme(fig, height=400)
        fig.update_layout(
            title="Trust Score by Actual Label",
            xaxis_title="",
            yaxis_title="Trust Score",
            showlegend=False,
        )
        st.plotly_chart(fig, use_container_width=True, key="trust_box")

    # Device drill-down
    st.markdown('<p class="section-header">Device Drill-Down</p>', unsafe_allow_html=True)
    device_list = filtered_trust.sort_values("trust_score")["device_id"].tolist()
    selected_device = st.selectbox("Select a device to inspect", device_list)

    if selected_device:
        dev_row = filtered_trust[filtered_trust["device_id"] == selected_device].iloc[0]
        dev_features = features_df[features_df["device_id"] == selected_device]

        dc1, dc2, dc3, dc4, dc5 = st.columns(5)
        dc1.metric("Trust Score", f"{dev_row['trust_score']:.1f}")
        dc2.metric("Status", dev_row["status"])
        dc3.metric("IF Score", f"{dev_row['if_score']:.1f}")
        dc4.metric("XGBoost Score", f"{dev_row['xgb_score']:.1f}")
        dc5.metric("CUSUM Shift", "Yes" if dev_row["change_point_detected"] else "No")

        if not dev_features.empty:
            feat_row = dev_features.iloc[0]
            # Radar chart of key features (normalized)
            radar_cols = [
                "bytes_sent", "packet_count", "unique_dst_ips", "unique_dst_ports",
                "connection_count", "failed_connection_ratio", "external_ip_ratio",
            ]
            vals = []
            for c in radar_cols:
                col_max = features_df[c].max()
                vals.append(feat_row[c] / col_max if col_max > 0 else 0)
            vals.append(vals[0])  # close the polygon

            fig = go.Figure(go.Scatterpolar(
                r=vals,
                theta=radar_cols + [radar_cols[0]],
                fill="toself",
                fillcolor="rgba(79,172,254,0.2)",
                line_color="#4facfe",
                name=selected_device,
            ))
            apply_theme(fig, height=400)
            fig.update_layout(
                polar=dict(
                    bgcolor="rgba(0,0,0,0)",
                    radialaxis=dict(visible=True, range=[0, 1], gridcolor="#1a1a2e"),
                    angularaxis=dict(gridcolor="#1a1a2e"),
                ),
                title=f"Feature Profile: {selected_device}",
            )
            st.plotly_chart(fig, use_container_width=True, key="radar")


# ── TAB 5: Alerts ────────────────────────────────────────
with tab_alerts:
    st.markdown('<p class="section-header">Alert Dashboard</p>', unsafe_allow_html=True)

    if filtered_alerts:
        # Summary row
        n_crit = sum(1 for a in filtered_alerts if a["severity"] == "CRITICAL")
        n_high = sum(1 for a in filtered_alerts if a["severity"] == "HIGH")

        ac1, ac2, ac3 = st.columns(3)
        with ac1:
            kpi_card("Total Alerts", str(len(filtered_alerts)), color="#f5a623")
        with ac2:
            kpi_card("Critical", str(n_crit), color="#ff4757")
        with ac3:
            kpi_card("High", str(n_high), color="#f5a623")

        st.markdown("")

        # Alert severity distribution
        col_al1, col_al2 = st.columns([1, 2])

        with col_al1:
            sev_df = pd.DataFrame({"Severity": ["CRITICAL", "HIGH"], "Count": [n_crit, n_high]})
            fig = px.pie(
                sev_df[sev_df["Count"] > 0],
                values="Count",
                names="Severity",
                color="Severity",
                color_discrete_map=COLORS,
                hole=0.5,
            )
            apply_theme(fig, height=300)
            fig.update_layout(title="Severity Breakdown")
            st.plotly_chart(fig, use_container_width=True, key="sev_pie")

        with col_al2:
            # Trust score vs alert — lollipop chart
            alert_df = pd.DataFrame(filtered_alerts)
            alert_df = alert_df.sort_values("trust_score")
            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=alert_df["trust_score"],
                y=alert_df["device_id"],
                orientation="h",
                marker_color=[COLORS.get(s, "#ff4757") for s in alert_df["severity"]],
                hovertemplate="<b>%{y}</b><br>Trust Score: %{x:.1f}<extra></extra>",
            ))
            apply_theme(fig, height=max(300, len(alert_df) * 22))
            fig.update_layout(
                title="Alert Devices by Trust Score",
                xaxis_title="Trust Score",
                yaxis_title="",
                xaxis=dict(range=[0, 100]),
            )
            st.plotly_chart(fig, use_container_width=True, key="alert_lollipop")

        # Detailed alert table
        st.markdown('<p class="section-header">Alert Details</p>', unsafe_allow_html=True)

        alert_rows = []
        for a in filtered_alerts:
            alert_rows.append({
                "Device": a["device_id"],
                "Trust Score": a["trust_score"],
                "Severity": a["severity"],
                "IF Score": a["metrics"]["if_score"],
                "XGB Score": a["metrics"]["xgb_score"],
                "CUSUM Shift": a["metrics"]["cusum_shift"],
                "Flagged By": ", ".join(a["flagged_by"]),
                "Reasons": "; ".join(a["reasons"][:2]),
            })
        alert_table = pd.DataFrame(alert_rows)

        st.dataframe(
            alert_table.style.background_gradient(
                subset=["Trust Score"], cmap="RdYlGn", vmin=0, vmax=100
            ).background_gradient(
                subset=["IF Score"], cmap="RdYlGn", vmin=0, vmax=100
            ).background_gradient(
                subset=["XGB Score"], cmap="RdYlGn", vmin=0, vmax=100
            ),
            use_container_width=True,
            hide_index=True,
            height=min(600, len(alert_table) * 38 + 38),
        )
    else:
        st.info("No alerts match current filters.")


# ── TAB 6: Feature Explorer ─────────────────────────────
with tab_explore:
    st.markdown('<p class="section-header">Interactive Feature Explorer</p>', unsafe_allow_html=True)

    numeric_cols = [
        "bytes_sent", "bytes_received", "packet_count", "avg_connection_duration",
        "total_duration", "unique_dst_ips", "unique_dst_ports", "connection_count",
        "failed_connection_ratio", "external_ip_ratio",
    ]

    col_ctrl1, col_ctrl2, col_ctrl3 = st.columns(3)
    with col_ctrl1:
        x_axis = st.selectbox("X Axis", numeric_cols, index=0, key="x_ax")
    with col_ctrl2:
        y_axis = st.selectbox("Y Axis", numeric_cols, index=5, key="y_ax")
    with col_ctrl3:
        size_col = st.selectbox("Bubble Size", ["None"] + numeric_cols, index=0, key="sz")

    scatter_kwargs = dict(
        data_frame=filtered_features,
        x=x_axis,
        y=y_axis,
        color="label",
        color_discrete_map=COLORS,
        hover_data=["device_id", "source_ip"],
        opacity=0.7,
    )
    if size_col != "None":
        scatter_kwargs["size"] = size_col
        scatter_kwargs["size_max"] = 25

    fig = px.scatter(**scatter_kwargs)
    apply_theme(fig, height=500)
    fig.update_layout(title=f"{x_axis} vs {y_axis}")
    st.plotly_chart(fig, use_container_width=True, key="scatter_explore")

    # Correlation heatmap
    st.markdown('<p class="section-header">Feature Correlations</p>', unsafe_allow_html=True)
    corr = filtered_features[numeric_cols].corr()
    fig = px.imshow(
        corr,
        text_auto=".2f",
        color_continuous_scale="RdBu_r",
        zmin=-1,
        zmax=1,
        aspect="auto",
    )
    apply_theme(fig, height=500)
    fig.update_layout(title="Feature Correlation Matrix")
    st.plotly_chart(fig, use_container_width=True, key="corr_heatmap")

    # Parallel coordinates
    st.markdown('<p class="section-header">Parallel Coordinates</p>', unsafe_allow_html=True)
    pc_cols = ["bytes_sent", "packet_count", "unique_dst_ips", "unique_dst_ports",
               "connection_count", "failed_connection_ratio", "external_ip_ratio"]
    pc_data = filtered_features[pc_cols + ["is_malicious"]].copy()
    # Normalize for parallel coords
    for c in pc_cols:
        col_max = pc_data[c].max()
        if col_max > 0:
            pc_data[c] = pc_data[c] / col_max

    fig = px.parallel_coordinates(
        pc_data,
        dimensions=pc_cols,
        color="is_malicious",
        color_continuous_scale=[[0, "#00d26a"], [1, "#ff4757"]],
    )
    apply_theme(fig, height=450)
    fig.update_layout(title="Feature Profiles: Benign vs Malicious")
    st.plotly_chart(fig, use_container_width=True, key="parallel_coords")
