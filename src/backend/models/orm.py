from datetime import datetime
from typing import Optional
import cuid
from sqlalchemy import (
    String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, Enum as SAEnum, Index,
)
from sqlalchemy.orm import (
    DeclarativeBase, Mapped, mapped_column, relationship
)


def generate_cuid() -> str:
    return cuid.cuid()


class Base(DeclarativeBase):
    pass


class Site(Base):
    __tablename__ = "Site"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    domain: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    scanTasks: Mapped[list["ScanTask"]] = relationship("ScanTask", back_populates="site", cascade="all, delete-orphan")
    scores: Mapped[list["ScoreHistory"]] = relationship("ScoreHistory", back_populates="site", cascade="all, delete-orphan")


class ScanTask(Base):
    __tablename__ = "ScanTask"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    siteId: Mapped[str] = mapped_column(String, ForeignKey("Site.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum("PENDING", "RUNNING", "COMPLETED", "FAILED", name="ScanStatus"),
        default="PENDING",
        nullable=False,
    )
    pagesFound: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    pagesScanned: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    startedAt: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completedAt: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    site: Mapped["Site"] = relationship("Site", back_populates="scanTasks")
    pageResults: Mapped[list["PageResult"]] = relationship("PageResult", back_populates="scanTask", cascade="all, delete-orphan")


class PageResult(Base):
    __tablename__ = "PageResult"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    scanTaskId: Mapped[str] = mapped_column(String, ForeignKey("ScanTask.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    httpStatus: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    titleLength: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    metaDescription: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    metaDescLength: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    h1Count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    h2Count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    h3Count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    h1Text: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    imagesTotal: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    imagesMissingAlt: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    loadTimeMs: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    seoScore: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    crawledAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    scanTask: Mapped["ScanTask"] = relationship("ScanTask", back_populates="pageResults")
    issues: Mapped[list["SeoIssue"]] = relationship("SeoIssue", back_populates="pageResult", cascade="all, delete-orphan")
    aiSuggestions: Mapped[list["AiSuggestion"]] = relationship("AiSuggestion", back_populates="pageResult", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_pageresult_scantaskid", "scanTaskId"),
        Index("ix_pageresult_seoscore", "seoScore"),
    )


class SeoIssue(Base):
    __tablename__ = "SeoIssue"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    pageResultId: Mapped[str] = mapped_column(String, ForeignKey("PageResult.id", ondelete="CASCADE"), nullable=False)
    category: Mapped[str] = mapped_column(
        SAEnum("CRITICAL", "WARNING", "PASSED", name="IssueCategory"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    impact: Mapped[int] = mapped_column(Integer, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    pageResult: Mapped["PageResult"] = relationship("PageResult", back_populates="issues")

    __table_args__ = (
        Index("ix_seoissue_pageresultid", "pageResultId"),
        Index("ix_seoissue_category", "category"),
    )


class AiSuggestion(Base):
    __tablename__ = "AiSuggestion"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    pageResultId: Mapped[str] = mapped_column(String, ForeignKey("PageResult.id", ondelete="CASCADE"), nullable=False)
    issueCode: Mapped[str] = mapped_column(String, nullable=False)
    suggestion: Mapped[str] = mapped_column(Text, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    pageResult: Mapped["PageResult"] = relationship("PageResult", back_populates="aiSuggestions")

    __table_args__ = (
        Index("ix_aisuggestion_pageresultid", "pageResultId"),
    )


class ScoreHistory(Base):
    __tablename__ = "ScoreHistory"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)
    siteId: Mapped[str] = mapped_column(String, ForeignKey("Site.id", ondelete="CASCADE"), nullable=False)
    avgScore: Mapped[float] = mapped_column(Float, nullable=False)
    pagesCount: Mapped[int] = mapped_column(Integer, nullable=False)
    recordedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    site: Mapped["Site"] = relationship("Site", back_populates="scores")

    __table_args__ = (
        Index("ix_scorehistory_siteid_recordedat", "siteId", "recordedAt"),
    )
