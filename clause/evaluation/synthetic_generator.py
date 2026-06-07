import json
import random
import logging
from pathlib import Path
from clause.generation.generator import _llm_call

logger = logging.getLogger(__name__)

RAW_CHUNKS_PATH = Path("data/processed/chunks/raw_chunks.json")
EVAL_DIR = Path("data/eval")
QUESTIONS_PATH = EVAL_DIR / "questions.json"
GROUND_TRUTH_PATH = EVAL_DIR / "ground_truth.json"

PROMPT_TEMPLATE = """You are an expert evaluator creating an evaluation dataset for a RAG system.
Given the following text segment from a document, generate exactly ONE complex question that can be answered using only this text, and provide the comprehensive answer.

Requirements:
1. The question must be specific and require understanding the core facts in the text.
2. The answer must be detailed and completely answer the question based ONLY on the provided text.
3. Output MUST be strictly in the following JSON format:
{{
  "question": "Your specific question here",
  "answer": "Your comprehensive answer here"
}}

Text segment:
{text}
"""

def generate_synthetic_dataset(num_questions: int = 5) -> dict:
    """
    Generates a synthetic evaluation dataset (questions.json and ground_truth.json) 
    using the local LLM to create QA pairs from randomly sampled parent chunks.
    """
    logger.info(f"Starting synthetic dataset generation for {num_questions} questions.")
    
    if not RAW_CHUNKS_PATH.exists():
        raise FileNotFoundError(f"Cannot generate dataset: {RAW_CHUNKS_PATH} not found.")

    with open(RAW_CHUNKS_PATH, 'r', encoding='utf-8') as f:
        all_chunks = json.load(f)

    # Filter for parent chunks to ensure enough context for a good question
    parent_chunks = [c for c in all_chunks if c.get("type") == "parent" and len(c.get("text", "")) > 200]
    
    if len(parent_chunks) < num_questions:
        logger.warning(f"Requested {num_questions} questions, but only {len(parent_chunks)} suitable parent chunks found. Adjusting.")
        num_questions = len(parent_chunks)
        
    sampled_chunks = random.sample(parent_chunks, num_questions)
    
    questions = []
    ground_truths = {}
    
    for i, chunk in enumerate(sampled_chunks):
        q_id = f"Q{str(i+1).zfill(3)}"
        text = chunk.get("text", "")
        
        prompt = PROMPT_TEMPLATE.format(text=text)
        
        try:
            # We use a lower max_tokens for generation, but enough for a QA pair
            response = _llm_call(prompt, max_tokens=1500)
            
            # Basic cleanup in case LLM outputs markdown backticks
            cleaned_response = response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.startswith("```"):
                cleaned_response = cleaned_response[3:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
                
            qa_pair = json.loads(cleaned_response.strip(), strict=False)
            
            question_text = qa_pair.get("question", "")
            answer_text = qa_pair.get("answer", "")
            
            if not question_text or not answer_text:
                continue
                
            # For simplicity, assign category as SIMPLE or MULTI_HOP based on length
            category = "SIMPLE" if len(text) < 500 else "MULTI_HOP"
            
            questions.append({
                "id": q_id,
                "category": category,
                "question": question_text,
                "relevant_sections": [chunk.get("chunk_id")]
            })
            
            ground_truths[q_id] = answer_text
            
            logger.info(f"Generated Q{i+1}/{num_questions} successfully.")
            
        except Exception as e:
            logger.error(f"Failed to generate QA for chunk {chunk.get('chunk_id')}: {e}")
            continue

    if not questions:
        raise ValueError("Failed to generate any valid QA pairs.")

    # Ensure eval directory exists
    EVAL_DIR.mkdir(parents=True, exist_ok=True)
    
    # Save the files
    with open(QUESTIONS_PATH, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2)
        
    with open(GROUND_TRUTH_PATH, 'w', encoding='utf-8') as f:
        json.dump(ground_truths, f, indent=2)
        
    logger.info(f"Successfully generated dataset with {len(questions)} questions.")
    
    return {
        "status": "success",
        "num_questions": len(questions),
        "questions_path": str(QUESTIONS_PATH),
        "ground_truth_path": str(GROUND_TRUTH_PATH)
    }
