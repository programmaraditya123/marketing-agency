from fastapi import FastAPI

from config.lifecycle import lifespan
from routes.analyses import router as analyses_router
from routes.health import router as health_router
from utils.exceptions import register_exception_handlers

app = FastAPI(title="Marketing Agency Analysis", version="1.0.0", lifespan=lifespan)
register_exception_handlers(app)
app.include_router(health_router)
app.include_router(analyses_router, prefix="/api/v1/analyses", tags=["Analysis"])
