'use client';

import React, { useState } from 'react';
import { Alert } from '@/lib/types';
import { useFilters } from '@/contexts/filter-context';
import { AlertTimeline } from '@/components/alert-timeline';
import { AlertTable } from '@/components/alert-table';
import { IncidentDetailPanel } from '@/components/incident-detail-panel';

const ITEMS_PER_PAGE = 10;

export default function AlertsPage() {
  const { filteredAlerts: alerts, loading, selectedIps } = useFilters();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleRowClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedAlert(null), 300);
  };

  const totalPages = Math.ceil(alerts.length / ITEMS_PER_PAGE);

  const criticalCount = alerts.filter((a) => a.severity === 'Critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'Warning' || a.severity === 'Alert').length;
  const infoCount = alerts.filter((a) => a.severity === 'Info').length;
  const averageTrustScore =
    alerts.length > 0
      ? (alerts.reduce((sum, a) => sum + a.trustScore, 0) / alerts.length).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="glass-effect-light border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-section-title text-slate-900 dark:text-slate-100">Alerts Center</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Real-time security incident monitoring and response
            {selectedIps.length > 0 && (
              <span className="ml-2 text-blue-400">
                — Showing {alerts.length} filtered alert{alerts.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Alert Statistics */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Alerts</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{alerts.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Critical</p>
            <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{criticalCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Warning</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{warningCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Info</p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{infoCount}</p>
          </div>
        </div>

        {/* Alert Timeline */}
        <div className="mb-8">
          <AlertTimeline alerts={alerts} isLoading={loading} />
        </div>

        {/* Alert Table */}
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Alert Details</h2>
          <AlertTable
            alerts={alerts}
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
              Page {currentPage} of {totalPages} • Total {alerts.length} alerts
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

        {/* Status Footer */}
        <div className="mt-8 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            SOC System Online • Monitoring Active
          </div>
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Average Trust Score: {averageTrustScore}
          </div>
        </div>
      </div>

      {/* Incident Detail Panel */}
      {selectedAlert && (
        <IncidentDetailPanel
          alert={selectedAlert}
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
}
