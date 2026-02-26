'use client';

import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { MultiTrendLine } from '@/components/charts/MultiTrendLine';
import type { SiteTrend } from '@/components/charts/MultiTrendLine';
import { Skeleton } from '@/components/ui/Skeleton';
import { sitesApi } from '@/lib/api';
import type { Site, ScoreHistory } from '@/types/index';

const SCORE_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-red-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-cyan-500',
];

function scoreVariant(score: number) {
  if (score < 50) return 'text-red-600 dark:text-red-400';
  if (score < 80) return 'text-amber-600 dark:text-amber-400';
  return 'text-green-600 dark:text-green-400';
}

export default function TrendsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [trendsMap, setTrendsMap] = useState<Record<string, ScoreHistory[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  // Load all sites on mount
  useEffect(() => {
    sitesApi
      .list()
      .then((data) => {
        setSites(data);
        // Select all by default
        setSelectedIds(new Set(data.map((s) => s.id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch trends for any site we don't have yet
  useEffect(() => {
    sites.forEach((site) => {
      if (trendsMap[site.id] !== undefined) return;
      sitesApi
        .trends(site.id)
        .then((data) =>
          setTrendsMap((prev) => ({ ...prev, [site.id]: data })),
        )
        .catch(console.error);
    });
  }, [sites, trendsMap]);

  const toggleSite = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const chartSites: SiteTrend[] = sites
    .filter((s) => selectedIds.has(s.id) && trendsMap[s.id]?.length > 0)
    .map((s) => ({ siteId: s.id, name: s.name, data: trendsMap[s.id] }));

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Trends
        </h1>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 dark:text-gray-500">
              No sites registered yet. Add a site from the Dashboard.
            </p>
          </div>
        ) : (
          <>
            {/* Site selector cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sites.map((site, i) => {
                const trends = trendsMap[site.id] ?? [];
                const latest = trends[trends.length - 1];
                const isSelected = selectedIds.has(site.id);

                return (
                  <button
                    key={site.id}
                    onClick={() => toggleSite(site.id)}
                    className={`text-left rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-none ${SCORE_COLORS[i % SCORE_COLORS.length]}`}
                      />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {site.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate mb-1">
                      {site.domain}
                    </p>
                    {latest ? (
                      <p
                        className={`text-lg font-bold ${scoreVariant(Math.round(latest.avgScore))}`}
                      >
                        {Math.round(latest.avgScore)}
                        <span className="text-xs font-normal text-gray-400 ml-1">
                          avg score
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        No data yet
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Multi-site trend chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Score History
              </h2>
              {chartSites.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 py-10 text-center">
                  {selectedIds.size === 0
                    ? 'Select at least one site to view trends.'
                    : 'No completed scans yet for selected sites.'}
                </p>
              ) : (
                <MultiTrendLine sites={chartSites} />
              )}
            </div>

            {/* Per-site score table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Site Summary
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Site
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Latest Score
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Scans Recorded
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Last Recorded
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sites.map((site) => {
                      const trends = trendsMap[site.id] ?? [];
                      const latest = trends[trends.length - 1];
                      return (
                        <tr
                          key={site.id}
                          className="border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                        >
                          <td className="px-5 py-3">
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {site.name}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {site.domain}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {latest ? (
                              <span
                                className={`font-semibold ${scoreVariant(Math.round(latest.avgScore))}`}
                              >
                                {Math.round(latest.avgScore)}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {trends.length}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {latest
                              ? new Date(latest.recordedAt).toLocaleDateString(
                                  'en-US',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  },
                                )
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
