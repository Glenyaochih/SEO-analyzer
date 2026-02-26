from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.orm import PageResult, ScanTask, SeoIssue, Site, ScoreHistory
from models.schemas import (
    SiteCreate,
    SiteResponse,
    ScanTaskResponse,
    ScoreHistoryResponse,
    SeoIssueWithPageResponse,
)
from utils.database import get_db

router = APIRouter(prefix="/sites", tags=["sites"])


@router.get("", response_model=list[SiteResponse])
async def list_sites(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Site).order_by(Site.createdAt.desc()))
    return result.scalars().all()


@router.post("", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
async def create_site(payload: SiteCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Site).where(Site.domain == payload.domain))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Site with domain '{payload.domain}' already exists",
        )
    site = Site(name=payload.name, domain=payload.domain)
    db.add(site)
    await db.flush()
    await db.refresh(site)
    return site


@router.get("/{site_id}/scans", response_model=list[ScanTaskResponse])
async def get_site_scans(site_id: str, db: AsyncSession = Depends(get_db)):
    site = await db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    result = await db.execute(
        select(ScanTask)
        .where(ScanTask.siteId == site_id)
        .order_by(ScanTask.createdAt.desc())
    )
    return result.scalars().all()


@router.get("/{site_id}/issues", response_model=list[SeoIssueWithPageResponse])
async def get_site_issues(
    site_id: str,
    category: Optional[str] = Query(None, description="Filter by CRITICAL, WARNING, or PASSED"),
    db: AsyncSession = Depends(get_db),
):
    site = await db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    # Find latest completed scan
    scan_result = await db.execute(
        select(ScanTask)
        .where(ScanTask.siteId == site_id, ScanTask.status == "COMPLETED")
        .order_by(ScanTask.createdAt.desc())
        .limit(1)
    )
    latest_scan = scan_result.scalar_one_or_none()
    if not latest_scan:
        return []

    # Join SeoIssue → PageResult filtered to that scan
    query = (
        select(SeoIssue, PageResult.url)
        .join(PageResult, SeoIssue.pageResultId == PageResult.id)
        .where(PageResult.scanTaskId == latest_scan.id)
        .order_by(SeoIssue.category, SeoIssue.impact.desc())
    )
    if category and category in ("CRITICAL", "WARNING", "PASSED"):
        query = query.where(SeoIssue.category == category)

    rows = (await db.execute(query)).all()
    return [
        SeoIssueWithPageResponse(
            id=issue.id,
            pageResultId=issue.pageResultId,
            pageUrl=url,
            category=issue.category,
            code=issue.code,
            description=issue.description,
            impact=issue.impact,
            createdAt=issue.createdAt,
        )
        for issue, url in rows
    ]


@router.get("/{site_id}/trends", response_model=list[ScoreHistoryResponse])
async def get_site_trends(site_id: str, db: AsyncSession = Depends(get_db)):
    site = await db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    result = await db.execute(
        select(ScoreHistory)
        .where(ScoreHistory.siteId == site_id)
        .order_by(ScoreHistory.recordedAt.asc())
    )
    return result.scalars().all()
