import pandas as pd
import pytest
from pydantic import ValidationError
from schemas.market import TrendInput
from service.market import collect_trends
from utils.exceptions import AnalysisError


class FakeTrends:
    def __init__(self, **kwargs):
        assert kwargs["timeout"] == (5, 15)
        assert kwargs["retries"] == 0

    def build_payload(self, terms, **kwargs):
        self.terms = terms

    def interest_over_time(self):
        return pd.DataFrame({"tea": [10, 25, 100], "isPartial": [False, False, True]}, index=pd.date_range("2026-01-01", periods=3))

    def interest_by_region(self, **kwargs):
        return pd.DataFrame({"tea": [50, 80]}, index=["India", "United States"])

    def related_queries(self):
        return {"tea": {"top": pd.DataFrame({"query": ["green tea", "tea bags"]})}}


def test_collects_real_shaped_evidence_excluding_partial_periods():
    result = collect_trends(TrendInput(terms=[" tea ", "tea"]), FakeTrends)
    assert result.config.terms == ["tea"]
    assert [point.values["tea"] for point in result.timeline] == [10, 25]
    assert result.regions[0]["region"] == "United States"
    assert result.related["tea"] == ["green tea", "tea bags"]
    assert "not absolute" in result.warnings[0]
    assert result.metrics[0].changePercent == 150
    assert result.metrics[0].earlierMean == 10
    assert result.metrics[0].recentMean == 25


def test_optional_data_failures_preserve_timeline():
    class Partial(FakeTrends):
        def interest_by_region(self, **kwargs):
            raise RuntimeError("private provider error")

        def related_queries(self):
            raise RuntimeError("private provider error")
    result = collect_trends(TrendInput(terms=["tea"]), Partial)
    assert len(result.timeline) == 2
    assert len(result.warnings) == 4
    assert result.regions == []


def test_empty_and_provider_errors_are_explicit():
    class Empty(FakeTrends):
        def interest_over_time(self):
            return pd.DataFrame()
    with pytest.raises(AnalysisError, match="No Google Trends data"):
        collect_trends(TrendInput(terms=["tea"]), Empty)
    def broken(**kwargs):
        raise RuntimeError("secret provider detail")
    with pytest.raises(AnalysisError, match="unavailable or rate limited"):
        collect_trends(TrendInput(terms=["tea"]), broken)
    assert collect_trends(TrendInput(terms=["tea"]), FakeTrends).timeline


@pytest.mark.parametrize("input", [{"terms": []}, {"terms": [" "]}, {"terms": ["a"] * 6}, {"terms": ["tea"], "geo": "India"}, {"terms": ["tea"], "timeframe": "now"}])
def test_input_is_bounded(input):
    with pytest.raises(ValidationError):
        TrendInput(**input)


def test_private_routes_and_gemini_receive_collected_evidence(monkeypatch):
    import json
    import httpx
    from fastapi.testclient import TestClient
    from main import app
    from schemas.market import DemandAnalysis
    token = "market-test-token-" + "a" * 32
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("MICROSERVICE_TOKEN", token)
    data = collect_trends(TrendInput(terms=["tea"]), FakeTrends)
    monkeypatch.setattr("routes.market.collect_trends", lambda config: data)
    expected = DemandAnalysis(summary="Relative interest increased in this sample.", momentum="10 to 25.", seasonality="Too few periods.", regionalInterest="Relative regional scores only.", opportunities=["Test interest with a small landing page."], nextSteps=["Measure qualified conversions."], limitations=["Interest is not sales demand."])
    async def provider(request):
        body = json.loads(request.content)
        evidence = json.loads(body["contents"][0]["parts"][0]["text"])
        assert evidence["data"] == data.model_dump(mode="json")
        assert "not prove purchasing demand" in body["systemInstruction"]["parts"][0]["text"]
        return httpx.Response(200, json={"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": expected.model_dump_json()}]}}]})
    with TestClient(app) as client:
        assert client.post("/api/v1/market/collect", json={"terms": ["tea"]}).status_code == 401
        headers = {"X-Service-Token": token}
        assert client.post("/api/v1/market/collect", headers=headers, json={"terms": []}).status_code == 422
        response = client.post("/api/v1/market/collect", headers=headers, json={"terms": ["tea"]})
        assert response.json() == data.model_dump(mode="json")
        original = app.state.http_client
        app.state.http_client = httpx.AsyncClient(transport=httpx.MockTransport(provider))
        response = client.post("/api/v1/market/interpret", headers=headers, json={"website": "https://example.com", "data": response.json()})
        assert response.status_code == 200
        assert response.json() == expected.model_dump()
        client.portal.call(app.state.http_client.aclose)
        app.state.http_client = original
