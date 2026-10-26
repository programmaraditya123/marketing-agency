import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("analysis")


class AnalysisError(Exception):
    def __init__(self, message: str, status_code: int = 502, code: str = "ANALYSIS_FAILED"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AnalysisError)
    async def analysis_error(_request: Request, error: AnalysisError):
        logger.warning("Analysis failed: %s", error.code, extra={"status_code": error.status_code})
        return JSONResponse(status_code=error.status_code, content={"message": error.message, "code": error.code})

    @app.exception_handler(Exception)
    async def unexpected_error(_request: Request, _error: Exception):
        logger.error("Unexpected analysis error")
        return JSONResponse(status_code=500, content={"message": "Analysis service unavailable"})
