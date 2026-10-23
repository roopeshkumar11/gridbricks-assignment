import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.api.routes import router as api_router
from backend.app.config import PORT, HOST
from backend.app.services.storage import StorageRepository

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("bmrs_app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    storage = StorageRepository()
    counts = storage.get_counts()
    logger.info(
        f"Server started. Storage has {counts['actualsCount']} actuals and {counts['forecastsCount']} forecasts."
    )
    yield

app = FastAPI(
    title="UK Day-Ahead Renewable Wind Forecasting & Decision Support API",
    description="Analytics & decision engine for UK energy utilities buying from the Day-Ahead wholesale power market using Elexon BMRS FUELHH & WINDFOR data.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for development and deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST routes
app.include_router(api_router)

# Check if frontend static build exists (for production single-container deployment)
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    logger.info(f"Serving frontend static build from {FRONTEND_DIST}")
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api"):
            return None
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, reload=True)
