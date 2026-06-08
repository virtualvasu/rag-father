"""
FastAPI application factory.
Run with: uvicorn ragfather.api.main:app --reload --port 8000
Docs at:  http://localhost:8000/docs
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
)

from ragfather.utils.sse_logger import SSELogHandler
sse_handler = SSELogHandler()
sse_handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(name)s - %(message)s"))
logging.getLogger().addHandler(sse_handler)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Ragfather API",
        description=(
            "General-purpose Retrieval-Augmented Generation builder API."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Allow Next.js dev server (3000) and any other origin
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from ragfather.api.routes.query import router as query_router
    from ragfather.api.routes.ingestion import router as ingestion_router
    from ragfather.api.routes.evaluation import router as evaluation_router
    from ragfather.api.routes.agent import router as agent_router
    from ragfather.api.routes.system import router as system_router
    
    app.include_router(query_router, prefix="/api", tags=["Query"])
    app.include_router(ingestion_router, prefix="/api", tags=["Ingestion"])
    app.include_router(evaluation_router, prefix="/api")
    app.include_router(agent_router, prefix="/api")
    app.include_router(system_router, prefix="/api")

    @app.get("/", include_in_schema=False)
    async def root():
        return {"message": "Ragfather API", "docs": "/docs", "health": "/health"}

    return app


app = create_app()
