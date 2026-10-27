from fastapi import FastAPI

from config.lifecycle import lifespan
from config.cors import register_cors
from routes.analyses import router as analyses_router
from routes.health import router as health_router
from routes.competitors import router as competitors_router
from routes.market import router as market_router
from routes.marketing import router as marketing_router
from routes.content import router as content_router
from utils.exceptions import register_exception_handlers

app = FastAPI(title="Marketing Agency Analysis", version="1.0.0", lifespan=lifespan)
register_cors(app)
register_exception_handlers(app)
app.include_router(health_router)
app.include_router(analyses_router, prefix="/api/v1/analyses", tags=["Analysis"])
app.include_router(competitors_router, prefix="/api/v1/competitors", tags=["Competitors"])
app.include_router(market_router, prefix="/api/v1/market", tags=["Market research"])
app.include_router(marketing_router, prefix="/api/v1/marketing", tags=["Marketing plan"])
app.include_router(content_router, prefix="/api/v1/content", tags=["Content strategy"])
