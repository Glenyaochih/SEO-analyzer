import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from crawler import run_crawler
from models.orm import ScanTask, Site, PageResult
from models.schemas import ScanCreate, ScanTaskResponse, PageResultResponse
from utils.database import get_db

router = APIRouter(prefix="/scans", tags=["scans"])


@router.post("", response_model=ScanTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_scan(
    payload: ScanCreate,
    db: AsyncSession = Depends(get_db),
):
    site = await db.get(Site, payload.siteId)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    scan = ScanTask(siteId=payload.siteId, status="PENDING")
    db.add(scan)
    await db.flush()
    await db.refresh(scan)

    # Capture values before the session closes
    scan_id = scan.id
    domain = site.domain

    # Schedule crawler as a standalone asyncio task so it runs AFTER this
    # request's DB session commits (BackgroundTasks run inside the session
    # scope in modern FastAPI, causing a rollback race condition).
    loop = asyncio.get_event_loop()
    loop.call_soon(lambda: asyncio.ensure_future(run_crawler(scan_id, domain)))

    return scan


@router.get("/{scan_id}", response_model=ScanTaskResponse)
async def get_scan(scan_id: str, db: AsyncSession = Depends(get_db)):
    scan = await db.get(ScanTask, scan_id)
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    return scan


@router.get("/{scan_id}/results", response_model=list[PageResultResponse])
async def get_scan_results(scan_id: str, db: AsyncSession = Depends(get_db)):
    scan = await db.get(ScanTask, scan_id)
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    result = await db.execute(
        select(PageResult)
        .where(PageResult.scanTaskId == scan_id)
        .order_by(PageResult.seoScore.asc())
    )
    return result.scalars().all()
