"""Document chunking — hierarchical, structure-aware text splitting."""

from pydantic import BaseModel
from typing import Optional


class Chunk(BaseModel):
    """
    Represents a chunk of document text at any hierarchy level.

    Three types of chunks form a hierarchy:
    - document: metadata only, populates Neo4j Document nodes
    - parent: one complete section (512-1024 tokens), sent to LLM at generation
    - child: one sub-section (128-256 tokens), embedded and retrieved
    - table: structured table, never split
    """

    chunk_id: str
    """Deterministic ID. Format: SRC_S{n} or SRC_S{n}_{m}"""

    type: str
    """One of: "document", "parent", "child", "table" """

    parent_id: Optional[str] = None
    """Only set on child chunks. Points to parent chunk ID."""

    source: str
    """Source document name. e.g. "employee_handbook.pdf" """

    chapter: Optional[str] = None
    """Chapter name. e.g. "Chapter II" """

    section_number: Optional[str] = None
    """Section/Rule number. e.g. "42", "42(3)", "Rule 14" """

    section_title: Optional[str] = None
    """Full section title. e.g. "Private Placements" """

    text: str
    """Original text — shown in citations. Never modified."""

    contextualized_text: Optional[str] = None
    """Set by enrichment. Prepends 1-2 context sentences. Used for embedding."""

    cross_references: list[str] = []
    """Detected references. e.g. ["Section 43", "Rule 14"] — become graph edges."""

    tokens: int
    """Token count of original text. Validated against bounds."""

    source_file: str
    """Source PDF or HTML filename."""

    sentence_window: Optional[str] = None
    """±2 sentences around child chunk for context."""

    class Config:
        # Allow arbitrary types for compatibility
        arbitrary_types_allowed = True
