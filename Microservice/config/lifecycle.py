from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI

from config.settings import load_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.settings = load_settings()
    async with httpx.AsyncClient(timeout=httpx.Timeout(90, connect=10)) as client:
        app.state.http_client = client
        yield
