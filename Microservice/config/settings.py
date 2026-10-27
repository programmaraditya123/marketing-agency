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
    krutrim_api_key: str = ""
    krutrim_model: str = "gpt-oss-120b"
    krutrim_base_url: str = "https://cloud.olakrutrim.com/v1"


def load_settings() -> Settings:
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    krutrim_key = os.environ.get("KRUTRIM_API_KEY", "").strip()
    token = os.environ.get("MICROSERVICE_TOKEN", "").strip()
    gemini_model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()
    krutrim_model = os.environ.get("KRUTRIM_MODEL", "gpt-oss-120b").strip()
    krutrim_base = os.environ.get("KRUTRIM_BASE_URL", "https://cloud.olakrutrim.com/v1").strip().rstrip("/")

    if (not gemini_key and not krutrim_key) or len(token) < 32:
        raise RuntimeError("Set KRUTRIM_API_KEY or GEMINI_API_KEY and a MICROSERVICE_TOKEN of at least 32 characters")
    if gemini_key and not re.fullmatch(r"gemini-[a-zA-Z0-9.\-]+", gemini_model):
        raise RuntimeError("Invalid GEMINI_MODEL")

    return Settings(
        gemini_api_key=gemini_key,
        gemini_model=gemini_model,
        service_token=token,
        krutrim_api_key=krutrim_key,
        krutrim_model=krutrim_model,
        krutrim_base_url=krutrim_base,
    )
