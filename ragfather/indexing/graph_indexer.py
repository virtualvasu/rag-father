"""Knowledge graph construction in Neo4j from the document chunk hierarchy."""

import logging
from typing import Optional

from neo4j import GraphDatabase, Driver

from ragfather.config import settings

logger = logging.getLogger(__name__)


# ── Node labels ───────────────────────────────────────────────────────────────
LABEL_DOCUMENT = "Document"
LABEL_SECTION = "Section"
LABEL_CHUNK = "Chunk"

# ── Relationship types ────────────────────────────────────────────────────────
REL_HAS_SECTION = "HAS_SECTION"
REL_HAS_CHUNK = "HAS_CHUNK"
REL_PARENT_OF = "PARENT_OF"
REL_NEXT_SECTION = "NEXT_SECTION"
REL_CROSS_REF = "CROSS_REFERENCES"


def get_driver() -> Driver:
    return GraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_username, settings.neo4j_password),
    )


def clear_graph(driver: Driver) -> None:
    """Drop all nodes and relationships. Use only on fresh import."""
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
    logger.warning("Neo4j graph cleared")


def create_constraints(driver: Driver) -> None:
    """Create uniqueness constraints (idempotent)."""
    constraints = [
        "CREATE CONSTRAINT document_name IF NOT EXISTS FOR (d:Document) REQUIRE d.name IS UNIQUE",
        "CREATE CONSTRAINT section_id IF NOT EXISTS FOR (s:Section) REQUIRE s.section_id IS UNIQUE",
        "CREATE CONSTRAINT chunk_id IF NOT EXISTS FOR (c:Chunk) REQUIRE c.chunk_id IS UNIQUE",
    ]
    with driver.session() as session:
        for cypher in constraints:
            session.run(cypher)
    logger.info("Neo4j constraints ensured")


def _build_graph_tx(tx, chunks: list[dict]) -> tuple[int, int]:
    """
    Run graph construction inside a single transaction.
    Returns (nodes_created, edges_created).
    """
    nodes = 0
    edges = 0

    # ── 1. Collect unique source Documents ─────────────────────────────────
    sources = {c["source"] for c in chunks if c.get("source")}
    for source in sources:
        tx.run(
            "MERGE (d:Document {name: $name})",
            name=source,
        )
        nodes += 1

    # ── 2. Create Section nodes (from parent chunks) ───────────────────────
    parents = {c["chunk_id"]: c for c in chunks if c["type"] == "parent"}
    for chunk_id, chunk in parents.items():
        tx.run(
            """
            MERGE (s:Section {section_id: $section_id})
            SET s.source = $source,
                s.section_number = $section_number,
                s.section_title = $section_title,
                s.text = $text,
                s.source_file = $source_file
            WITH s
            MATCH (d:Document {name: $source})
            MERGE (d)-[:HAS_SECTION]->(s)
            """,
            section_id=chunk_id,
            source=chunk.get("source", ""),
            section_number=chunk.get("section_number", ""),
            section_title=chunk.get("section_title", ""),
            text=chunk.get("text", ""),
            source_file=chunk.get("source_file", ""),
        )
        nodes += 1
        edges += 1  # HAS_SECTION

    # ── 3. Create Chunk nodes (child + table) and link to parent ──────────
    children = [c for c in chunks if c["type"] in ("child", "table")]
    for chunk in children:
        tx.run(
            """
            MERGE (ch:Chunk {chunk_id: $chunk_id})
            SET ch.type = $type,
                ch.source = $source,
                ch.section_number = $section_number,
                ch.text = $text,
                ch.contextualized_text = $ctx_text,
                ch.tokens = $tokens,
                ch.source_file = $source_file
            WITH ch
            MATCH (s:Section {section_id: $parent_id})
            MERGE (s)-[:HAS_CHUNK]->(ch)
            MERGE (s)-[:PARENT_OF]->(ch)
            """,
            chunk_id=chunk["chunk_id"],
            type=chunk["type"],
            source=chunk.get("source", ""),
            section_number=chunk.get("section_number", ""),
            text=chunk.get("text", ""),
            ctx_text=chunk.get("contextualized_text"),
            tokens=chunk.get("tokens", 0),
            source_file=chunk.get("source_file", ""),
            parent_id=chunk.get("parent_id", ""),
        )
        nodes += 1
        edges += 2  # HAS_CHUNK + PARENT_OF

    # ── 4. NEXT_SECTION edges (ordered sequence within a source document) ──
    # Sort parents by source then section_number for sequential linking
    sorted_parents = sorted(
        parents.values(),
        key=lambda c: (c.get("source", ""), c.get("section_number", "")),
    )
    for i in range(len(sorted_parents) - 1):
        curr = sorted_parents[i]
        nxt = sorted_parents[i + 1]
        if curr.get("source") == nxt.get("source"):
            tx.run(
                """
                MATCH (s1:Section {section_id: $id1})
                MATCH (s2:Section {section_id: $id2})
                MERGE (s1)-[:NEXT_SECTION]->(s2)
                """,
                id1=curr["chunk_id"],
                id2=nxt["chunk_id"],
            )
            edges += 1

    # ── 5. CROSS_REFERENCES edges ──────────────────────────────────────────
    for chunk in chunks:
        for ref in chunk.get("cross_references") or []:
            tx.run(
                """
                MATCH (src:Chunk {chunk_id: $src_id})
                MATCH (tgt:Section {section_id: $tgt_id})
                MERGE (src)-[:CROSS_REFERENCES]->(tgt)
                """,
                src_id=chunk["chunk_id"],
                tgt_id=ref,
            )
            edges += 1

    return nodes, edges


def build_knowledge_graph(
    chunks: list[dict],
    clear_existing: bool = False,
) -> tuple[int, int]:
    """
    Build the full knowledge graph in Neo4j.

    Graph schema:
        (Document)-[:HAS_SECTION]->(Section)-[:HAS_CHUNK]->(Chunk)
        (Section)-[:NEXT_SECTION]->(Section)     [sequential order within a source document]
        (Chunk)-[:CROSS_REFERENCES]->(Section)   [explicit cross-references]

    Args:
        chunks: All chunks (parent + child + table)
        clear_existing: If True, drops all nodes before import

    Returns:
        (nodes_created, edges_created)
    """
    driver = get_driver()

    try:
        if clear_existing:
            clear_graph(driver)

        create_constraints(driver)

        with driver.session() as session:
            nodes, edges = session.execute_write(_build_graph_tx, chunks)

        logger.info(
            f"✓ Knowledge graph built — {nodes} nodes, {edges} edges"
        )
        return nodes, edges

    finally:
        driver.close()
