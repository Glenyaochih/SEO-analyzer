import type {
  Site,
  ScanTask,
  PageResult,
  ScoreHistory,
  AiSuggestion,
} from '@/types/index';
import type { PageDiagnosis } from '@/types/index';

const BASE = '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API ${res.status}: ${error}`);
  }
  return res.json() as Promise<T>;
}

export const sitesApi = {
  list: (): Promise<Site[]> => request('/sites'),
  create: (payload: { name: string; domain: string }): Promise<Site> =>
    request('/sites', { method: 'POST', body: JSON.stringify(payload) }),
  scans: (siteId: string): Promise<ScanTask[]> =>
    request(`/sites/${siteId}/scans`),
  trends: (siteId: string): Promise<ScoreHistory[]> =>
    request(`/sites/${siteId}/trends`),
};

export const scansApi = {
  create: (payload: { siteId: string }): Promise<ScanTask> =>
    request('/scans', { method: 'POST', body: JSON.stringify(payload) }),
  get: (scanId: string): Promise<ScanTask> => request(`/scans/${scanId}`),
  results: (scanId: string): Promise<PageResult[]> =>
    request(`/scans/${scanId}/results`),
};

export const pagesApi = {
  diagnose: (pageId: string): Promise<PageDiagnosis> =>
    request(`/pages/${pageId}`),
  aiSuggest: (pageId: string): Promise<AiSuggestion[]> =>
    request(`/pages/${pageId}/ai-suggest`, { method: 'POST' }),
};
