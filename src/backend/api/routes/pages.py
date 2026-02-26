from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from models.orm import PageResult
from models.schemas import AiSuggestionResponse, PageDiagnosisResponse
from services.ai import generate_suggestions
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


@router.post("/{page_id}/ai-suggest", response_model=list[AiSuggestionResponse])
async def generate_ai_suggestions(page_id: str, db: AsyncSession = Depends(get_db)):
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

    # Remove stale suggestions before regenerating
    for s in list(page.aiSuggestions):
        await db.delete(s)
    await db.flush()

    new_suggestions = await generate_suggestions(page, page.issues)
    for s in new_suggestions:
        db.add(s)

    if new_suggestions:
        await db.flush()
        for s in new_suggestions:
            await db.refresh(s)

    await db.commit()
    return new_suggestions
