import httpx
from config.settings import Settings
from model.gemini_model import generate_structured
from prompts.competitors import COMPETITOR_PROMPT
from schemas.competitors import CompetitorContext, CompetitorSuggestions


async def suggest_competitors(payload: CompetitorContext, client: httpx.AsyncClient, settings: Settings) -> CompetitorSuggestions:
    return await generate_structured(payload, CompetitorSuggestions, COMPETITOR_PROMPT, client, settings)
