from fastapi import APIRouter, Depends, Request
from config.security import require_service_token
from schemas.marketing import MarketingContext, MarketingPlan
from service.marketing import recommend_channels

router = APIRouter(dependencies=[Depends(require_service_token)])


@router.post("/channels", response_model=MarketingPlan)
async def channels(payload: MarketingContext, request: Request):
    return await recommend_channels(payload, request.app.state.http_client, request.app.state.settings)
