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


def _optimize_for_ai(payload: AnalysisInput) -> AnalysisInput:
    optimized_pages = []
    for page in payload.pages:
        page_dict = page.model_dump()
        if len(page_dict.get("mainText", "")) > 3000:
            page_dict["mainText"] = page_dict["mainText"][:3000]
        if len(page_dict.get("headings", [])) > 15:
            page_dict["headings"] = page_dict["headings"][:15]
        optimized_pages.append(page_dict)
    data = payload.model_dump()
    data["pages"] = optimized_pages
    return AnalysisInput.model_validate(data)


async def analyze_website(payload: AnalysisInput, client: httpx.AsyncClient, settings: Settings) -> Analysis:
    ai_input = _optimize_for_ai(payload)
    result = await analyze_with_gemini(ai_input, client, settings)
    validate_evidence(result, payload)
    return result
