import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def register_cors(app: FastAPI) -> None:
    if os.environ.get("CORS_MANAGED_BY_CATALYST") == "true":
        return
    origins = [origin.strip().rstrip("/") for origin in os.environ.get(
        "CORS_ORIGINS", "http://localhost:3000,https://orbit.vidorahub.com"
    ).split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Orbit-Request"],
    )
