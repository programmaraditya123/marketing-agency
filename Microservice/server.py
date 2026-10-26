"""Portable local/AppSail startup with platform-assigned port precedence."""
import os

from dotenv import load_dotenv
from pathlib import Path


def listen_port() -> int:
    value = os.environ.get("X_ZOHO_CATALYST_LISTEN_PORT") or os.environ.get("PORT") or "8000"
    try:
        port = int(value)
    except ValueError as error:
        raise RuntimeError("Listening port must be an integer between 1 and 65535") from error
    if not 1 <= port <= 65535:
        raise RuntimeError("Listening port must be an integer between 1 and 65535")
    return port


if __name__ == "__main__":
    import uvicorn

    load_dotenv(Path(__file__).resolve().parent / ".env")
    uvicorn.run("main:app", host="0.0.0.0", port=listen_port())
