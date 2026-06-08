import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from ragfather.agent.ingestion_agent import run_agent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agent", tags=["Agent"])

class AgentRequest(BaseModel):
    prompt: str

# In-memory status tracking for the agent
agent_status = {
    "status": "idle",
    "logs": []
}

def log_callback(msg: str):
    """Callback to append logs to the global state for polling."""
    global agent_status
    agent_status["logs"].append(msg)

def run_agent_task(prompt: str):
    global agent_status
    agent_status["status"] = "running"
    agent_status["logs"] = []
    
    try:
        run_agent(prompt, log_callback=log_callback)
        agent_status["status"] = "completed"
        log_callback("Agent task fully completed. Review documents and manually start pipeline.")
    except Exception as e:
        logger.error(f"Agent failed: {e}")
        agent_status["status"] = "failed"
        log_callback(f"Agent failed with error: {str(e)}")

@router.post("/run")
async def start_agent(req: AgentRequest, background_tasks: BackgroundTasks):
    global agent_status
    if agent_status["status"] == "running":
        raise HTTPException(status_code=400, detail="Agent is already running.")
    
    background_tasks.add_task(run_agent_task, req.prompt)
    return {"message": "Agent started."}

@router.get("/status")
async def get_agent_status():
    global agent_status
    return agent_status

@router.post("/reset")
async def reset_agent():
    global agent_status
    if agent_status["status"] == "running":
        raise HTTPException(status_code=400, detail="Cannot reset while running.")
    agent_status = {
        "status": "idle",
        "logs": []
    }
    return {"message": "Agent reset."}
