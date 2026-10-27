from fastapi import APIRouter, Depends, Request
from config.security import require_service_token
from schemas.content import ContentStrategy, ContentStrategyInput
from service.content import generate_content_strategy

router = APIRouter(dependencies=[Depends(require_service_token)])


@router.post("/strategy", response_model=ContentStrategy)
async def content_strategy(payload: ContentStrategyInput, request: Request):
    return await generate_content_strategy(payload, request.app.state.http_client, request.app.state.settings)
