
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Market Agency Microservice",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.vidorahub.com",
        "https://vidorahub.com",
        "https://studio.vidorahub.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Content-Type",
        "Authorization",
    ],
)


@app.get("/")
async def home():
    return {
        "service": "market-agency-microservice is runing good and best and not changed this ",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy means wealthy"}
