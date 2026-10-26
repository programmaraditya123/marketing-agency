import secrets

from fastapi import Header, HTTPException, Request


def require_service_token(request: Request, x_service_token: str = Header(default="")) -> None:
    if not secrets.compare_digest(x_service_token, request.app.state.settings.service_token):
        raise HTTPException(status_code=401, detail="Invalid service credentials")
