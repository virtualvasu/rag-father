import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ragfather.generation.generator import _llm_call

router = APIRouter(prefix="/system", tags=["System Prompt"])

class PromptGenerationRequest(BaseModel):
    use_case: str

class PromptGenerationResponse(BaseModel):
    system_prompt: str
    message: str

class SystemPromptUpdate(BaseModel):
    system_prompt: str

PROMPT_TEMPLATE = """You are an expert prompt engineer. Your task is to write a highly effective, robust SYSTEM PROMPT for an AI assistant acting as a Retrieval-Augmented Generation (RAG) system.

The user has provided the following context/use-case for what this RAG system should do:
<use_case>
{use_case}
</use_case>

Create a system prompt that:
1. Defines a clear, professional persona based on the use-case.
2. Instructs the AI to base its answers strictly on the retrieved context provided in the user prompt.
3. Explicitly tells the AI to admit ignorance ("I don't know based on the provided context") if the context lacks the answer.
4. Provides clear instructions on how to structure the output and cite sources, if applicable.
5. Is formatted as direct instructions to the AI (e.g. "You are an expert... Your task is...").

Return ONLY the generated system prompt text. Do not wrap it in markdown blocks, do not include any preamble or explanation. Just the raw prompt text.
"""

def get_prompt_path() -> str:
    return os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "system_prompt.txt")

@router.get("/prompt", response_model=PromptGenerationResponse)
def get_system_prompt_endpoint():
    """Retrieve the currently active system prompt."""
    prompt_path = get_prompt_path()
    if os.path.exists(prompt_path):
        with open(prompt_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            return PromptGenerationResponse(system_prompt=content, message="Successfully retrieved current system prompt.")
    return PromptGenerationResponse(system_prompt="You are a precise AI assistant. Answer using the provided context.", message="Default prompt active (file not found).")

@router.post("/prompt", response_model=PromptGenerationResponse)
def update_system_prompt(request: SystemPromptUpdate):
    """Manually update the system prompt."""
    prompt_path = get_prompt_path()
    try:
        with open(prompt_path, "w", encoding="utf-8") as f:
            f.write(request.system_prompt.strip())
        return PromptGenerationResponse(system_prompt=request.system_prompt, message="Successfully updated system prompt.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-prompt", response_model=PromptGenerationResponse)
def generate_system_prompt(request: PromptGenerationRequest):
    """Generate a new system prompt based on a use case description and set it as active."""
    generation_prompt = PROMPT_TEMPLATE.format(use_case=request.use_case)
    
    try:
        new_system_prompt = _llm_call(prompt=generation_prompt, system_prompt="You are an expert prompt engineer.", max_tokens=1500)
        
        # Save it
        prompt_path = get_prompt_path()
        with open(prompt_path, "w", encoding="utf-8") as f:
            f.write(new_system_prompt.strip())
            
        return PromptGenerationResponse(system_prompt=new_system_prompt.strip(), message="Successfully generated and saved new system prompt.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import StreamingResponse
from fastapi import Request
import asyncio
from ragfather.utils.sse_logger import log_broadcaster

@router.get("/logs/stream")
async def stream_logs(request: Request):
    """Stream application logs via Server-Sent Events."""
    async def event_generator():
        q = asyncio.Queue()
        loop = asyncio.get_running_loop()
        queue_item = (q, loop)
        log_broadcaster.queues.add(queue_item)
        try:
            # Yield history first
            for msg in log_broadcaster.history:
                yield f"data: {msg}\n\n"
            
            # Wait for new logs
            while True:
                if await request.is_disconnected():
                    break
                msg = await q.get()
                yield f"data: {msg}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            log_broadcaster.queues.discard(queue_item)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
