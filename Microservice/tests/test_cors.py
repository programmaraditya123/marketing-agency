from fastapi import FastAPI
from fastapi.testclient import TestClient

from config.cors import register_cors

ORIGIN = "https://orbit.vidorahub.com"


def test_orbit_preflight_and_error_headers_preserve_service_auth(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-provider-key")
    monkeypatch.setenv("MICROSERVICE_TOKEN", "test-service-" + "a" * 32)
    from main import app
    with TestClient(app) as client:
        response = client.options("/api/v1/analyses", headers={
            "Origin": ORIGIN, "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization,x-orbit-request",
        })
        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == ORIGIN
        assert response.headers["access-control-allow-credentials"] == "true"
        response = client.post("/api/v1/analyses", headers={"Origin": ORIGIN}, json={})
        assert response.status_code == 401
        assert response.headers["access-control-allow-origin"] == ORIGIN
        response = client.options("/api/v1/analyses", headers={
            "Origin": ORIGIN + ".attacker.test", "Access-Control-Request-Method": "POST",
        })
        assert response.status_code == 400
        assert "access-control-allow-origin" not in response.headers


def test_environment_cannot_replace_hardcoded_origins(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://untrusted.example")
    app = FastAPI()
    register_cors(app)
    with TestClient(app) as client:
        response = client.get("/missing", headers={"Origin": ORIGIN})
        assert response.headers["access-control-allow-origin"] == ORIGIN
        response = client.get("/missing", headers={"Origin": "https://untrusted.example"})
        assert "access-control-allow-origin" not in response.headers


def test_environment_cannot_disable_hardcoded_cors(monkeypatch):
    monkeypatch.setenv("CORS_MANAGED_BY_CATALYST", "true")
    app = FastAPI()
    register_cors(app)
    with TestClient(app) as client:
        response = client.get("/missing", headers={"Origin": ORIGIN})
        assert response.headers["access-control-allow-origin"] == ORIGIN
        assert response.headers["access-control-allow-credentials"] == "true"
