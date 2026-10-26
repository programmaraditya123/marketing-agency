import json
import httpx
import pytest
from fastapi.testclient import TestClient
from main import app
from schemas.marketing import MarketingBudget
from pydantic import ValidationError
UNKNOWN = {"value": "Unknown", "basis": "unknown", "confidence": "low", "evidenceUrls": []}
REPORT = {"company": {key: UNKNOWN for key in ["name", "summary", "industry", "businessModel", "locations"]}, "products": [], "targetAudience": [], "positioning": {"valueProposition": UNKNOWN, "differentiators": [], "brandVoice": UNKNOWN}, "contentThemes": [], "marketingOpportunities": [], "missingInformation": [], "limitations": []}

TOKEN = "marketing-test-token-" + "x" * 32


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("MICROSERVICE_TOKEN", TOKEN)
    with TestClient(app) as client:
        yield client


def install_provider(client, channels):
    async def provider(request):
        body = json.loads(request.content)
        context = json.loads(body["contents"][0]["parts"][0]["text"])
        assert context["business"] == REPORT
        assert context["budget"]["currency"] == "INR"
        assert "dailyBudget * 30" in body["systemInstruction"]["parts"][0]["text"]
        assert "tools" not in body
        output = {"summary": "Focus on measurable product discovery.", "channels": channels,
                  "assumptions": ["No Google Trends evidence is available. Costs require validation."]}
        return httpx.Response(200, json={"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(output)}]}}]})
    original = app.state.http_client
    app.state.http_client = httpx.AsyncClient(transport=httpx.MockTransport(provider))
    return original


def channel(name="Search ads", weight=60, approach="paid"):
    return {"name": name, "approach": approach, "allocationPercent": weight, "why": "Reach people evaluating this product category.",
            "when": "Week 2, after conversion tracking is tested.", "firstSteps": ["Build one product landing page."],
            "successMetric": "Qualified lead conversion rate", "scaleOrStop": "Review after 14 days; stop if no qualified leads."}


@pytest.mark.parametrize("daily,monthly,cap,daily_cap", [(100, 1000, 1000, 33.33), (1, 1000, 30, 1), (0.29, 10, 8.7, 0.29)])
def test_allocations_respect_both_limits_and_keep_reserve(client, daily, monthly, cap, daily_cap):
    original = install_provider(client, [channel(), channel("Email", 30, "owned")])
    try:
        response = client.post("/api/v1/marketing/channels", headers={"X-Service-Token": TOKEN}, json={"website": "https://example.com", "business": REPORT, "budget": {"currency": "INR", "dailyBudget": daily, "monthlyBudget": monthly}})
        assert response.status_code == 200, response.text
        result = response.json()
        assert result["effectiveMonthlyBudget"] == cap
        assert result["effectiveDailyBudget"] == daily_cap
        assert sum(item["dailyAllocation"] for item in result["channels"]) <= daily
        assert sum(item["monthlyAllocation"] for item in result["channels"]) <= monthly
        assert result["unallocatedMonthly"] > 0
        assert result["channels"][0]["when"].startswith("Week 2")
    finally:
        client.portal.call(app.state.http_client.aclose)
        app.state.http_client = original


@pytest.mark.parametrize("daily,monthly,channels,status", [(0, 100, [channel("Community", 0, "organic")], 200), (100, 0, [channel("Email", 0, "owned")], 200), (0, 0, [channel()], 502), (100, 1000, [channel(weight=80), channel("Social ads", 50)], 502), (100, 1000, [channel(), channel("Search ads", 30)], 502)])
def test_zero_budget_and_invalid_model_splits(client, daily, monthly, channels, status):
    original = install_provider(client, channels)
    try:
        response = client.post("/api/v1/marketing/channels", headers={"X-Service-Token": TOKEN}, json={"website": "https://example.com", "business": REPORT, "budget": {"currency": "INR", "dailyBudget": daily, "monthlyBudget": monthly}})
        assert response.status_code == status, response.text
        if status == 200:
            assert response.json()["effectiveMonthlyBudget"] == 0
            assert response.json()["channels"][0]["monthlyAllocation"] == 0
    finally:
        client.portal.call(app.state.http_client.aclose)
        app.state.http_client = original


def test_private_endpoint_and_input_validation(client):
    assert client.post("/api/v1/marketing/channels", json={}).status_code == 401
    assert client.post("/api/v1/marketing/channels", headers={"X-Service-Token": TOKEN}, json={}).status_code == 422
    for override in [{"dailyBudget": -1}, {"monthlyBudget": 0.001}, {"currency": "INVALID"}, {"dailyBudget": "NaN"}]:
        with pytest.raises(ValidationError):
            MarketingBudget(**({"currency": "INR", "dailyBudget": 100, "monthlyBudget": 1000} | override))
