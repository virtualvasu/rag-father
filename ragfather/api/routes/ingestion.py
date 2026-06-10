"""
Ingestion and Pipeline routes.
"""

import os
import json
import logging
import asyncio
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from pydantic import BaseModel

from ragfather.ingestion.pipeline import run_ingestion_pipeline
from ragfather.indexing.vector_indexer import index_chunks_to_qdrant
from ragfather.indexing.bm25_indexer import build_bm25_index
from ragfather.indexing.graph_indexer import build_knowledge_graph

from typing import Optional
logger = logging.getLogger(__name__)
router = APIRouter()

class PipelineConfig(BaseModel):
    skip_enrichment: bool = False
    use_knowledge_graph: bool = True
    use_cross_encoder_reranker: bool = True
    graph_search_hops: int = 1
    wipe_data_on_pipeline_run: bool = True
    enrichment_provider: str = "ollama"
    generation_provider: str = "ollama"
    embedding_provider: str = "local"
    anthropic_api_key: Optional[str] = ""
    openai_api_key: Optional[str] = ""
    custom_llm_base_url: Optional[str] = ""
    custom_llm_api_key: Optional[str] = ""
    custom_llm_model: Optional[str] = ""
    ollama_model: str = "qwen2.5:7b"
    child_chunk_size: int = 256
    parent_chunk_size: int = 1024
    child_chunk_overlap: int = 20
    top_k_retrieval: int = 20
    top_k_rerank: int = 5
    max_agent_iterations: int = 3

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

async def run_full_pipeline(config: PipelineConfig):
    """Background task to run the ingestion and indexing pipeline."""
    from ragfather.config import settings
    
    # Override global settings for this run and subsequent queries
    settings.use_knowledge_graph = config.use_knowledge_graph
    settings.use_cross_encoder_reranker = config.use_cross_encoder_reranker
    settings.graph_search_hops = config.graph_search_hops
    settings.wipe_data_on_pipeline_run = config.wipe_data_on_pipeline_run
    
    settings.enrichment_provider = config.enrichment_provider
    settings.generation_provider = config.generation_provider
    settings.embedding_provider = config.embedding_provider
    if config.anthropic_api_key:
        settings.anthropic_api_key = config.anthropic_api_key
    if config.openai_api_key:
        settings.openai_api_key = config.openai_api_key
    if config.custom_llm_base_url:
        settings.custom_llm_base_url = config.custom_llm_base_url
    if config.custom_llm_api_key:
        settings.custom_llm_api_key = config.custom_llm_api_key
    if config.custom_llm_model:
        settings.custom_llm_model = config.custom_llm_model
    if config.ollama_model:
        settings.ollama_model = config.ollama_model
    settings.child_chunk_size = config.child_chunk_size
    settings.parent_chunk_size = config.parent_chunk_size
    settings.child_chunk_overlap = config.child_chunk_overlap
    settings.top_k_retrieval = config.top_k_retrieval
    settings.top_k_rerank = config.top_k_rerank
    settings.max_agent_iterations = config.max_agent_iterations

    global pipeline_job
    pipeline_job["status"] = "running"
    pipeline_job["message"] = "Starting ingestion pipeline..."
    
    def update_status(msg: str):
        pipeline_job["message"] = msg
        
    try:
        # 1. Ingestion & Chunking & Enrichment & Indexing
        result = await run_ingestion_pipeline(
            source_dir="data/raw/",
            output_dir="data/processed/",
            skip_enrichment=config.skip_enrichment,
            status_callback=update_status,
        )
        
        # Save training metadata for evaluation tracking
        try:
            raw_dir = Path("data/raw")
            files_used = [f.name for f in raw_dir.glob("*")] if raw_dir.exists() else []
            metadata_path = Path("data/processed/training_metadata.json")
            with open(metadata_path, "w", encoding="utf-8") as f:
                json.dump({
                    "pipeline_params": config.dict(),
                    "files_used": files_used
                }, f, indent=2)
        except Exception as meta_err:
            logger.warning(f"Failed to save training metadata: {meta_err}")

        pipeline_job["status"] = "completed"
        pipeline_job["message"] = "Pipeline completed successfully."
        pipeline_job["result"] = {
            "ingestion": result,
            "indexing": {
                "qdrant_points": result.get("points_indexed", 0),
                "bm25_chunks": result.get("chunks_created", 0),
                "neo4j_nodes": result.get("nodes_created", 0),
                "neo4j_edges": result.get("edges_created", 0)
            }
        }
    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        pipeline_job["status"] = "failed"
        pipeline_job["message"] = str(e)


@router.post("/pipeline/run")
async def start_pipeline(config: PipelineConfig, background_tasks: BackgroundTasks):
    """Trigger the document ingestion and indexing pipeline to run in the background."""
    global pipeline_job
    if pipeline_job["status"] == "running":
        raise HTTPException(status_code=400, detail="Pipeline is already running.")
        
    raw_dir = Path("data/raw")
    has_pdf = next(raw_dir.glob("**/*.pdf"), None) is not None if raw_dir.exists() else False
    has_html = next(raw_dir.glob("**/*.html"), None) is not None if raw_dir.exists() else False
    
    if not (has_pdf or has_html):
        raise HTTPException(status_code=400, detail="No documents found. Please upload PDF files before starting the pipeline.")
        
    background_tasks.add_task(run_full_pipeline, config)
    return {"message": "Pipeline execution started in the background."}

@router.get("/pipeline/status")
async def get_pipeline_status():
    """Check the status of the currently running or last completed pipeline job."""
    global pipeline_job
    return pipeline_job

@router.delete("/pipeline/reset")
async def reset_pipeline_data():
    """Wipe all raw and processed data to start fresh."""
    raw_dir = Path("data/raw")
    processed_dir = Path("data/processed")
    
    try:
        if raw_dir.exists():
            shutil.rmtree(raw_dir)
        if processed_dir.exists():
            shutil.rmtree(processed_dir)
            
        # Recreate empty directories immediately so subsequent uploads don't fail
        raw_dir.mkdir(parents=True, exist_ok=True)
        processed_dir.mkdir(parents=True, exist_ok=True)
        (processed_dir / "chunks").mkdir(parents=True, exist_ok=True)
        
        return {"message": "System reset successful. All data files wiped."}
    except Exception as e:
        logger.error(f"Failed to reset data directories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reset system: {str(e)}")

from fastapi.responses import FileResponse

@router.get("/documents")
async def list_documents():
    """List all currently uploaded documents with metadata."""
    raw_dir = Path("data/raw")
    files = []
    if raw_dir.exists():
        for f in raw_dir.glob("*"):
            if f.is_file():
                stat = f.stat()
                files.append({
                    "name": f.name,
                    "size_kb": round(stat.st_size / 1024, 1),
                    "modified": stat.st_mtime
                })
    return {"files": sorted(files, key=lambda x: x["name"])}

@router.get("/documents/{filename}")
async def get_document(filename: str):
    """Serve a document for previewing."""
    file_path = Path("data/raw") / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@router.delete("/documents/{filename}")
async def delete_document(filename: str):
    """Delete a specific document from the raw directory."""
    file_path = Path("data/raw") / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    try:
        file_path.unlink()
        return {"message": f"Successfully deleted {filename}"}
    except Exception as e:
        logger.error(f"Failed to delete {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete {filename}")
