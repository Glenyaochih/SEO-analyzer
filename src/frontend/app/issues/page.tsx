'use client';

import { useState, useEffect, useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageDiagnosisDrawer } from '@/components/drawers/PageDiagnosisDrawer';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import { sitesApi } from '@/lib/api';
import type { Site, SeoIssueWithPage, IssueCategory } from '@/types/index';

type FilterCategory = 'ALL' | IssueCategory;

const CATEGORY_COLORS: Record<IssueCategory, string> = {
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  WARNING:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  PASSED:
    'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
};

export default function IssuesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [issues, setIssues] = useState<SeoIssueWithPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('ALL');
  const [searchCode, setSearchCode] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

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

  // Load issues when site changes
  useEffect(() => {
    if (!selectedSite) return;
    setLoading(true);
    setIssues([]);
    sitesApi
      .issues(selectedSite.id)
      .then(setIssues)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedSite]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filterCategory !== 'ALL' && issue.category !== filterCategory)
        return false;
      if (
        searchCode &&
        !issue.code.toLowerCase().includes(searchCode.toLowerCase())
      )
        return false;
      return true;
    });
  }, [issues, filterCategory, searchCode]);

  const counts = useMemo(
    () => ({
      ALL: issues.length,
      CRITICAL: issues.filter((i) => i.category === 'CRITICAL').length,
      WARNING: issues.filter((i) => i.category === 'WARNING').length,
      PASSED: issues.filter((i) => i.category === 'PASSED').length,
    }),
    [issues],
  );

  const filterButtons: { label: string; value: FilterCategory }[] = [
    { label: `All (${counts.ALL})`, value: 'ALL' },
    { label: `Critical (${counts.CRITICAL})`, value: 'CRITICAL' },
    { label: `Warning (${counts.WARNING})`, value: 'WARNING' },
    { label: `Passed (${counts.PASSED})`, value: 'PASSED' },
  ];

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Issues
        </h1>

        {/* Empty state — no sites */}
        {!initialLoading && sites.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 dark:text-gray-500">
              No sites registered yet. Add a site from the Dashboard.
            </p>
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

        {selectedSite && (
          <>
            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category filter buttons */}
              <div className="flex items-center gap-1">
                {filterButtons.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setFilterCategory(value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterCategory === value
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Search by code */}
              <input
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Filter by issue code…"
                className="ml-auto px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-52"
              />
            </div>

            {/* Issues table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Category
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Issue Code
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Description
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Impact
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Page
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonTableRow key={i} />
                      ))
                    ) : filteredIssues.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-10 text-center text-gray-400 dark:text-gray-500"
                        >
                          {issues.length === 0
                            ? 'No completed scans found for this site.'
                            : 'No issues match the current filters.'}
                        </td>
                      </tr>
                    ) : (
                      filteredIssues.map((issue) => (
                        <tr
                          key={issue.id}
                          onClick={() => setSelectedPageId(issue.pageResultId)}
                          className="border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[issue.category as IssueCategory]}`}
                            >
                              {issue.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap">
                            {issue.code}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs">
                            <span className="truncate block">
                              {issue.description}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {issue.impact > 0 ? (
                              <span className="text-red-500">
                                -{issue.impact} pts
                              </span>
                            ) : (
                              <span className="text-green-500">+0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <span className="truncate block text-gray-500 dark:text-gray-400 text-xs">
                              {issue.pageUrl.replace(/^https?:\/\//, '')}
                            </span>
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
