"""
Ingestion and Pipeline routes.
"""

import os
import json
import logging
import asyncio
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from pydantic import BaseModel

from clause.ingestion.pipeline import run_ingestion_pipeline
from clause.indexing.vector_indexer import index_chunks_to_qdrant
from clause.indexing.bm25_indexer import build_bm25_index
from clause.indexing.graph_indexer import build_knowledge_graph

logger = logging.getLogger(__name__)
router = APIRouter()

# Global state for simple job tracking (in a real app, use redis/db)
pipeline_job = {
    "status": "idle", # idle, running, completed, failed
    "message": "",
    "result": None
}

@router.post("/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    """Upload one or more PDF files to the raw data directory."""
    raw_dir = Path("data/raw")
    raw_dir.mkdir(parents=True, exist_ok=True)
    saved_files = []
    
    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            continue # simple validation
            
        file_path = raw_dir / file.filename
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        saved_files.append(file.filename)
        
    return {"message": f"Successfully uploaded {len(saved_files)} files.", "files": saved_files}

async def run_full_pipeline(skip_enrichment: bool = False):
    """Background task to run the ingestion and indexing pipeline."""
    global pipeline_job
    pipeline_job["status"] = "running"
    pipeline_job["message"] = "Starting ingestion pipeline..."
    
    try:
        # 1. Ingestion & Chunking & Enrichment
        result = await run_ingestion_pipeline(
            source_dir="data/raw/",
            output_dir="data/processed/",
            skip_enrichment=skip_enrichment,
        )
        pipeline_job["message"] = "Ingestion complete. Starting indexing..."
        
        # 2. Indexing
        chunks_file = "data/processed/chunks/raw_chunks.json" if skip_enrichment else "data/processed/chunks/enriched_chunks.json"
        
        with open(chunks_file) as f:
            chunks = json.load(f)
            
        points = index_chunks_to_qdrant(chunks, recreate=True)
        
        bm25_path = "data/processed/bm25_index.pkl"
        # Ensure processed directory exists for bm25
        Path(bm25_path).parent.mkdir(parents=True, exist_ok=True)
        _, indexed = build_bm25_index(chunks, index_path=bm25_path)
        
        nodes, edges = build_knowledge_graph(chunks, clear_existing=True)
        
        pipeline_job["status"] = "completed"
        pipeline_job["message"] = "Pipeline completed successfully."
        pipeline_job["result"] = {
            "ingestion": result,
            "indexing": {
                "qdrant_points": points,
                "bm25_chunks": len(indexed),
                "neo4j_nodes": nodes,
                "neo4j_edges": edges
            }
        }
    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        pipeline_job["status"] = "failed"
        pipeline_job["message"] = str(e)


@router.post("/pipeline/run")
async def start_pipeline(background_tasks: BackgroundTasks, skip_enrichment: bool = False):
    """Trigger the document ingestion and indexing pipeline to run in the background."""
    global pipeline_job
    if pipeline_job["status"] == "running":
        raise HTTPException(status_code=400, detail="Pipeline is already running.")
        
    background_tasks.add_task(run_full_pipeline, skip_enrichment)
    return {"message": "Pipeline execution started in the background."}

@router.get("/pipeline/status")
async def get_pipeline_status():
    """Check the status of the currently running or last completed pipeline job."""
    global pipeline_job
    return pipeline_job
