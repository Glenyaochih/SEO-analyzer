from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict


# ─── Site ─────────────────────────────────────────────────────────────────────

class SiteCreate(BaseModel):
    name: str
    domain: str


class SiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    domain: str
    createdAt: datetime
    updatedAt: datetime


# ─── Scan Task ────────────────────────────────────────────────────────────────

class ScanCreate(BaseModel):
    siteId: str


class ScanTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    siteId: str
    status: Literal["PENDING", "RUNNING", "COMPLETED", "FAILED"]
    pagesFound: int
    pagesScanned: int
    startedAt: Optional[datetime]
    completedAt: Optional[datetime]
    createdAt: datetime
    updatedAt: datetime


# ─── SEO Issue ────────────────────────────────────────────────────────────────

class SeoIssueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    pageResultId: str
    category: Literal["CRITICAL", "WARNING", "PASSED"]
    code: str
    description: str
    impact: int
    createdAt: datetime


# ─── AI Suggestion ───────────────────────────────────────────────────────────

class AiSuggestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    pageResultId: str
    issueCode: str
    suggestion: str
    createdAt: datetime


# ─── Page Result ─────────────────────────────────────────────────────────────

class PageResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    scanTaskId: str
    url: str
    httpStatus: int
    title: Optional[str]
    titleLength: Optional[int]
    metaDescription: Optional[str]
    metaDescLength: Optional[int]
    h1Count: int
    h2Count: int
    h3Count: int
    h1Text: Optional[str]
    imagesTotal: int
    imagesMissingAlt: int
    loadTimeMs: Optional[int]
    seoScore: int
    crawledAt: datetime


class PageDiagnosisResponse(PageResultResponse):
    issues: list[SeoIssueResponse] = []
    aiSuggestions: list[AiSuggestionResponse] = []


# ─── Score History ────────────────────────────────────────────────────────────

class ScoreHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    siteId: str
    avgScore: float
    pagesCount: int
    recordedAt: datetime
