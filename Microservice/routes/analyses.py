from fastapi import APIRouter, Depends, Request

from config.security import require_service_token
from schemas.analysis import Analysis
from schemas.analysis_input import AnalysisInput
from service.analyses import analyze_website

router = APIRouter(dependencies=[Depends(require_service_token)])


@router.post("", response_model=Analysis)
async def create_analysis(payload: AnalysisInput, request: Request) -> Analysis:
    return await analyze_website(payload, request.app.state.http_client, request.app.state.settings)
