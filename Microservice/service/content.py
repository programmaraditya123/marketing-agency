import httpx
from config.settings import Settings
from model.gemini_model import generate_structured
from prompts.content import CONTENT_STRATEGY_PROMPT
from schemas.content import ContentStrategy, ContentStrategyInput
from utils.exceptions import AnalysisError


async def generate_content_strategy(payload: ContentStrategyInput, client: httpx.AsyncClient, settings: Settings) -> ContentStrategy:
    strategy = await generate_structured(payload, ContentStrategy, CONTENT_STRATEGY_PROMPT, client, settings)

    if not strategy.platforms:
        raise AnalysisError("No social platforms were recommended. Please retry.", 502, "INVALID_CONTENT_STRATEGY")

    # Ensure platform names are clean and deduplicated
    seen_platforms = set()
    unique_platforms = []
    for platform_rec in strategy.platforms:
        key = platform_rec.platform.strip().casefold()
        if key not in seen_platforms:
            seen_platforms.add(key)
            unique_platforms.append(platform_rec)
    strategy.platforms = unique_platforms

    # Ensure content pillars exist and normalize allocations if needed
    if not strategy.contentPillars:
        raise AnalysisError("No content pillars were recommended. Please retry.", 502, "INVALID_CONTENT_PILLARS")

    total_pct = sum(p.allocationPercent for p in strategy.contentPillars)
    if total_pct > 0 and total_pct != 100:
        # Scale to 100% proportionally if reasonably close
        factor = 100 / total_pct
        accumulated = 0
        for i, pillar in enumerate(strategy.contentPillars):
            if i == len(strategy.contentPillars) - 1:
                pillar.allocationPercent = max(0, 100 - accumulated)
            else:
                scaled = round(pillar.allocationPercent * factor)
                pillar.allocationPercent = scaled
                accumulated += scaled

    return strategy
