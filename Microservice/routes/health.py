from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def home() -> dict[str, str]:
    return {"service": "Marketing agency analysis microservice", "status": "running", "version": "1.0.0"}


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}
