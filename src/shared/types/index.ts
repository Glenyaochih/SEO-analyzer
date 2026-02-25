import type { IssueCategory, ScanStatus } from '../constants/scoring';

export type { IssueCategory, ScanStatus };

export interface Site {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScanTask {
  id: string;
  siteId: string;
  status: ScanStatus;
  pagesFound: number;
  pagesScanned: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageResult {
  id: string;
  scanTaskId: string;
  url: string;
  httpStatus: number;
  title: string | null;
  titleLength: number | null;
  metaDescription: string | null;
  metaDescLength: number | null;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h1Text: string | null;
  imagesTotal: number;
  imagesMissingAlt: number;
  loadTimeMs: number | null;
  seoScore: number;
  crawledAt: string;
}

export interface SeoIssue {
  id: string;
  pageResultId: string;
  category: IssueCategory;
  code: string;
  description: string;
  impact: number;
  createdAt: string;
}

export interface AiSuggestion {
  id: string;
  pageResultId: string;
  issueCode: string;
  suggestion: string;
  createdAt: string;
}

export interface ScoreHistory {
  id: string;
  siteId: string;
  avgScore: number;
  pagesCount: number;
  recordedAt: string;
}

export interface WsMessage {
  type: 'progress' | 'page_result' | 'completed' | 'error';
  payload: Record<string, unknown>;
}
