"""
Answer generation with inline citation extraction.

Generation providers (routed by config):
  "ollama"  → qwen2.5:7b via Ollama (local, free) — default
  "claude"  → claude-sonnet-4 via Anthropic API (paid, best quality)
"""

import json
import logging
import re
from typing import Optional

from ragfather.config import settings
from ragfather.generation.prompts import (
    GENERATION_PROMPT,
    GENERATION_PROMPT_NO_CITATIONS,
    CONTEXT_BLOCK_TEMPLATE,
    CRAG_CHECK_PROMPT,
    QUERY_REFINEMENT_PROMPT,
    get_system_prompt,
)

logger = logging.getLogger(__name__)


# ── Context formatting ─────────────────────────────────────────────────────────

def format_context_blocks(chunks: list[dict]) -> str:
    """Format retrieved chunks into numbered [Source N] context blocks for the LLM prompt."""
    blocks = []
    for idx, chunk in enumerate(chunks, start=1):
        section_title = chunk.get("section_title", "")
        section_title_part = f" — {section_title}" if section_title else ""
        block = CONTEXT_BLOCK_TEMPLATE.format(
            index=idx,
            act=chunk.get("act", "Unknown Act"),
            section_number=chunk.get("section_number", ""),
            section_title_part=section_title_part,
            text=chunk.get("text", ""),
        )
        blocks.append(block)
    return "\n".join(blocks)


# ── LLM backends ──────────────────────────────────────────────────────────────

def _call_ollama(prompt: str, system_prompt: Optional[str] = None, max_tokens: int = 1000) -> str:
    """Call Ollama local LLM via direct HTTP POST (avoids openai SDK proxy issues)."""
    import httpx

    url = settings.ollama_base_url.rstrip("/") + "/chat/completions"
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": settings.ollama_model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.1,
    }
    with httpx.Client(timeout=300) as client:
        r = client.post(url, json=payload, headers={"Authorization": "Bearer ollama"})
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()


def _call_claude(prompt: str, system_prompt: Optional[str] = None, max_tokens: int = 1000) -> str:
    """Call Claude via Anthropic API."""
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    
    kwargs = {
        "model": settings.generation_model,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system_prompt:
        kwargs["system"] = system_prompt
        
    response = client.messages.create(**kwargs)
    return response.content[0].text.strip()


def _call_custom(prompt: str, system_prompt: Optional[str] = None, max_tokens: int = 1000) -> str:
    """Call Custom OpenAI-Compatible API."""
    from openai import OpenAI

    client = OpenAI(
        base_url=settings.custom_llm_base_url,
        api_key=settings.custom_llm_api_key,
    )
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    response = client.chat.completions.create(
        model=settings.custom_llm_model,
        max_tokens=max_tokens,
        messages=messages,
        temperature=0.1,
    )
    return response.choices[0].message.content.strip()


def _llm_call(prompt: str, system_prompt: Optional[str] = None, max_tokens: int = 1000) -> str:
    """Route LLM call based on generation_provider config."""
    provider = settings.generation_provider
    if provider == "claude":
        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY not set — use generation_provider=ollama")
        return _call_claude(prompt, system_prompt, max_tokens)
    elif provider == "custom":
        if not settings.custom_llm_base_url or not settings.custom_llm_api_key or not settings.custom_llm_model:
            raise ValueError("Custom LLM config missing")
        return _call_custom(prompt, system_prompt, max_tokens)
    else:
        return _call_ollama(prompt, system_prompt, max_tokens)


# ── Citation extraction ────────────────────────────────────────────────────────

def extract_citations(answer: str, context_chunks: list[dict]) -> list[dict]:
    """
    Parse inline citations from generated answer text.

    PRIMARY pattern — numeric source references (new format):
      [Source 1], [Source 3], etc.
      Each is mapped back to the corresponding context chunk by 1-based index.

    FALLBACK pattern — legacy act/section format:
      [Companies Act 2013, Section 42]
      [SEBI ICDR Regulations 2018, Regulation 26]
    """
    citations = []
    seen_indices: set[int] = set()
    seen_keys: set[str] = set()

    # ── Primary: [Source N] references ────────────────────────────────────────
    source_pattern = r'\[Source\s+(\d+)\]'
    for match in re.finditer(source_pattern, answer, re.IGNORECASE):
        n = int(match.group(1))
        if n in seen_indices:
            continue
        seen_indices.add(n)

        chunk_index = n - 1  # convert 1-based to 0-based
        if 0 <= chunk_index < len(context_chunks):
            chunk = context_chunks[chunk_index]
            citations.append({
                "source_index": n,
                "act": chunk.get("act", ""),
                "section_type": "Section",
                "section_number": chunk.get("section_number", ""),
                "section_title": chunk.get("section_title"),
                "chunk_id": chunk.get("chunk_id"),
                "text_excerpt": chunk.get("text", "")[:300],
            })
        else:
            # Source index out of range — record it without chunk data
            citations.append({
                "source_index": n,
                "act": "",
                "section_type": "Section",
                "section_number": "",
                "section_title": None,
                "chunk_id": None,
                "text_excerpt": None,
            })

    # ── Fallback: [Act, Section X] pattern ────────────────────────────────────
    legacy_pattern = r'\[([^\]]+),\s*(Section|Rule|Regulation|Clause)\s+([^\]]+)\]'
    for act, sec_type, sec_num in re.findall(legacy_pattern, answer):
        key = f"{act.strip()}_{sec_num.strip()}"
        if key in seen_keys:
            continue
        seen_keys.add(key)

        citation_obj: dict = {
            "source_index": None,
            "act": act.strip(),
            "section_type": sec_type,
            "section_number": sec_num.strip(),
            "section_title": None,
            "chunk_id": None,
            "text_excerpt": None,
        }

        # Try to match to a retrieved chunk
        for chunk in context_chunks:
            if (
                act.strip().lower() in chunk.get("act", "").lower()
                and sec_num.strip() in chunk.get("section_number", "")
            ):
                citation_obj.update({
                    "section_title": chunk.get("section_title"),
                    "chunk_id": chunk.get("chunk_id"),
                    "text_excerpt": chunk.get("text", "")[:300],
                })
                break

        citations.append(citation_obj)

    return citations


# ── Main generation function ───────────────────────────────────────────────────

def generate_answer(
    query: str,
    context_chunks: list[dict],
    max_tokens: int = 1000,
    use_citations: bool = True,
) -> dict:
    """
    Generate a legal answer with inline citations from retrieved chunks.

    Args:
        query:          Original user question
        context_chunks: Reranked chunks from hybrid_retrieve()
        max_tokens:     Max response length
        use_citations:  Whether to instruct the LLM to output inline citations

    Returns:
        {
            "answer":    str   — full answer text with inline citations
            "citations": list  — structured citation objects
            "provider":  str   — which LLM was used
            "chunks_used": int — number of context chunks
        }
    """
    if not context_chunks:
        return {
            "answer": "I could not find relevant legal context to answer your question.",
            "citations": [],
            "provider": settings.generation_provider,
            "chunks_used": 0,
        }

    context_blocks = format_context_blocks(context_chunks)

    prompt_template = GENERATION_PROMPT if use_citations else GENERATION_PROMPT_NO_CITATIONS
    prompt = prompt_template.format(
        context_blocks=context_blocks,
        query=query,
    )

    logger.info(
        f"Generating answer | provider={settings.generation_provider} "
        f"| chunks={len(context_chunks)} | query='{query[:60]}...'"
    )

    system_prompt = get_system_prompt()
    answer = _llm_call(prompt, system_prompt=system_prompt, max_tokens=max_tokens)
    citations = extract_citations(answer, context_chunks) if use_citations else []

    logger.info(f"Generated answer ({len(answer)} chars, {len(citations)} citations)")

    return {
        "answer": answer,
        "citations": citations,
        "provider": settings.generation_provider,
        "chunks_used": len(context_chunks),
    }


# ── CRAG context quality check ─────────────────────────────────────────────────

def crag_check(query: str, context_chunks: list[dict]) -> dict:
    """
    Evaluate whether retrieved context is sufficient to answer the query.
    Returns score 0-1 and reason. Used by the agent loop.

    Score >= 0.6 → proceed to generation
    Score <  0.6 → refine query and re-retrieve
    """
    # Build a compact summary of context (just section refs + first 100 chars each)
    context_summary = "\n".join([
        f"- {c.get('act')} Section {c.get('section_number')}: {c.get('text', '')[:100]}..."
        for c in context_chunks[:10]
    ])

    prompt = CRAG_CHECK_PROMPT.format(
        query=query,
        context_summary=context_summary,
    )

    raw = _llm_call(prompt, max_tokens=200)

    try:
        # Extract JSON from response (LLM may wrap it in markdown)
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        result = json.loads(json_match.group()) if json_match else {}
        return {
            "score": float(result.get("score", 0.5)),
            "reason": result.get("reason", ""),
            "missing_info": result.get("missing_info", ""),
        }
    except (json.JSONDecodeError, AttributeError):
        logger.warning(f"CRAG check failed to parse JSON: {raw[:100]}")
        return {"score": 0.5, "reason": "parse error", "missing_info": ""}


def refine_query(original_query: str, refinement_reason: str) -> str:
    """Generate a refined query to improve retrieval on retry."""
    prompt = QUERY_REFINEMENT_PROMPT.format(
        original_query=original_query,
        refinement_reason=refinement_reason,
    )
    return _llm_call(prompt, max_tokens=150)
