from fastapi import APIRouter, Depends, Request
from config.security import require_service_token
from schemas.seo import SeoComparisonInput, SeoComparisonResult
from service.seo import generate_seo_comparison

router = APIRouter(dependencies=[Depends(require_service_token)])


@router.post("/compare", response_model=SeoComparisonResult)
async def seo_compare(payload: SeoComparisonInput, request: Request):
    return await generate_seo_comparison(payload, request.app.state.http_client, request.app.state.settings)
