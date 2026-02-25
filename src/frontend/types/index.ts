export type {
  IssueCategory,
  ScanStatus,
  Site,
  ScanTask,
  PageResult,
  SeoIssue,
  AiSuggestion,
  ScoreHistory,
  WsMessage,
} from '@shared/types/index';

// Frontend-specific composite types

import type { Site, ScanTask, PageResult, SeoIssue, AiSuggestion } from '@shared/types/index';

export interface SiteWithLatestScan extends Site {
  latestScan: ScanTask | null;
}

export interface PageDiagnosis extends PageResult {
  issues: SeoIssue[];
  aiSuggestions: AiSuggestion[];
}
