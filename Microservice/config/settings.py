import os
import re
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str
    gemini_model: str
    service_token: str


def load_settings() -> Settings:
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    token = os.environ.get("MICROSERVICE_TOKEN", "").strip()
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()
    if not key or len(token) < 32:
        raise RuntimeError("Set GEMINI_API_KEY and a MICROSERVICE_TOKEN of at least 32 characters")
    if not re.fullmatch(r"gemini-[a-zA-Z0-9.\-]+", model):
        raise RuntimeError("Invalid GEMINI_MODEL")
    return Settings(key, model, token)
