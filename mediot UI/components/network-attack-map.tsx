'use client';

import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useAttackSimulationContext } from '@/contexts/attack-simulation-context';

interface Device {
  id: string;
  name: string;
  type: string;
  status: 'normal' | 'suspicious' | 'compromised';
  isUnderAttack?: boolean;
}

interface NetworkEdge {
  source: string;
  target: string;
  isCompromised?: boolean;
}

interface GraphNode extends Device {
  x?: number;
  y?: number;
}

const DEVICE_TYPES = [
  { id: 'pump-1', name: 'Infusion Pump', type: 'Infusion Pump', icon: '💉' },
  { id: 'monitor-1', name: 'Patient Monitor', type: 'Patient Monitor', icon: '🖥️' },
  { id: 'mri-1', name: 'MRI Controller', type: 'MRI Controller', icon: '🧲' },
  { id: 'hvac-1', name: 'HVAC Controller', type: 'HVAC Controller', icon: '❄️' },
  { id: 'station-1', name: 'Nurse Station', type: 'Nurse Station', icon: '⚕️' },
];

const NETWORK_EDGES: NetworkEdge[] = [
  { source: 'pump-1', target: 'station-1' },
  { source: 'monitor-1', target: 'station-1' },
  { source: 'mri-1', target: 'hvac-1' },
  { source: 'hvac-1', target: 'station-1' },
  { source: 'pump-1', target: 'monitor-1' },
];

export function NetworkAttackMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [attackingDevices, setAttackingDevices] = useState<Set<string>>(new Set());
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    links: NetworkEdge[];
  }>({
    nodes: [],
    links: [],
  });

  const { lastAttackedDeviceId, isAttackActive } = useAttackSimulationContext();

  // Initialize devices with random status
  useEffect(() => {
    const initialDevices: Device[] = DEVICE_TYPES.map((device) => ({
      ...device,
      status: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'suspicious' : 'compromised') : 'normal',
    }));
    setDevices(initialDevices);

    // Set up graph data
    setGraphData({
      nodes: initialDevices,
      links: NETWORK_EDGES,
    });
  }, []);

  // Simulate random attacks
  useEffect(() => {
    const attackInterval = setInterval(() => {
      if (Math.random() > 0.7 && devices.length > 0) {
        const randomDevice = devices[Math.floor(Math.random() * devices.length)];

        // Add to attacking devices
        setAttackingDevices((prev) => new Set(prev).add(randomDevice.id));

        // Update device status
        setDevices((prev) =>
          prev.map((d) =>
            d.id === randomDevice.id ? { ...d, status: 'compromised', isUnderAttack: true } : d
          )
        );

        // Remove attack indicator after 8 seconds (matches context timeout)
        setTimeout(() => {
          setAttackingDevices((prev) => {
            const next = new Set(prev);
            next.delete(randomDevice.id);
            return next;
          });

          // Reset device status after attack
          setTimeout(() => {
            setDevices((prev) =>
              prev.map((d) =>
                d.id === randomDevice.id ? { ...d, isUnderAttack: false } : d
              )
            );
          }, 500);
        }, 8000);
      }
    }, 5000);

    return () => clearInterval(attackInterval);
  }, [devices]);

  // Handle context-based attack highlighting
  useEffect(() => {
    if (lastAttackedDeviceId && isAttackActive) {
      setAttackingDevices(new Set([lastAttackedDeviceId]));
    }
  }, [lastAttackedDeviceId, isAttackActive]);

  // Update graphData when devices change
  useEffect(() => {
    setGraphData({
      nodes: devices,
      links: NETWORK_EDGES,
    });
  }, [devices]);

  const getNodeColor = (device: Device) => {
    if (attackingDevices.has(device.id)) return '#ef4444'; // Red - under attack
    if (device.status === 'compromised') return '#dc2626'; // Dark red - compromised
    if (device.status === 'suspicious') return '#eab308'; // Yellow - suspicious
    return '#3b82f6'; // Blue - normal
  };

  const getNodeSize = (device: Device) => {
    if (device.status === 'compromised') return 8;
    if (device.status === 'suspicious') return 6;
    return 5;
  };

  const handleNodeClick = (node: GraphNode & { x?: number; y?: number }) => {
    console.log('Clicked device:', node);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden"
      style={{ height: '500px', minHeight: '500px' }}
    >
      {/** Render force graph if data exists */}
      {graphData.nodes.length > 0 ? (
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData as any}
          nodeColor={(node: any) => getNodeColor(node)}
          nodeLabel={(node: any) => `${node.name}\nStatus: ${node.status}`}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Draw node background if attacking
            if (attackingDevices.has(node.id)) {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
              ctx.beginPath();
              ctx.arc(node.x, node.y, getNodeSize(node) * 3, 0, 2 * Math.PI);
              ctx.fill();

              // Draw pulsing glow
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2 / globalScale;
              ctx.beginPath();
              ctx.arc(node.x, node.y, getNodeSize(node) * 2.5, 0, 2 * Math.PI);
              ctx.stroke();
            }

            // Draw node
            ctx.fillStyle = getNodeColor(node);
            ctx.beginPath();
            ctx.arc(node.x, node.y, getNodeSize(node), 0, 2 * Math.PI);
            ctx.fill();

            // Draw label background
            const textWidth = ctx.measureText(label).width;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.fillRect(
              node.x - textWidth / 2 - 4,
              node.y + getNodeSize(node) + 8,
              textWidth + 8,
              fontSize + 4
            );

            // Draw label
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(label, node.x, node.y + getNodeSize(node) + 12);
          }}
          linkCanvasObject={(
            link: any,
            ctx: CanvasRenderingContext2D,
            globalScale: number
          ) => {
            const start = link.source;
            const end = link.target;

            // Check if this link connects to an attacking device
            const isCompromised =
              attackingDevices.has(start.id) || attackingDevices.has(end.id);

            ctx.strokeStyle = isCompromised ? 'rgba(239, 68, 68, 0.8)' : 'rgba(71, 85, 105, 0.4)';
            ctx.lineWidth = isCompromised ? 3 / globalScale : 1 / globalScale;

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            // Draw glow for compromised links
            if (isCompromised) {
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
              ctx.lineWidth = 8 / globalScale;
              ctx.beginPath();
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);
              ctx.stroke();
            }
          }}
          onNodeClick={handleNodeClick}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-slate-400">
          <p>Loading network map...</p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700 rounded-lg p-4 text-sm max-w-xs">
        <h3 className="font-semibold text-slate-100 mb-3">Network Status</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-400">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-slate-400">Suspicious</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-slate-400">Compromised</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-slate-400">Under Attack</span>
          </div>
        </div>
      </div>

      {/* Device Stats */}
      <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 rounded-lg p-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-slate-500 text-xs">Normal</p>
            <p className="text-blue-400 font-semibold">
              {devices.filter((d) => d.status === 'normal').length}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Suspicious</p>
            <p className="text-yellow-400 font-semibold">
              {devices.filter((d) => d.status === 'suspicious').length}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Compromised</p>
            <p className="text-red-500 font-semibold">
              {devices.filter((d) => d.status === 'compromised').length}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Attacking</p>
            <p className="text-red-400 font-semibold">{attackingDevices.size}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
