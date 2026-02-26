'use client';

import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { MetricCard } from '@/components/ui/MetricCard';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { SkeletonMetricCard, SkeletonTableRow } from '@/components/ui/Skeleton';
import { TrendLine } from '@/components/charts/TrendLine';
import { PageDiagnosisDrawer } from '@/components/drawers/PageDiagnosisDrawer';
import { sitesApi, scansApi } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { Site, ScanTask, PageResult, ScoreHistory } from '@/types/index';

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [activeScan, setActiveScan] = useState<ScanTask | null>(null);
  const [results, setResults] = useState<PageResult[]>([]);
  const [trends, setTrends] = useState<ScoreHistory[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteDomain, setNewSiteDomain] = useState('');
  const [addingSite, setAddingSite] = useState(false);

  const { messages } = useWebSocket(
    scanning && activeScan ? activeScan.id : null,
  );

  // Load sites on mount
  useEffect(() => {
    sitesApi
      .list()
      .then((data) => {
        setSites(data);
        if (data.length > 0) setSelectedSite(data[0]);
      })
      .catch(console.error)
      .finally(() => setInitialLoading(false));
  }, []);

  // Load latest scan + trends when site changes
  useEffect(() => {
    if (!selectedSite) return;
    setResults([]);
    setTrends([]);
    setActiveScan(null);
    setScanning(false);

    sitesApi.trends(selectedSite.id).then(setTrends).catch(console.error);

    sitesApi
      .scans(selectedSite.id)
      .then((scans) => {
        if (scans.length === 0) return;
        const latest = scans[0];
        setActiveScan(latest);
        if (latest.status === 'COMPLETED') {
          scansApi.results(latest.id).then(setResults).catch(console.error);
        } else if (latest.status === 'RUNNING') {
          setScanning(true);
        }
      })
      .catch(console.error);
  }, [selectedSite]);

  // Handle WebSocket messages
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];

    if (last.type === 'page_crawled') {
      setActiveScan((prev) =>
        prev
          ? {
              ...prev,
              pagesScanned: (last.pagesScanned as number) ?? prev.pagesScanned,
              pagesFound: (last.pagesFound as number) ?? prev.pagesFound,
            }
          : prev,
      );
    } else if (last.type === 'completed' && activeScan) {
      setScanning(false);
      scansApi.results(activeScan.id).then(setResults).catch(console.error);
      if (selectedSite) {
        sitesApi.trends(selectedSite.id).then(setTrends).catch(console.error);
      }
      setActiveScan((prev) =>
        prev ? { ...prev, status: 'COMPLETED' } : prev,
      );
    } else if (last.type === 'error') {
      setScanning(false);
      setActiveScan((prev) => (prev ? { ...prev, status: 'FAILED' } : prev));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const startScan = async () => {
    if (!selectedSite || scanning) return;
    setScanning(true);
    setResults([]);
    try {
      const scan = await scansApi.create({ siteId: selectedSite.id });
      setActiveScan(scan);
    } catch (err) {
      console.error(err);
      setScanning(false);
    }
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName || !newSiteDomain) return;
    setAddingSite(true);
    try {
      const site = await sitesApi.create({
        name: newSiteName,
        domain: newSiteDomain,
      });
      setSites((prev) => [site, ...prev]);
      setSelectedSite(site);
      setShowAddSite(false);
      setNewSiteName('');
      setNewSiteDomain('');
    } catch (err) {
      console.error(err);
    } finally {
      setAddingSite(false);
    }
  };

  const avgScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.seoScore, 0) / results.length,
        )
      : 0;

  const top10Pages = [...results]
    .sort((a, b) => a.seoScore - b.seoScore)
    .slice(0, 10);

  const scanStatus = activeScan?.status;
  const hasResults = results.length > 0;
  const showSkeletons = scanning && !hasResults;

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <button
            onClick={() => setShowAddSite(true)}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 transition-colors"
          >
            + Add Site
          </button>
        </div>

        {/* Add Site modal */}
        {showAddSite && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <form
              onSubmit={handleAddSite}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md space-y-4"
            >
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Add New Site
              </h2>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Site Name
                </label>
                <input
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="My Website"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Domain
                </label>
                <input
                  value={newSiteDomain}
                  onChange={(e) => setNewSiteDomain(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="example.com"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddSite(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSite}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {addingSite ? 'Adding…' : 'Add Site'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty state */}
        {!initialLoading && sites.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 dark:text-gray-500 mb-4">
              No sites registered yet.
            </p>
            <button
              onClick={() => setShowAddSite(true)}
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              Add your first site
            </button>
          </div>
        )}

        {/* Site tabs */}
        {sites.length > 0 && (
          <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700">
            {sites.map((site) => (
              <button
                key={site.id}
                onClick={() => setSelectedSite(site)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  selectedSite?.id === site.id
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {site.name}
              </button>
            ))}
          </div>
        )}

        {/* Site content */}
        {selectedSite && (
          <>
            {/* Scan controls bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {selectedSite.domain}
                </span>
                {activeScan && (
                  <span
                    className={`font-medium ${
                      scanStatus === 'COMPLETED'
                        ? 'text-passed'
                        : scanStatus === 'FAILED'
                          ? 'text-critical'
                          : scanStatus === 'RUNNING'
                            ? 'text-warning'
                            : 'text-gray-400'
                    }`}
                  >
                    {scanStatus}
                    {scanning && (
                      <span className="text-gray-400 font-normal ml-1">
                        ({activeScan.pagesScanned}/{activeScan.pagesFound} pages)
                      </span>
                    )}
                  </span>
                )}
              </div>
              <button
                onClick={startScan}
                disabled={scanning}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {scanning ? 'Scanning…' : 'Start Scan'}
              </button>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-4">
              {showSkeletons ? (
                <>
                  <SkeletonMetricCard />
                  <SkeletonMetricCard />
                  <SkeletonMetricCard />
                </>
              ) : (
                <>
                  <MetricCard
                    title="Avg SEO Score"
                    value={hasResults ? avgScore : '—'}
                    variant={
                      hasResults
                        ? avgScore < 50
                          ? 'critical'
                          : avgScore < 80
                            ? 'warning'
                            : 'passed'
                        : 'default'
                    }
                  />
                  <MetricCard
                    title="Pages Scanned"
                    value={hasResults ? results.length : '—'}
                    subtitle={
                      activeScan && activeScan.pagesFound > 0
                        ? `of ${activeScan.pagesFound} found`
                        : undefined
                    }
                  />
                  <MetricCard
                    title="Need Attention"
                    value={
                      hasResults
                        ? results.filter((r) => r.seoScore < 80).length
                        : '—'
                    }
                    variant={
                      hasResults
                        ? results.filter((r) => r.seoScore < 80).length > 0
                          ? 'warning'
                          : 'passed'
                        : 'default'
                    }
                    subtitle="pages scoring below 80"
                  />
                </>
              )}
            </div>

            {/* Trend chart */}
            {trends.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Score History
                </h2>
                <TrendLine data={trends} />
              </div>
            )}

            {/* Pages table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Lowest Scoring Pages
                  {hasResults && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      (top 10)
                    </span>
                  )}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Page
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Score
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Load Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {showSkeletons ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonTableRow key={i} />
                      ))
                    ) : top10Pages.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-10 text-center text-gray-400 dark:text-gray-500"
                        >
                          {scanStatus === 'COMPLETED'
                            ? 'No pages found.'
                            : 'Start a scan to see results.'}
                        </td>
                      </tr>
                    ) : (
                      top10Pages.map((page) => (
                        <tr
                          key={page.id}
                          onClick={() => setSelectedPageId(page.id)}
                          className="border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3 max-w-xs">
                            <span className="truncate block text-gray-800 dark:text-gray-200">
                              {page.url.replace(/^https?:\/\//, '')}
                            </span>
                            {page.title && (
                              <span className="text-xs text-gray-400 truncate block">
                                {page.title}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <ScoreBadge score={page.seoScore} />
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {page.httpStatus}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {page.loadTimeMs ? `${page.loadTimeMs}ms` : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Page Diagnosis Drawer */}
      <PageDiagnosisDrawer
        pageId={selectedPageId}
        onClose={() => setSelectedPageId(null)}
      />
    </Shell>
  );
}
