import asyncio
import logging
import time
import uuid
from typing import Any

import httpx

from config.settings import Settings
from schemas.analysis import Analysis
from schemas.analysis_input import AnalysisInput
from service.analyses import analyze_website
from utils.exceptions import AnalysisError

logger = logging.getLogger(__name__)

_JOBS: dict[str, dict[str, Any]] = {}
JOB_TTL_SECONDS = 900


def _cleanup_expired() -> None:
    now = time.time()
    expired = [jid for jid, j in _JOBS.items() if now - j.get("created_at", now) > JOB_TTL_SECONDS]
    for jid in expired:
        _JOBS.pop(jid, None)


async def _run_job(job_id: str, payload: AnalysisInput, client: httpx.AsyncClient, settings: Settings) -> None:
    try:
        result: Analysis = await analyze_website(payload, client, settings)
        _JOBS[job_id] = {
            "status": "completed",
            "result": result.model_dump(mode="json"),
            "created_at": _JOBS.get(job_id, {}).get("created_at", time.time()),
        }
    except AnalysisError as exc:
        logger.warning(f"Analysis job {job_id} failed with AnalysisError: {exc.message} ({exc.code})")
        _JOBS[job_id] = {
            "status": "failed",
            "error": exc.message,
            "code": exc.code,
            "created_at": _JOBS.get(job_id, {}).get("created_at", time.time()),
        }
    except Exception as exc:
        logger.exception(f"Analysis job {job_id} failed unexpectedly: {exc}")
        _JOBS[job_id] = {
            "status": "failed",
            "error": "Analysis failed unexpectedly. Please try again.",
            "code": "ANALYSIS_FAILED",
            "created_at": _JOBS.get(job_id, {}).get("created_at", time.time()),
        }


def start_analysis_job(payload: AnalysisInput, client: httpx.AsyncClient, settings: Settings) -> str:
    _cleanup_expired()
    job_id = uuid.uuid4().hex
    _JOBS[job_id] = {
        "status": "processing",
        "created_at": time.time(),
    }
    asyncio.create_task(_run_job(job_id, payload, client, settings))
    return job_id


def get_analysis_job(job_id: str) -> dict[str, Any] | None:
    return _JOBS.get(job_id)
