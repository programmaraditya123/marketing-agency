from fastapi import APIRouter, Depends, HTTPException, Request

from config.security import require_service_token
from schemas.analysis import Analysis
from schemas.analysis_input import AnalysisInput
from service.analyses import analyze_website
from service.analysis_jobs import get_analysis_job, start_analysis_job

router = APIRouter(dependencies=[Depends(require_service_token)])


@router.post("", response_model=Analysis)
async def create_analysis(payload: AnalysisInput, request: Request) -> Analysis:
    return await analyze_website(payload, request.app.state.http_client, request.app.state.settings)


@router.post("/async", status_code=202)
async def create_analysis_async(payload: AnalysisInput, request: Request) -> dict[str, str]:
    job_id = start_analysis_job(payload, request.app.state.http_client, request.app.state.settings)
    return {"jobId": job_id, "status": "processing"}


@router.get("/jobs/{job_id}")
async def get_analysis_job_status(job_id: str) -> dict[str, object]:
    job = get_analysis_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    return job
