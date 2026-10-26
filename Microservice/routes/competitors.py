from fastapi import APIRouter, Depends, Request
from config.security import require_service_token
from schemas.competitors import CompetitorContext, CompetitorSuggestions
from service.competitors import suggest_competitors

router = APIRouter(dependencies=[Depends(require_service_token)])


@router.post("/suggestions", response_model=CompetitorSuggestions)
async def suggestions(payload: CompetitorContext, request: Request) -> CompetitorSuggestions:
    return await suggest_competitors(payload, request.app.state.http_client, request.app.state.settings)
