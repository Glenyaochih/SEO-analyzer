import json
import re

import anthropic

from config import get_settings
from models.orm import AiSuggestion, PageResult, SeoIssue

settings = get_settings()

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


async def generate_suggestions(
    page: PageResult, issues: list[SeoIssue]
) -> list[AiSuggestion]:
    """
    Call Claude API to generate actionable fix suggestions for each non-PASSED SEO issue.
    Returns a list of unsaved AiSuggestion ORM objects.
    """
    actionable = [i for i in issues if i.category != "PASSED"]
    if not actionable or not settings.anthropic_api_key:
        return []

    issues_text = "\n".join(
        f"- [{i.category}] {i.code}: {i.description}" for i in actionable
    )

    prompt = (
        "You are an SEO expert. The following page has SEO issues:\n"
        f"URL: {page.url}\n"
        f"Title: {page.title or 'None'}\n"
        f"Meta description: {page.metaDescription or 'None'}\n\n"
        f"Issues found:\n{issues_text}\n\n"
        "For each issue, provide a concise, actionable fix recommendation in 1-2 sentences.\n"
        "Respond with ONLY a JSON array, no other text. Example format:\n"
        '[{"issueCode": "MISSING_TITLE", "suggestion": "Add a descriptive title tag..."}]'
    )

    client = _get_client()
    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    content = message.content[0].text
    json_match = re.search(r"\[.*?\]", content, re.DOTALL)
    if not json_match:
        return []

    try:
        items = json.loads(json_match.group())
    except json.JSONDecodeError:
        return []

    return [
        AiSuggestion(
            pageResultId=page.id,
            issueCode=item.get("issueCode", ""),
            suggestion=item.get("suggestion", ""),
        )
        for item in items
        if isinstance(item, dict)
        and item.get("issueCode")
        and item.get("suggestion")
    ]
