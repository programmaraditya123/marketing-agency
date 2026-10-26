import json
import httpx
import pytest
from fastapi.testclient import TestClient
from main import app

TOKEN = "competitor-test-token-" + "a" * 32
UNKNOWN = {"value": "Unknown", "basis": "unknown", "confidence": "low", "evidenceUrls": []}
REPORT = {"company": {key: UNKNOWN for key in ["name", "summary", "industry", "businessModel", "locations"]}, "products": [], "targetAudience": [], "positioning": {"valueProposition": UNKNOWN, "differentiators": [], "brandVoice": UNKNOWN}, "contentThemes": [], "marketingOpportunities": [], "missingInformation": [], "limitations": []}
PAYLOAD = {"startUrl": "https://example.com", "analysis": REPORT}

@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-provider-key")
    monkeypatch.setenv("MICROSERVICE_TOKEN", TOKEN)
    with TestClient(app) as client:
        yield client

def provider(competitors):
    async def handle(request):
        body = json.loads(request.content)
        assert "untrusted" in body["systemInstruction"]["parts"][0]["text"]
        assert "analysis" in json.loads(body["contents"][0]["parts"][0]["text"])
        assert "tools" not in body
        assert "top ten" in body["systemInstruction"]["parts"][0]["text"]
        return httpx.Response(200, json={"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps({"competitors": competitors})}]}}]})
    return httpx.AsyncClient(transport=httpx.MockTransport(handle))

def test_keyword_endpoint_is_private_and_validates_business_context(client):
    assert client.post("/api/v1/competitors/suggestions", json=PAYLOAD).status_code == 401
    assert client.post("/api/v1/competitors/suggestions", headers={"X-Service-Token": TOKEN}, json={}).status_code == 422

def test_generates_ten_competitors_directly(client):
    companies = [{"name": f"Company {i}", "website": f"https://company{i}.com", "description": "Relevant tools for teams."} for i in range(10)]
    app.state.http_client = provider(companies)
    result = client.post("/api/v1/competitors/suggestions", headers={"X-Service-Token": TOKEN}, json=PAYLOAD)
    assert result.status_code == 200
    assert len(result.json()["competitors"]) == 10
    assert result.json()["competitors"][0]["name"] == "Company 0"
    assert set(result.json()) == {"competitors"}

@pytest.mark.parametrize("companies", [[], [{"name": "Missing data"}], [{"name": "Wrong URL", "website": "javascript:alert(1)", "description": "A description for testing"}], [{"name": "Credentials", "website": "https://user:pass@example.com", "description": "A description for testing"}]])
def test_rejects_invalid_competitor_output(client, companies):
    app.state.http_client = provider(companies)
    result = client.post("/api/v1/competitors/suggestions", headers={"X-Service-Token": TOKEN}, json=PAYLOAD)
    assert result.status_code == 502
    assert "test-provider-key" not in result.text
