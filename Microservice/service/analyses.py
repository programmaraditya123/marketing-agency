import httpx
from pydantic import BaseModel

from config.settings import Settings
from model.gemini_model import analyze_with_gemini
from schemas.analysis import Analysis, Finding
from schemas.analysis_input import AnalysisInput
from utils.exceptions import AnalysisError


def validate_evidence(analysis: Analysis, payload: AnalysisInput) -> None:
    sources = {str(page.url) for page in payload.pages}

    def inspect(value: object) -> None:
        if isinstance(value, Finding):
            if value.basis == "observed" and not value.evidenceUrls:
                raise AnalysisError("An observed finding had no evidence.")
            if value.basis == "unknown" and (value.value != "Unknown" or value.confidence != "low" or value.evidenceUrls):
                raise AnalysisError("An unknown finding was not marked consistently.")
        if isinstance(value, BaseModel):
            for name in type(value).model_fields:
                field = getattr(value, name)
                if name == "evidenceUrls" and any(str(url) not in sources for url in field):
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
