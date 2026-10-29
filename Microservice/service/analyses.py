import httpx
from pydantic import BaseModel

from config.settings import Settings
from model.gemini_model import analyze_with_gemini
from schemas.analysis import Analysis, Finding
from schemas.analysis_input import AnalysisInput
from utils.exceptions import AnalysisError


def validate_evidence(analysis: Analysis, payload: AnalysisInput) -> None:
    sources = {str(page.url) for page in payload.pages}
    allowed_norm = {s.rstrip("/").lower(): s for s in sources}

    def inspect(value: object) -> None:
        if isinstance(value, Finding):
            if value.basis == "observed" and not value.evidenceUrls:
                object.__setattr__(value, "basis", "inferred")
            if value.basis == "unknown" and (value.value != "Unknown" or value.confidence != "low" or value.evidenceUrls):
                object.__setattr__(value, "value", "Unknown")
                object.__setattr__(value, "confidence", "low")
                object.__setattr__(value, "evidenceUrls", [])
        if isinstance(value, BaseModel):
            for name in type(value).model_fields:
                field = getattr(value, name)
                if name == "evidenceUrls" and isinstance(field, list):
                    for i, url in enumerate(field):
                        url_str = str(url)
                        url_norm = url_str.split("#")[0].rstrip("/").lower()
                        if url_str not in sources and url_norm in allowed_norm:
                            field[i] = allowed_norm[url_norm]
                    if any(str(url) not in sources for url in field):
                        raise AnalysisError("Analysis cited a page outside the crawl.")
                inspect(field)
        elif isinstance(value, list):
            for item in value:
                inspect(item)

    inspect(analysis)


async def analyze_website(payload: AnalysisInput, client: httpx.AsyncClient, settings: Settings) -> Analysis:
    result = await analyze_with_gemini(payload, client, settings)
    validate_evidence(result, payload)
    return result
