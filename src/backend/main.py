from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from api.routes import sites_router, scans_router, pages_router, websocket_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing needed — Prisma manages migrations
    yield
    # Shutdown


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

API_PREFIX = "/api/v1"
app.include_router(sites_router, prefix=API_PREFIX)
app.include_router(scans_router, prefix=API_PREFIX)
app.include_router(pages_router, prefix=API_PREFIX)
# WebSocket has its own path — no /api/v1 prefix
app.include_router(websocket_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
