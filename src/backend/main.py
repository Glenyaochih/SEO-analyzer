import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from config import get_settings
from api.routes import sites_router, scans_router, pages_router, websocket_router
from utils.database import engine

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify DB is reachable at startup — fail fast with a clear message
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection OK")
    except Exception as exc:
        logger.error("Cannot connect to database: %s", exc)
        sys.exit(1)
    yield
    await engine.dispose()


app = FastAPI(
    title="SEO Analyzer API",
    version="0.1.0",
    description="Full-site SEO monitoring SaaS backend",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {exc}"},
    )

API_PREFIX = "/api/v1"
app.include_router(sites_router, prefix=API_PREFIX)
app.include_router(scans_router, prefix=API_PREFIX)
app.include_router(pages_router, prefix=API_PREFIX)
# WebSocket has its own path — no /api/v1 prefix
app.include_router(websocket_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
