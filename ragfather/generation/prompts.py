"""
All LLM prompt templates as module-level constants.

Rule: NEVER define prompts inline in other files. Always import from here.
Rule: Use .format(**kwargs) at call time, never at import time.
"""
import os

def get_system_prompt() -> str:
    """Read the active system prompt from the root text file, falling back to a default."""
    prompt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "system_prompt.txt")
    if os.path.exists(prompt_path):
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    return "You are a precise AI assistant. Answer using the provided context."



# ============ QUERY PIPELINE ============

QUERY_CLASSIFICATION_PROMPT = """Classify this query into exactly one category.

Query: {query}

Categories:
- SIMPLE: Single section lookup. One source document, one concept, direct answer.
  Example: "What is the definition of a small business under the vendor agreement?"

- MULTI_HOP: Requires reasoning across multiple sections of one source document.
  Example: "What are all the onboarding requirements in the first 90 days?"

- CROSS_DOC: Requires information from multiple source documents.
  Example: "What approvals are needed when the vendor policy and the finance policy both apply?"

- CONDITIONAL: Answer depends on conditions (entity type, thresholds, dates).
  Example: "What are the audit requirements for a company with revenue between $2M and $10M?"

Return ONLY one word: SIMPLE, MULTI_HOP, CROSS_DOC, or CONDITIONAL"""


QUERY_EXPANSION_PROMPT = """You are expanding a query to improve retrieval coverage.

Original query: {query}

Generate exactly 3 alternative phrasings of this query. Each phrasing should:
1. Use different terminology that might appear in the source documents
2. Cover different angles of the same question
3. Be specific enough to retrieve relevant sections

Formal documents often use language like "shall", "notwithstanding", "pursuant to".
Include both formal document language and plain English variants.

Return ONLY a JSON array of 3 strings:
["phrasing 1", "phrasing 2", "phrasing 3"]"""


HYDE_PROMPT = """Write a short passage that would appear in the source document
that directly answers this question:

Question: {query}

Write as if you are the actual document text — use the formal language, section references,
and phrase structure typical of the document's domain. 2-3 sentences maximum.

This hypothetical passage will be embedded and used to search for the real source sections."""


# ============ AGENT LOOP ============

CRAG_CHECK_PROMPT = """Evaluate whether the retrieved context is sufficient to answer this query.

Query: {query}

Retrieved context summary:
{context_summary}

Score the context from 0.0 to 1.0:
- 1.0: Context directly and completely answers the query
- 0.7: Context mostly answers the query, minor gaps
- 0.5: Context partially answers, significant gaps
- 0.3: Context is tangentially related, major gaps
- 0.0: Context is irrelevant to the query

Also identify: what specific information is missing (if score < 0.6)?

Return ONLY valid JSON:
{{"score": float, "reason": str, "missing_info": str}}"""


QUERY_REFINEMENT_PROMPT = """The initial retrieval for a query was insufficient.

Original query: {original_query}

Reason context was insufficient: {refinement_reason}

Generate a refined query that:
1. Preserves the core question
2. Incorporates the missing context indicators
3. Uses more specific terminology drawn from the domain if needed
4. May broaden scope to related sections or source documents if appropriate

Return ONLY the refined query text, no explanation."""


# ============ GENERATION ============

CONTEXT_BLOCK_TEMPLATE = """---
[Source {index}] {source} | Section {section_number}{section_title_part}
{text}
---"""

GENERATION_PROMPT = """You are answering a question using the following retrieved context blocks.
Base your answer ONLY on the provided context. Do not use prior knowledge.
If the context does not contain enough information to answer fully, say so explicitly.

IMPORTANT — Citation Rules:
- Every factual claim MUST be cited inline using [Source N] where N is the block number.
- Use the exact [Source N] format shown in the context headers (e.g. [Source 1], [Source 2]).
- You may cite multiple sources for one claim: [Source 1][Source 3].
- Do not fabricate sources. Only cite sources that appear in the context below.

Retrieved Context:
{context_blocks}

Question: {query}

Answer:"""


GENERATION_PROMPT_NO_CITATIONS = """You are answering a question using the following retrieved context blocks.
Base your answer ONLY on the provided context. Do not use prior knowledge.
If the context does not contain enough information to answer fully, say so explicitly.

Retrieved Context:
{context_blocks}

Question: {query}

Answer:"""


# ============ ENRICHMENT (used by ingestion pipeline) ============

CONTEXTUALIZATION_PROMPT = """You are processing a document for a RAG retrieval system.

Here is the full parent section from {source_name}:
<parent_section>
{parent_text}
</parent_section>

Here is a specific sub-section chunk extracted from it:
<chunk>
{chunk_text}
</chunk>

Write exactly 1-2 sentences that:
1. Identify which source document and section number this chunk belongs to
2. Describe the specific concept or obligation this chunk addresses
3. Note any key conditions, entity types, or thresholds mentioned

Be precise. Use the exact section number and source document name.
Return only the 1-2 sentences, no preamble, no explanation.

Example output format:
"This sub-section is from Section 3 of the employee_handbook.pdf, governing business travel expense reimbursement. It specifies the 30-day submission window and itemized-receipt requirement." """
