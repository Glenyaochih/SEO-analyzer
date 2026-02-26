import time
from datetime import datetime
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, Browser

from config import get_settings
from models.orm import PageResult, ScanTask, SeoIssue, ScoreHistory
from services.scoring import score_page
from services.ws_manager import manager
from utils.database import AsyncSessionLocal

settings = get_settings()


async def run_crawler(scan_id: str, domain: str) -> None:
    """
    Background task: crawl all internal pages for a scan.
    Uses BFS traversal up to max_crawl_depth and max_pages_per_scan.
    Persists PageResult + SeoIssue rows and broadcasts WS progress events.
    """
    db = AsyncSessionLocal()
    try:
        # ── Mark RUNNING ──────────────────────────────────────────────────────
        scan = await db.get(ScanTask, scan_id)
        scan.status = "RUNNING"
        scan.startedAt = datetime.utcnow()
        await db.commit()
        await manager.broadcast(scan_id, {"type": "status", "status": "RUNNING"})

        # ── Resolve base URL ──────────────────────────────────────────────────
        base_url = domain if domain.startswith("http") else f"https://{domain}"
        base_host = urlparse(base_url).netloc

        visited: set[str] = set()
        queue: list[tuple[str, int]] = [(base_url, 0)]  # (url, depth)
        pages_saved = 0
        total_score = 0

        # ── Playwright session ────────────────────────────────────────────────
        async with async_playwright() as pw:
            browser: Browser = await pw.chromium.launch(headless=True)
            try:
                while queue and pages_saved < settings.max_pages_per_scan:
                    url, depth = queue.pop(0)
                    norm = _normalize_url(url)
                    if norm in visited:
                        continue
                    visited.add(norm)

                    # ── Crawl single page ─────────────────────────────────────
                    page_data = await _crawl_page(browser, url, base_host)
                    if page_data is None:
                        continue

                    # ── Score ─────────────────────────────────────────────────
                    seo_score, issues = score_page(
                        http_status=page_data["http_status"],
                        title=page_data["title"],
                        meta_description=page_data["meta_description"],
                        h1_count=page_data["h1_count"],
                        images_missing_alt=page_data["images_missing_alt"],
                        load_time_ms=page_data["load_time_ms"],
                    )

                    # ── Persist PageResult ────────────────────────────────────
                    page_result = PageResult(
                        scanTaskId=scan_id,
                        url=url,
                        httpStatus=page_data["http_status"],
                        title=page_data["title"],
                        titleLength=len(page_data["title"]) if page_data["title"] else None,
                        metaDescription=page_data["meta_description"],
                        metaDescLength=(
                            len(page_data["meta_description"])
                            if page_data["meta_description"]
                            else None
                        ),
                        h1Count=page_data["h1_count"],
                        h2Count=page_data["h2_count"],
                        h3Count=page_data["h3_count"],
                        h1Text=page_data["h1_text"],
                        imagesTotal=page_data["images_total"],
                        imagesMissingAlt=page_data["images_missing_alt"],
                        loadTimeMs=page_data["load_time_ms"],
                        seoScore=seo_score,
                    )
                    db.add(page_result)
                    await db.flush()  # populate page_result.id

                    # ── Persist SeoIssues ─────────────────────────────────────
                    for issue in issues:
                        db.add(SeoIssue(
                            pageResultId=page_result.id,
                            category=issue.category,
                            code=issue.code,
                            description=issue.description,
                            impact=issue.impact,
                        ))

                    pages_saved += 1
                    total_score += seo_score

                    # ── Update ScanTask counters ──────────────────────────────
                    scan = await db.get(ScanTask, scan_id)
                    scan.pagesFound = len(visited) + len(queue)
                    scan.pagesScanned = pages_saved
                    await db.commit()

                    # ── Broadcast progress ────────────────────────────────────
                    await manager.broadcast(scan_id, {
                        "type": "page_crawled",
                        "url": url,
                        "seoScore": seo_score,
                        "pagesScanned": pages_saved,
                        "pagesFound": scan.pagesFound,
                    })

                    # ── Enqueue internal links ────────────────────────────────
                    if depth < settings.max_crawl_depth:
                        for link in page_data["internal_links"]:
                            if _normalize_url(link) not in visited:
                                queue.append((link, depth + 1))

            finally:
                await browser.close()

        # ── Save ScoreHistory ─────────────────────────────────────────────────
        avg_score = total_score / pages_saved if pages_saved > 0 else 0.0
        if pages_saved > 0:
            scan = await db.get(ScanTask, scan_id)
            db.add(ScoreHistory(
                siteId=scan.siteId,
                avgScore=avg_score,
                pagesCount=pages_saved,
            ))

        # ── Mark COMPLETED ────────────────────────────────────────────────────
        scan = await db.get(ScanTask, scan_id)
        scan.status = "COMPLETED"
        scan.completedAt = datetime.utcnow()
        scan.pagesFound = len(visited)
        scan.pagesScanned = pages_saved
        await db.commit()

        await manager.broadcast(scan_id, {
            "type": "completed",
            "pagesScanned": pages_saved,
            "avgScore": avg_score,
        })

    except Exception as exc:
        await db.rollback()
        try:
            scan = await db.get(ScanTask, scan_id)
            if scan:
                scan.status = "FAILED"
                scan.completedAt = datetime.utcnow()
                await db.commit()
        except Exception:
            pass
        await manager.broadcast(scan_id, {"type": "error", "message": str(exc)})
        raise

    finally:
        await db.close()


async def _crawl_page(browser: Browser, url: str, base_host: str) -> dict | None:
    """
    Load a single page with Playwright, extract SEO data, and return a dict.
    Returns None if the page cannot be loaded.
    """
    page = await browser.new_page()
    try:
        start = time.monotonic()
        try:
            response = await page.goto(
                url,
                timeout=settings.crawl_timeout_seconds * 1000,
                wait_until="domcontentloaded",
            )
        except Exception:
            return None

        load_time_ms = int((time.monotonic() - start) * 1000)

        if response is None:
            return None

        http_status = response.status
        content = await page.content()
        soup = BeautifulSoup(content, "lxml")

        # ── Title ─────────────────────────────────────────────────────────────
        title_tag = soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else None

        # ── Meta description ──────────────────────────────────────────────────
        meta_tag = soup.find("meta", attrs={"name": "description"})
        meta_description: str | None = None
        if meta_tag:
            val = meta_tag.get("content", "").strip()
            if val:
                meta_description = val

        # ── Headings ──────────────────────────────────────────────────────────
        h1_tags = soup.find_all("h1")
        h2_tags = soup.find_all("h2")
        h3_tags = soup.find_all("h3")
        h1_text = h1_tags[0].get_text(strip=True) if h1_tags else None

        # ── Images ────────────────────────────────────────────────────────────
        images = soup.find_all("img")
        images_missing_alt = sum(
            1 for img in images if not img.get("alt", "").strip()
        )

        # ── Internal links ────────────────────────────────────────────────────
        seen_links: set[str] = set()
        internal_links: list[str] = []
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"].strip()
            if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
                continue
            full_url = urljoin(url, href)
            parsed = urlparse(full_url)
            if parsed.netloc == base_host and parsed.scheme in ("http", "https"):
                clean = parsed._replace(fragment="").geturl()
                if clean not in seen_links:
                    seen_links.add(clean)
                    internal_links.append(clean)

        return {
            "http_status": http_status,
            "title": title,
            "meta_description": meta_description,
            "h1_count": len(h1_tags),
            "h2_count": len(h2_tags),
            "h3_count": len(h3_tags),
            "h1_text": h1_text,
            "images_total": len(images),
            "images_missing_alt": images_missing_alt,
            "load_time_ms": load_time_ms,
            "internal_links": internal_links,
        }

    finally:
        await page.close()


def _normalize_url(url: str) -> str:
    """Normalize URL for dedup: lowercase host, strip trailing slash and fragment."""
    parsed = urlparse(url)
    path = parsed.path.rstrip("/") or "/"
    return parsed._replace(
        scheme=parsed.scheme.lower(),
        netloc=parsed.netloc.lower(),
        path=path,
        fragment="",
        query=parsed.query,
    ).geturl()
