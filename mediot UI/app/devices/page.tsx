'use client';

import React, { useState } from 'react';
import { Device } from '@/lib/types';
import { useFilters } from '@/contexts/filter-context';
import { DeviceTable } from '@/components/device-table';
import { DeviceDetailPanel } from '@/components/device-detail-panel';

const ITEMS_PER_PAGE = 10;

export default function DevicesPage() {
  const { filteredDevices: devices, loading, selectedIps } = useFilters();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleRowClick = (device: Device) => {
    setSelectedDeviceId(device.deviceId);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedDeviceId(null), 300);
  };

  const totalPages = Math.ceil(devices.length / ITEMS_PER_PAGE);

  const healthyDevicesCount = devices.filter((d) => d.status === 'Online').length;
  const suspiciousDevicesCount = devices.filter((d) => d.status === 'Suspicious').length;
  const criticalDevicesCount = devices.filter((d) => d.status === 'Critical').length;
  const averageTrustScore =
    devices.length > 0
      ? (devices.reduce((sum, d) => sum + d.trustScore, 0) / devices.length).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="glass-effect-light border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-section-title text-slate-900 dark:text-slate-100">
            Device Explorer
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Monitor and manage all connected IoT devices
            {selectedIps.length > 0 && (
              <span className="ml-2 text-blue-400">
                — Showing {devices.length} filtered device{devices.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Devices</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{devices.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Healthy</p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{healthyDevicesCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Suspicious</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{suspiciousDevicesCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Critical</p>
            <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{criticalDevicesCount}</p>
          </div>
        </div>

        {/* Average Trust Score */}
        <div className="mb-8">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Average Trust Score</p>
            <div className="mt-2 flex items-center gap-3">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{averageTrustScore}</p>
              <div className="flex-1 max-w-xs overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-2 transition-all ${
                    Number(averageTrustScore) > 70
                      ? 'bg-green-500'
                      : Number(averageTrustScore) > 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Number(averageTrustScore)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Device Table */}
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">All Devices</h2>
          <DeviceTable
            devices={devices}
            onRowClick={handleRowClick}
            isLoading={loading}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Page {currentPage} of {totalPages} • Total {devices.length} devices
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-2 py-2 text-slate-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedDeviceId && (
        <DeviceDetailPanel
          deviceId={selectedDeviceId}
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
}
