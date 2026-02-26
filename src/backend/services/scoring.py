from dataclasses import dataclass
from typing import Literal

IssueCategory = Literal["CRITICAL", "WARNING", "PASSED"]

# Mirrors src/shared/constants/scoring.ts — single source of truth
BASE_SCORE = 100

DEDUCTIONS: dict[str, int] = {
    "STATUS_4XX_5XX": 50,
    "MISSING_TITLE": 20,
    "TITLE_TOO_LONG": 10,
    "MISSING_META_DESC": 15,
    "META_DESC_TOO_LONG": 5,
    "MISSING_H1": 15,
    "MULTIPLE_H1": 10,
    "IMAGE_MISSING_ALT": 5,
    "IMAGE_MISSING_ALT_MAX": 20,
    "LOAD_TIME_SLOW": 10,
    "LOAD_TIME_VERY_SLOW": 20,
}

THRESHOLDS: dict[str, int] = {
    "TITLE_MAX_LENGTH": 60,
    "META_DESC_MAX_LENGTH": 160,
    "LOAD_TIME_SLOW_MS": 3000,
    "LOAD_TIME_VERY_SLOW_MS": 5000,
}


@dataclass
class IssueResult:
    code: str
    description: str
    impact: int
    category: IssueCategory


def score_page(
    http_status: int,
    title: str | None,
    meta_description: str | None,
    h1_count: int,
    images_missing_alt: int,
    load_time_ms: int | None,
) -> tuple[int, list[IssueResult]]:
    """
    Score a single page and return (score, issues).
    Score is clamped to [0, 100].
    """
    score = BASE_SCORE
    issues: list[IssueResult] = []

    # HTTP status error
    if http_status >= 400:
        deduction = DEDUCTIONS["STATUS_4XX_5XX"]
        score -= deduction
        issues.append(IssueResult(
            code="STATUS_ERROR",
            description=f"Page returned HTTP {http_status}",
            impact=deduction,
            category="CRITICAL",
        ))

    # Title checks
    if not title:
        deduction = DEDUCTIONS["MISSING_TITLE"]
        score -= deduction
        issues.append(IssueResult(
            code="MISSING_TITLE",
            description="Page is missing a <title> tag",
            impact=deduction,
            category="CRITICAL",
        ))
    elif len(title) > THRESHOLDS["TITLE_MAX_LENGTH"]:
        deduction = DEDUCTIONS["TITLE_TOO_LONG"]
        score -= deduction
        issues.append(IssueResult(
            code="TITLE_TOO_LONG",
            description=f"Title is {len(title)} chars (max {THRESHOLDS['TITLE_MAX_LENGTH']})",
            impact=deduction,
            category="WARNING",
        ))

    # Meta description checks
    if not meta_description:
        deduction = DEDUCTIONS["MISSING_META_DESC"]
        score -= deduction
        issues.append(IssueResult(
            code="MISSING_META_DESC",
            description="Page is missing a meta description",
            impact=deduction,
            category="WARNING",
        ))
    elif len(meta_description) > THRESHOLDS["META_DESC_MAX_LENGTH"]:
        deduction = DEDUCTIONS["META_DESC_TOO_LONG"]
        score -= deduction
        issues.append(IssueResult(
            code="META_DESC_TOO_LONG",
            description=(
                f"Meta description is {len(meta_description)} chars "
                f"(max {THRESHOLDS['META_DESC_MAX_LENGTH']})"
            ),
            impact=deduction,
            category="WARNING",
        ))

    # H1 checks
    if h1_count == 0:
        deduction = DEDUCTIONS["MISSING_H1"]
        score -= deduction
        issues.append(IssueResult(
            code="MISSING_H1",
            description="Page is missing an H1 tag",
            impact=deduction,
            category="CRITICAL",
        ))
    elif h1_count > 1:
        deduction = DEDUCTIONS["MULTIPLE_H1"]
        score -= deduction
        issues.append(IssueResult(
            code="MULTIPLE_H1",
            description=f"Page has {h1_count} H1 tags (should have exactly 1)",
            impact=deduction,
            category="WARNING",
        ))

    # Images missing alt text
    if images_missing_alt > 0:
        deduction = min(
            images_missing_alt * DEDUCTIONS["IMAGE_MISSING_ALT"],
            DEDUCTIONS["IMAGE_MISSING_ALT_MAX"],
        )
        score -= deduction
        issues.append(IssueResult(
            code="IMAGES_MISSING_ALT",
            description=f"{images_missing_alt} image(s) are missing alt text",
            impact=deduction,
            category="WARNING",
        ))

    # Load time checks
    if load_time_ms is not None:
        if load_time_ms > THRESHOLDS["LOAD_TIME_VERY_SLOW_MS"]:
            deduction = DEDUCTIONS["LOAD_TIME_VERY_SLOW"]
            score -= deduction
            issues.append(IssueResult(
                code="LOAD_TIME_VERY_SLOW",
                description=f"Page load time is {load_time_ms}ms (very slow, >5000ms)",
                impact=deduction,
                category="CRITICAL",
            ))
        elif load_time_ms > THRESHOLDS["LOAD_TIME_SLOW_MS"]:
            deduction = DEDUCTIONS["LOAD_TIME_SLOW"]
            score -= deduction
            issues.append(IssueResult(
                code="LOAD_TIME_SLOW",
                description=f"Page load time is {load_time_ms}ms (slow, >3000ms)",
                impact=deduction,
                category="WARNING",
            ))

    score = max(0, score)

    # If no issues found, add a PASSED marker
    if not issues:
        issues.append(IssueResult(
            code="ALL_PASSED",
            description="All SEO checks passed",
            impact=0,
            category="PASSED",
        ))

    return score, issues


def get_category(score: int) -> IssueCategory:
    if score < 50:
        return "CRITICAL"
    if score < 80:
        return "WARNING"
    return "PASSED"
