from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from models.orm import PageResult
from models.schemas import PageDiagnosisResponse
from utils.database import get_db

router = APIRouter(prefix="/pages", tags=["pages"])


@router.get("/{page_id}", response_model=PageDiagnosisResponse)
async def get_page_diagnosis(page_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PageResult)
        .where(PageResult.id == page_id)
        .options(
            selectinload(PageResult.issues),
            selectinload(PageResult.aiSuggestions),
        )
    )
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page result not found")
    return page
