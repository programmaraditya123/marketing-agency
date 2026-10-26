import copy
from dataclasses import replace
import json

import httpx
import pytest
from fastapi.testclient import TestClient

from main import app

TOKEN = "test-token-" + "a" * 32
URL = "https://example.com/"
PAYLOAD = {"startUrl": URL, "pages": [{"url": URL, "title": "Acme", "description": "", "headings": [], "mainText": "Acme makes tools.", "structuredData": [], "scrapedAt": "2026-10-21T00:00:00Z"}], "socialLinks": [], "warnings": []}
UNKNOWN = {"value": "Unknown", "basis": "unknown", "confidence": "low", "evidenceUrls": []}
OBSERVED = {"value": "Acme", "basis": "observed", "confidence": "high", "evidenceUrls": [URL]}
RESULT = {"company": {"name": OBSERVED, **{key: UNKNOWN for key in ["summary", "industry", "businessModel", "locations"]}}, "products": [], "targetAudience": [], "positioning": {"valueProposition": UNKNOWN, "differentiators": [], "brandVoice": UNKNOWN}, "contentThemes": [], "marketingOpportunities": [], "missingInformation": ["Who buys the tools?"], "limitations": ["One page crawled"]}


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-provider-key")
    monkeypatch.setenv("MICROSERVICE_TOKEN", TOKEN)
    with TestClient(app) as test_client:
        yield test_client


def provider(result, status=200):
    async def handler(request):
        body = json.loads(request.content)
        assert "systemInstruction" in body
        config = body["generationConfig"]
        assert "schema" in config.get("responseFormat", {}).get("text", {}) or "responseJsonSchema" in config
        assert "thinkingConfig" in config
        return httpx.Response(status, json={"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(result)}]}}]})
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def test_service_auth_and_input_validation(client):
    assert client.post("/api/v1/analyses", json=PAYLOAD).status_code == 401
    assert client.post("/api/v1/analyses", headers={"X-Service-Token": TOKEN}, json={}).status_code == 422
    assert client.get("/health").status_code == 200


def test_structured_success(client):
    app.state.http_client = provider(RESULT)
    response = client.post("/api/v1/analyses", headers={"X-Service-Token": TOKEN}, json=PAYLOAD)
    assert response.status_code == 200
    assert response.json()["company"]["name"]["value"] == "Acme"


@pytest.mark.parametrize("result", [{}, {**RESULT, "products": "not a list"}])
def test_rejects_invalid_model_json(client, result):
    app.state.http_client = provider(result)
    response = client.post("/api/v1/analyses", headers={"X-Service-Token": TOKEN}, json=PAYLOAD)
    assert response.status_code == 502
    assert "test-provider-key" not in response.text


def test_rejects_fabricated_sources(client):
    result = copy.deepcopy(RESULT)
    result["company"]["name"]["evidenceUrls"] = ["https://uncrawled.example/"]
    app.state.http_client = provider(result)
    assert client.post("/api/v1/analyses", headers={"X-Service-Token": TOKEN}, json=PAYLOAD).status_code == 502


def test_quota_failure(client):
    app.state.http_client = provider({}, 429)
    assert client.post("/api/v1/analyses", headers={"X-Service-Token": TOKEN}, json=PAYLOAD).status_code == 429


@pytest.mark.parametrize("status,code", [(400, "GEMINI_REQUEST_REJECTED"), (401, "GEMINI_AUTH_FAILED"), (403, "GEMINI_AUTH_FAILED"), (404, "GEMINI_MODEL_UNAVAILABLE"), (503, "GEMINI_UNAVAILABLE")])
def test_provider_errors_are_specific_and_safe(client, status, code):
    app.state.http_client = provider({"secret": "test-provider-key"}, status)
    response = client.post("/api/v1/analyses", headers={"X-Service-Token": TOKEN}, json=PAYLOAD)
    assert response.json()["code"] == code
    assert "test-provider-key" not in response.text


@pytest.mark.parametrize("candidate,code", [([], "GEMINI_BLOCKED"), ([{"finishReason": "MAX_TOKENS"}], "GEMINI_OUTPUT_LIMIT")])
def test_empty_and_truncated_provider_results(client, candidate, code):
    async def handler(_request):
        return httpx.Response(200, json={"candidates": candidate})
    app.state.http_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    response = client.post("/api/v1/analyses", headers={"X-Service-Token": TOKEN}, json=PAYLOAD)
    assert response.status_code == 502
    assert response.json()["code"] == code


def test_timeout_returns_actionable_error(client):
    async def handler(_request):
        raise httpx.ReadTimeout("secret provider details")
    app.state.http_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    response = client.post("/api/v1/analyses", headers={"X-Service-Token": TOKEN}, json=PAYLOAD)
    assert response.status_code == 504
    assert response.json()["code"] == "GEMINI_TIMEOUT"
    assert "secret provider details" not in response.text


@pytest.mark.parametrize("model", ["gemini-2.5-flash", "gemini-3.8-flash"])
def test_model_specific_generation_config(client, model):
    app.state.settings = replace(app.state.settings, gemini_model=model)
    async def handler(request):
        config = json.loads(request.content)["generationConfig"]
        assert config["maxOutputTokens"] == 8192
        if model.startswith("gemini-2"):
            assert config["thinkingConfig"] == {"thinkingBudget": 0}
            assert config["responseMimeType"] == "application/json"
        else:
            assert config["thinkingConfig"] == {"thinkingLevel": "LOW"}
            assert config["responseFormat"]["text"]["mimeType"] == "APPLICATION_JSON"
        return httpx.Response(200, json={"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(RESULT)}]}}]})
    app.state.http_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    assert client.post("/api/v1/analyses", headers={"X-Service-Token": TOKEN}, json=PAYLOAD).status_code == 200
