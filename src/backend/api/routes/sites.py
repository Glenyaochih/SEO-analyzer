from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.orm import Site, ScanTask, ScoreHistory
from models.schemas import SiteCreate, SiteResponse, ScanTaskResponse, ScoreHistoryResponse
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
