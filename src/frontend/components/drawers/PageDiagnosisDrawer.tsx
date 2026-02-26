'use client';

import { useState, useEffect } from 'react';
import type { PageDiagnosis, AiSuggestion } from '@/types/index';
import { pagesApi } from '@/lib/api';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { Skeleton } from '@/components/ui/Skeleton';

interface PageDiagnosisDrawerProps {
  pageId: string | null;
  onClose: () => void;
}

export function PageDiagnosisDrawer({
  pageId,
  onClose,
}: PageDiagnosisDrawerProps) {
  const [page, setPage] = useState<PageDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!pageId) {
      setPage(null);
      return;
    }
    setLoading(true);
    pagesApi
      .diagnose(pageId)
      .then(setPage)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pageId]);

  const handleGenerateAI = async () => {
    if (!pageId || !page) return;
    setAiLoading(true);
    try {
      const suggestions: AiSuggestion[] = await pagesApi.aiSuggest(pageId);
      setPage({ ...page, aiSuggestions: suggestions });
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  if (!pageId) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="w-full max-w-lg bg-white dark:bg-gray-900 shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-none">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Page Diagnosis
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
          >
            &#x2715;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : page ? (
            <>
              {/* URL + Score */}
              <div>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                  URL
                </p>
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 hover:underline break-all"
                >
                  {page.url}
                </a>
                <div className="mt-3 flex items-center gap-2">
                  <ScoreBadge score={page.seoScore} size="lg" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    SEO Score
                  </span>
                </div>
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                    HTTP Status
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {page.httpStatus}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                    Load Time
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {page.loadTimeMs ? `${page.loadTimeMs}ms` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                    H1 Tags
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {page.h1Count}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                    Images Missing Alt
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {page.imagesMissingAlt} / {page.imagesTotal}
                  </p>
                </div>
              </div>

              {/* Issues */}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Issues ({page.issues.length})
                </p>
                <div className="space-y-2">
                  {page.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`rounded-lg p-3 text-sm border ${
                        issue.category === 'CRITICAL'
                          ? 'bg-critical-bg border-critical/20'
                          : issue.category === 'WARNING'
                            ? 'bg-warning-bg border-warning/20'
                            : 'bg-passed-bg border-passed/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          {issue.code}
                        </span>
                        {issue.impact > 0 && (
                          <span className="text-xs text-gray-500">
                            -{issue.impact} pts
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700">{issue.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    AI Suggestions
                  </p>
                  <button
                    onClick={handleGenerateAI}
                    disabled={aiLoading}
                    className="text-xs bg-brand-600 text-white px-3 py-1 rounded-full hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    {aiLoading ? 'Generating…' : 'Generate'}
                  </button>
                </div>
                {page.aiSuggestions.length > 0 ? (
                  <div className="space-y-2">
                    {page.aiSuggestions.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-lg p-3 bg-brand-50 border border-brand-200 dark:bg-brand-900/10 dark:border-brand-800 text-sm"
                      >
                        <p className="font-medium text-brand-700 dark:text-brand-300 mb-1">
                          {s.issueCode}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {s.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Click &ldquo;Generate&rdquo; to get AI-powered fix
                    recommendations.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
