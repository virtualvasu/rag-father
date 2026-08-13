import os
import json
import logging
import asyncio
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from ragfather.evaluation.benchmark import run_benchmark, VARIANTS, RESULT_DIR
from ragfather.evaluation.synthetic_generator import generate_synthetic_dataset

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/evaluation", tags=["Evaluation"])

class EvaluationConfig(BaseModel):
    variants: list[str] = ["naive_rag", "advanced_rag", "ragfather_full"]
    question_ids: list[str] | None = None
    skip_ragas: bool = False

class GenerationConfig(BaseModel):
    num_questions: int = 5

eval_job = {
    "status": "idle",
    "message": "",
    "result": None
}

def run_eval_task(config: EvaluationConfig):
    global eval_job
    eval_job["status"] = "running"
    eval_job["message"] = "Starting evaluation..."
    
    try:
        results = run_benchmark(
            variants_to_run=config.variants,
            question_ids=config.question_ids,
            skip_ragas=config.skip_ragas,
        )
        eval_job["status"] = "completed"
        eval_job["message"] = "Evaluation finished."
        eval_job["result"] = results
    except Exception as e:
        logger.error(f"Evaluation failed: {e}")
        eval_job["status"] = "failed"
        eval_job["message"] = f"Evaluation failed: {str(e)}"


@router.get("/variants")
async def get_variants():
    """Returns available benchmark variants."""
    return {"variants": list(VARIANTS.keys())}

@router.post("/run")
async def run_evaluation(config: EvaluationConfig, background_tasks: BackgroundTasks):
    global eval_job
    if eval_job["status"] == "running":
        raise HTTPException(status_code=400, detail="Evaluation is already running.")
        
    # If the user passed empty list for question_ids, treat as None (all questions)
    if config.question_ids and len(config.question_ids) == 0:
        config.question_ids = None

    background_tasks.add_task(run_eval_task, config)
    return {"message": "Evaluation started."}

@router.post("/generate")
async def generate_dataset(config: GenerationConfig):
    """Generates synthetic questions and ground truth answers using the local LLM."""
    try:
        result = generate_synthetic_dataset(num_questions=config.num_questions)
        return result
    except Exception as e:
        logger.error(f"Failed to generate dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_eval_status():
    global eval_job
    return eval_job

@router.get("/results")
async def get_results():
    """Lists past evaluation results."""
    results_list = []
    if RESULT_DIR.exists():
        for file in RESULT_DIR.glob("*.json"):
            try:
                data = json.loads(file.read_text())
                results_list.append({
                    "filename": file.name,
                    "timestamp": data.get("timestamp"),
                    "num_questions": data.get("num_questions"),
                    "variants": data.get("variants", {}),
                    "pipeline_params": data.get("pipeline_params", {}),
                    "files_used": data.get("files_used", []),
                    "eval_params": data.get("eval_params", {})
                })
            except Exception as e:
                logger.error(f"Failed to load {file.name}: {e}")
                
    # sort by timestamp descending
    results_list.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return {"results": results_list}
