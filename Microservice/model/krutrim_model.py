import json
import logging
from typing import TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from config.settings import Settings
from model.gemini_schema import generation_schema
from model.krutrim_sanitizer import extract_json_payload, sanitize_payload
from utils.exceptions import AnalysisError

logger = logging.getLogger(__name__)
Output = TypeVar("Output", bound=BaseModel)


def clean_json_markdown(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned


def _extract_allowed_sources(payload: BaseModel) -> set[str] | None:
    pages = getattr(payload, "pages", None)
    if isinstance(pages, list):
        return {str(getattr(p, "url", p.get("url") if isinstance(p, dict) else "")) for p in pages if p}
    return None


async def generate_with_krutrim(
    payload: BaseModel,
    output: type[Output],
    prompt: str,
    client: httpx.AsyncClient,
    settings: Settings,
) -> Output:
    endpoint = f"{settings.krutrim_base_url}/chat/completions"
    schema = generation_schema(output)
    system_instruction = (
        f"{prompt}\n\n"
        "CRITICAL: Output ONLY valid, parseable JSON conforming strictly to this JSON schema, with no markdown code blocks:\n"
        f"{json.dumps(schema)}"
    )

    body = {
        "model": settings.krutrim_model,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": payload.model_dump_json()},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_tokens": 8192,
    }

    headers = {
        "Authorization": f"Bearer {settings.krutrim_api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = await client.post(endpoint, json=body, headers=headers, timeout=90.0)
        if response.status_code != 200:
            raise AnalysisError(f"Krutrim API returned status {response.status_code}: {response.text[:200]}", 502, "KRUTRIM_HTTP_ERROR")

        data = response.json()
        choices = data.get("choices") or []
        if not choices:
            raise AnalysisError("Krutrim did not return any choices.", 502, "KRUTRIM_NO_CHOICES")

        content = choices[0].get("message", {}).get("content", "")
        if not content:
            raise AnalysisError("Krutrim returned empty content.", 502, "KRUTRIM_EMPTY_RESPONSE")

        raw_parsed = extract_json_payload(content)
        allowed = _extract_allowed_sources(payload)
        sanitized = sanitize_payload(raw_parsed, output, allowed_sources=allowed)
        return output.model_validate(sanitized)

    except httpx.TimeoutException as error:
        raise AnalysisError("Krutrim request timed out.", 504, "KRUTRIM_TIMEOUT") from error
    except httpx.HTTPError as error:
        raise AnalysisError("Failed to connect to Krutrim.", 502, "KRUTRIM_CONNECTION_FAILED") from error
    except (ValidationError, json.JSONDecodeError, KeyError, IndexError) as error:
        logger.error(f"Krutrim parsing failed for {output.__name__}: {error}")
        raise AnalysisError(f"Krutrim returned invalid structured output: {error}", 502, "KRUTRIM_INVALID_OUTPUT") from error
