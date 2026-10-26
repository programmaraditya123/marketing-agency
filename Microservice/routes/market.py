from fastapi import APIRouter, Depends, Request
from starlette.concurrency import run_in_threadpool
from config.security import require_service_token
from schemas.market import TrendInput, TrendData, MarketContext, DemandAnalysis
from service.market import collect_trends
from model.gemini_model import generate_structured
from prompts.market import MARKET_PROMPT

router = APIRouter(dependencies=[Depends(require_service_token)])


@router.post("/collect", response_model=TrendData)
async def collect(payload: TrendInput):
    return await run_in_threadpool(collect_trends, payload)


@router.post("/interpret", response_model=DemandAnalysis)
async def interpret(payload: MarketContext, request: Request):
    return await generate_structured(payload, DemandAnalysis, MARKET_PROMPT, request.app.state.http_client, request.app.state.settings)
