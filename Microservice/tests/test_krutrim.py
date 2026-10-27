import json
import httpx
import pytest

from config.settings import Settings, load_settings
from model.gemini_model import generate_structured
from model.krutrim_sanitizer import extract_json_payload, sanitize_payload
from schemas.analysis import Analysis
from schemas.analysis_input import AnalysisInput

TOKEN = "test-token-" + "k" * 32
URL = "https://example.com/"
PAYLOAD = AnalysisInput(startUrl=URL, pages=[{"url": URL, "title": "Acme", "description": "", "headings": [], "mainText": "Tools", "structuredData": [], "scrapedAt": "2026-10-21T00:00:00Z"}], socialLinks=[], warnings=[])
UNKNOWN = {"value": "Unknown", "basis": "unknown", "confidence": "low", "evidenceUrls": []}
OBSERVED = {"value": "Acme", "basis": "observed", "confidence": "high", "evidenceUrls": [URL]}
ANALYSIS_DATA = {"company": {"name": OBSERVED, **{k: UNKNOWN for k in ["summary", "industry", "businessModel", "locations"]}}, "products": [], "targetAudience": [], "positioning": {"valueProposition": UNKNOWN, "differentiators": [], "brandVoice": UNKNOWN}, "contentThemes": [], "marketingOpportunities": [], "missingInformation": [], "limitations": []}


def test_extract_and_sanitize_payload():
    raw = '<think>analyzing</think>\nHere is the result:\n```json\n{"company": {"name": {"value": "Acme", "basis": "Observed", "confidence": "High", "evidenceUrls": ["example.com"]}, "summary": "Acme Tools", "industry": "Tech", "businessModel": "SaaS", "locations": "USA", "extra_field": 123}, "products": [], "targetAudience": [], "positioning": {"valueProposition": "Tools", "differentiators": [], "brandVoice": "Direct"}, "contentThemes": [], "marketingOpportunities": [], "missingInformation": [], "limitations": [], "hallucinated_root": true}\n```'
    extracted = extract_json_payload(raw)
    sanitized = sanitize_payload(extracted, Analysis)
    result = Analysis.model_validate(sanitized)
    assert result.company.name.value == "Acme"
    assert result.company.name.basis == "observed"
    assert str(result.company.name.evidenceUrls[0]) == "https://example.com/"
    assert result.company.summary.value == "Acme Tools"
    assert not hasattr(result, "hallucinated_root")


def test_settings_supports_krutrim(monkeypatch):
    monkeypatch.setenv("KRUTRIM_API_KEY", "krutrim-secret-key")
    monkeypatch.setenv("MICROSERVICE_TOKEN", TOKEN)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    s = load_settings()
    assert s.krutrim_api_key == "krutrim-secret-key"
    assert s.krutrim_model == "gpt-oss-120b"


@pytest.mark.anyio
async def test_krutrim_primary_success():
    krutrim_called = False

    async def mock_handler(request: httpx.Request):
        nonlocal krutrim_called
        assert "cloud.olakrutrim.com" in str(request.url)
        assert request.headers.get("authorization") == "Bearer test-krutrim-key"
        krutrim_called = True
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(ANALYSIS_DATA)}}]})

    client = httpx.AsyncClient(transport=httpx.MockTransport(mock_handler))
    settings = Settings(gemini_api_key="gemini-key", gemini_model="gemini-2.5-flash", service_token=TOKEN, krutrim_api_key="test-krutrim-key")

    res = await generate_structured(PAYLOAD, Analysis, "prompt", client, settings)
    assert krutrim_called is True
    assert res.company.name.value == "Acme"


@pytest.mark.anyio
async def test_krutrim_fallback_to_gemini():
    krutrim_attempts = 0
    gemini_called = False

    async def mock_handler(request: httpx.Request):
        nonlocal krutrim_attempts, gemini_called
        if "cloud.olakrutrim.com" in str(request.url):
            krutrim_attempts += 1
            return httpx.Response(500, text="Internal Server Error")
        if "generativelanguage.googleapis.com" in str(request.url):
            gemini_called = True
            return httpx.Response(200, json={"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(ANALYSIS_DATA)}]}}]})
        return httpx.Response(404)

    client = httpx.AsyncClient(transport=httpx.MockTransport(mock_handler))
    settings = Settings(gemini_api_key="gemini-key", gemini_model="gemini-2.5-flash", service_token=TOKEN, krutrim_api_key="test-krutrim-key")

    res = await generate_structured(PAYLOAD, Analysis, "prompt", client, settings)
    assert krutrim_attempts == 1
    assert gemini_called is True
    assert res.company.name.value == "Acme"
