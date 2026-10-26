import logging

import httpx

from utils.exceptions import AnalysisError

logger = logging.getLogger("analysis.gemini")


def check_provider_response(response: httpx.Response, model: str) -> None:
    if response.is_success:
        return
    logger.warning("Gemini request failed: model=%s http_status=%s", model, response.status_code)
    if response.status_code in {401, 403}:
        raise AnalysisError("Gemini credentials were rejected. Check the API key and its permissions.", 502, "GEMINI_AUTH_FAILED")
    if response.status_code == 404:
        raise AnalysisError("The configured Gemini model is unavailable. Check GEMINI_MODEL.", 502, "GEMINI_MODEL_UNAVAILABLE")
    if response.status_code == 429:
        raise AnalysisError("Gemini quota or rate limit reached. Try again later.", 429, "GEMINI_RATE_LIMITED")
    if response.status_code == 400:
        raise AnalysisError("Gemini rejected the analysis request or output schema.", 502, "GEMINI_REQUEST_REJECTED")
    raise AnalysisError("Gemini is temporarily unavailable. Please try again later.", 503, "GEMINI_UNAVAILABLE")
