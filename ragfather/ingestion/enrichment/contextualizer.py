"""Contextual enrichment — supports Claude (cloud) or Ollama (local)."""

import asyncio
import logging
from typing import Optional

from ragfather.config import settings
from ragfather.ingestion.chunkers import Chunk
from ragfather.generation.prompts import CONTEXTUALIZATION_PROMPT

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Claude provider
# ---------------------------------------------------------------------------

async def _contextualize_with_claude(
    child: Chunk,
    parent: Chunk,
    client,  # anthropic.AsyncAnthropic
    model: str,
) -> Chunk:
    """Contextualize a chunk using Claude (Anthropic API)."""
    import anthropic

    try:
        response = await client.messages.create(
            model=model,
            max_tokens=150,
            messages=[{
                "role": "user",
                "content": CONTEXTUALIZATION_PROMPT.format(
                    source_name=child.source,
                    parent_text=parent.text,
                    chunk_text=child.text,
                ),
            }],
        )
        context_sentence = response.content[0].text.strip()
        child.contextualized_text = f"{context_sentence}\n\n{child.text}"
        logger.debug(f"[claude] Contextualized {child.chunk_id}")
        return child

    except anthropic.APIError as e:
        logger.error(f"[claude] Error contextualizing {child.chunk_id}: {e}")
        child.contextualized_text = child.text
        return child


# ---------------------------------------------------------------------------
# Ollama provider (OpenAI-compatible endpoint)
# ---------------------------------------------------------------------------

async def _contextualize_with_ollama(
    child: Chunk,
    parent: Chunk,
    client,  # openai.AsyncOpenAI pointed at Ollama
    model: str,
) -> Chunk:
    """Contextualize a chunk using a local Ollama model."""
    try:
        response = await client.chat.completions.create(
            model=model,
            max_tokens=150,
            messages=[{
                "role": "user",
                "content": CONTEXTUALIZATION_PROMPT.format(
                    source_name=child.source,
                    parent_text=parent.text,
                    chunk_text=child.text,
                ),
            }],
        )
        context_sentence = response.choices[0].message.content.strip()
        child.contextualized_text = f"{context_sentence}\n\n{child.text}"
        logger.debug(f"[ollama] Contextualized {child.chunk_id}")
        return child

    except Exception as e:
        logger.error(f"[ollama] Error contextualizing {child.chunk_id}: {e}")
        child.contextualized_text = child.text
        return child


# ---------------------------------------------------------------------------
# Custom provider (OpenAI-compatible endpoint)
# ---------------------------------------------------------------------------

async def _contextualize_with_custom(
    child: Chunk,
    parent: Chunk,
    client,  # openai.AsyncOpenAI pointed at Custom
    model: str,
) -> Chunk:
    """Contextualize a chunk using a custom OpenAI-compatible model."""
    try:
        response = await client.chat.completions.create(
            model=model,
            max_tokens=150,
            messages=[{
                "role": "user",
                "content": CONTEXTUALIZATION_PROMPT.format(
                    source_name=child.source,
                    parent_text=parent.text,
                    chunk_text=child.text,
                ),
            }],
        )
        context_sentence = response.choices[0].message.content.strip()
        child.contextualized_text = f"{context_sentence}\n\n{child.text}"
        logger.debug(f"[custom] Contextualized {child.chunk_id}")
        return child

    except Exception as e:
        logger.error(f"[custom] Error contextualizing {child.chunk_id}: {e}")
        child.contextualized_text = child.text
        return child

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def contextualize_chunk(
    child: Chunk,
    parent: Chunk,
    client,
    model: str,
) -> Chunk:
    """
    Generate context sentence for a child chunk using its parent section.

    Routes to Claude or Ollama based on settings.enrichment_provider.
    """
    if settings.enrichment_provider == "ollama":
        return await _contextualize_with_ollama(child, parent, client, model)
    elif settings.enrichment_provider == "custom":
        return await _contextualize_with_custom(child, parent, client, model)
    else:
        return await _contextualize_with_claude(child, parent, client, model)


async def contextualize_all(
    children: list[Chunk],
    parent_map: dict[str, Chunk],
    concurrency: int = 10,
) -> list[Chunk]:
    """
    Contextualize all child chunks with controlled concurrency.

    Provider is selected from settings.enrichment_provider:
    - "ollama" → local Ollama model (free, no API key needed)
    - "claude" → Claude Haiku via Anthropic API (~$1-2 for full corpus)

    concurrency=10 is safe for both Haiku rate limits and local Ollama.

    Args:
        children:    List of child chunks to contextualize
        parent_map:  Dict mapping parent_id → parent Chunk
        concurrency: Max parallel calls (default: 10)

    Returns:
        List of contextualized child chunks
    """
    provider = settings.enrichment_provider
    logger.info(f"Enrichment provider: {provider}")

    if provider == "ollama":
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            base_url=settings.ollama_base_url,
            api_key="ollama",  # Ollama doesn't need a real key
        )
        model = settings.ollama_model
        logger.info(f"Using Ollama model: {model} at {settings.ollama_base_url}")
    elif provider == "custom":
        from openai import AsyncOpenAI
        if not settings.custom_llm_base_url or not settings.custom_llm_api_key or not settings.custom_llm_model:
            raise ValueError(
                "CUSTOM_LLM config is required when enrichment_provider=custom. "
            )
        client = AsyncOpenAI(
            base_url=settings.custom_llm_base_url,
            api_key=settings.custom_llm_api_key,
        )
        model = settings.custom_llm_model
        logger.info(f"Using Custom model: {model} at {settings.custom_llm_base_url}")
    else:
        import anthropic
        if not settings.anthropic_api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY is required when enrichment_provider=claude. "
                "Set it in .env or switch to enrichment_provider=ollama."
            )
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        model = settings.contextualization_model
        logger.info(f"Using Claude model: {model}")

    semaphore = asyncio.Semaphore(concurrency)

    async def bounded_contextualize(child: Chunk) -> Chunk:
        async with semaphore:
            parent = parent_map.get(child.parent_id)
            if not parent:
                logger.warning(f"Parent not found for {child.chunk_id}, using text as-is")
                child.contextualized_text = child.text
                return child
            return await contextualize_chunk(child, parent, client, model)

    logger.info(f"Contextualizing {len(children)} child chunks with concurrency={concurrency}")
    tasks = [bounded_contextualize(child) for child in children]
    return await asyncio.gather(*tasks)
