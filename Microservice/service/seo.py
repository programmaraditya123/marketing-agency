import httpx
from config.settings import Settings
from model.gemini_model import generate_structured
from prompts.seo import SEO_COMPARISON_PROMPT
from schemas.seo import SeoComparisonInput, SeoComparisonResult
from utils.exceptions import AnalysisError


async def generate_seo_comparison(
    payload: SeoComparisonInput,
    client: httpx.AsyncClient,
    settings: Settings,
) -> SeoComparisonResult:
    result = await generate_structured(payload, SeoComparisonResult, SEO_COMPARISON_PROMPT, client, settings)

    if not result.keywordGaps and not result.gapFactors:
        raise AnalysisError("No competitive SEO gap factors were generated. Please retry.", 502, "INVALID_SEO_COMPARISON")

    # Ensure profile URLs are preserved
    if not result.clientProfile.url:
        result.clientProfile.url = payload.client.url
    if not result.competitorProfile.url:
        result.competitorProfile.url = payload.competitor.url

    # Clamp scores
    result.organicOpportunityScore = max(0, min(100, result.organicOpportunityScore))
    result.clientProfile.overallSeoHealthScore = max(0, min(100, result.clientProfile.overallSeoHealthScore))
    result.competitorProfile.overallSeoHealthScore = max(0, min(100, result.competitorProfile.overallSeoHealthScore))

    # Deduplicate keyword gaps by keyword name
    seen_kw = set()
    unique_kw = []
    for item in result.keywordGaps:
        norm = item.keyword.strip().casefold()
        if norm and norm not in seen_kw:
            seen_kw.add(norm)
            unique_kw.append(item)
    result.keywordGaps = unique_kw

    # Deduplicate primary keywords
    seen_primary = set()
    unique_primary = []
    for kw in result.primaryTargetKeywords:
        norm = kw.strip().casefold()
        if norm and norm not in seen_primary:
            seen_primary.add(norm)
            unique_primary.append(kw.strip())
    result.primaryTargetKeywords = unique_primary

    return result
