import json

import httpx
from pydantic import BaseModel, ValidationError
from typing import TypeVar

from config.settings import Settings
from model.gemini_errors import check_provider_response
from model.gemini_schema import generation_schema
from prompts.website_analysis import SYSTEM_PROMPT
from schemas.analysis import Analysis
from schemas.analysis_input import AnalysisInput
from utils.exceptions import AnalysisError


Output = TypeVar("Output", bound=BaseModel)


async def generate_structured(payload: BaseModel, output: type[Output], prompt: str, client: httpx.AsyncClient, settings: Settings) -> Output:
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent"
    schema = generation_schema(output)
    if settings.gemini_model.startswith("gemini-2"):
        output_config = {"responseMimeType": "application/json", "responseJsonSchema": schema}
        thinking_config = {"thinkingBudget": 1024 if "pro" in settings.gemini_model else 0}
    else:
        output_config = {"responseFormat": {"text": {"mimeType": "APPLICATION_JSON", "schema": schema}}}
        thinking_config = {"thinkingLevel": "LOW"}
    body = {
        "systemInstruction": {"parts": [{"text": prompt}]},
        "contents": [{"role": "user", "parts": [{"text": payload.model_dump_json()}]}],
        "generationConfig": {
            "maxOutputTokens": 8192,
            "thinkingConfig": thinking_config,
            **output_config,
        },
    }
    try:
        response = await client.post(endpoint, json=body, headers={"x-goog-api-key": settings.gemini_api_key})
        check_provider_response(response, settings.gemini_model)
        data = response.json()
        candidates = data.get("candidates") or []
        if not candidates:
            raise AnalysisError("Gemini did not return an analysis. The request may have been blocked.", 502, "GEMINI_BLOCKED")
        candidate = candidates[0]
        if candidate.get("finishReason") == "MAX_TOKENS":
            raise AnalysisError("Gemini reached its output limit before completing the report.", 502, "GEMINI_OUTPUT_LIMIT")
        if candidate.get("finishReason") != "STOP":
            raise AnalysisError("Gemini could not complete a safe, structured analysis.", 502, "GEMINI_BLOCKED")
        text = "".join(part.get("text", "") for part in candidate.get("content", {}).get("parts", []) if not part.get("thought"))
        return output.model_validate_json(text)
    except httpx.TimeoutException as error:
        raise AnalysisError("Gemini analysis timed out. Please try again or select a faster model.", 504, "GEMINI_TIMEOUT") from error
    except httpx.HTTPError as error:
        raise AnalysisError("Cannot connect to Gemini.", 502, "GEMINI_CONNECTION_FAILED") from error
    except (ValidationError, json.JSONDecodeError, IndexError, TypeError, AttributeError) as error:
        raise AnalysisError("Gemini returned invalid structured output.", 502, "GEMINI_INVALID_OUTPUT") from error


async def analyze_with_gemini(payload: AnalysisInput, client: httpx.AsyncClient, settings: Settings) -> Analysis:
    return await generate_structured(payload, Analysis, SYSTEM_PROMPT, client, settings)
