<div align="center">

# Ragfather

**The Godfather of RAG Pipelines**

*Build. Evaluate. Deploy. Own your AI, completely.*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-DC143C?style=flat-square)](https://qdrant.tech)
[![Neo4j](https://img.shields.io/badge/Neo4j-Graph_DB-008CC1?style=flat-square&logo=neo4j&logoColor=white)](https://neo4j.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## Demo

<div align="center">
  <video src="./assets/demo.mp4" width="100%" controls autoplay loop muted playsinline>
    Your browser does not support the video tag.
  </video>
</div>

---

## What is Ragfather?

Ragfather is an **end-to-end, self-hosted RAG creation, evaluation, and deployment platform**. It gives you complete ownership over every stage of the RAG lifecycle — from raw document ingestion and multi-index storage, through rigorous automated evaluation, all the way to production-ready querying — without requiring a single external API call.

Unlike generic RAG starter kits, Ragfather is designed for **experimentation and precision**. You can toggle individual pipeline components on and off, run head-to-head ablation studies across multiple retrieval strategies, and use the built-in evaluation suite to identify the optimal configuration for *your* specific data and use case. Every parameter is exposed. Every result is traceable.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| **End-to-End Pipeline** | Upload PDFs → Chunk → Enrich → Index → Query. All via a web UI. |
| **Total Customization** | Toggle Knowledge Graph, Cross-Encoder Reranking, CRAG, Skip Enrichment, Append vs. Wipe modes, Top-K, chunk sizes and more. |
| **Built-in Evaluation Suite** | Auto-generate synthetic test sets from your own documents and benchmark multiple RAG strategies side-by-side. |
| **RAGAS Scoring** | Judge retrieval quality on Faithfulness, Answer Relevancy, Context Precision, and Context Recall. |
| **Evaluation History** | Every benchmark run is persisted locally (IndexedDB) with full pipeline parameters, so you can compare runs across time and select your best configuration. |
| **Fully Local-First** | Ollama integration means zero data leaves your machine. Groq, Claude, and OpenAI-compatible APIs are optional. |
| **No Framework Lock-in** | Built with raw FastAPI, LiteLLM, and direct database clients for maximum control, debuggability, and zero black-box abstraction overhead. |
| **Real-time Logs** | Live streaming execution logs via SSE directly in the browser terminal UI. |

---

## System Architecture

```mermaid
graph TB
subgraph "Browser Client"
UI_ADMIN["Admin Interface<br/>(Pipeline Wizard)"]
UI_EVAL["Evaluation Portal<br/>(Benchmark Wizard)"]
UI_CHAT["Chat Interface<br/>(RAG Query)"]
end

subgraph "FastAPI Backend"
API_INGEST["/api/ingestion"]
API_EVAL["/api/evaluation"]
API_QUERY["/api/query"]
API_LOGS["/api/system/logs/stream (SSE)"]
end

subgraph "Data Stores"
QDRANT[("Qdrant\nVector DB")]
NEO4J[("Neo4j\nGraph DB")]
BM25[("BM25\nSparse Index")]
FS[("Filesystem\nChunks + Metadata")]
end

subgraph "AI Providers"
OLLAMA["Ollama (Local)"]
GROQ["Groq API"]
CLAUDE["Anthropic Claude"]
OPENAI["OpenAI Compatible"]
end

UI_ADMIN -->|HTTP| API_INGEST
UI_EVAL -->|HTTP| API_EVAL
UI_CHAT -->|HTTP| API_QUERY
UI_ADMIN & UI_EVAL -->|SSE| API_LOGS

API_INGEST --> QDRANT & NEO4J & BM25 & FS
API_EVAL --> QDRANT & NEO4J & BM25
API_QUERY --> QDRANT & NEO4J & BM25

API_INGEST & API_EVAL & API_QUERY --> OLLAMA
API_INGEST & API_EVAL & API_QUERY --> GROQ
API_INGEST & API_EVAL & API_QUERY --> CLAUDE
API_INGEST & API_EVAL & API_QUERY --> OPENAI
```

---

## Complete Workflow

```mermaid
flowchart LR
UPLOAD([Upload Documents]) --> CONFIG([Configure Pipeline]) --> RUN([Run Ingestion]) --> READY([RAG Ready])
READY --> CHAT([Chat Interface])
READY --> EVAL_GEN([Generate Testset])
EVAL_GEN --> EVAL_RUN([Run Benchmark])
EVAL_RUN --> COMPARE([Compare Results])
COMPARE -->|Iterate| CONFIG
COMPARE -->|Deploy| CHAT
```

---

## Pipeline Deep Dive

The ingestion pipeline transforms raw documents into a richly-indexed, multi-modal knowledge base.

```mermaid
graph TD
A([PDF / HTML Upload]) --> B[Document Parser<br/>OCR + Table Extraction]

B --> C{Hierarchical Chunker}
C --> D[Parent Chunks\nFull context blocks]
C --> E[Child Chunks\nGranular segments]
C --> F[Table Chunks\nStructured rows]

E --> G{Skip Enrichment?}
G -->|No| H["LLM Enrichment\n(Context Summaries +\nHypothetical Questions)"]
G -->|Yes| I[Direct Indexing]
H --> I

D & I & F --> J[Qdrant\nSemantic Embeddings\nBGE-Large-v1.5 / OpenAI]
D & I & F --> K[BM25\nSparse Keyword Index]

J & K --> L{Use Knowledge Graph?}
L -->|Yes| M["Neo4j\nEntity Extraction +\nRelationship Mapping"]
L -->|No| N
M --> N([Ready for Querying])
```

### Pipeline Parameters You Control

| Parameter | Options | Effect |
| :--- | :--- | :--- |
| **Wipe Data on Run** | On / Off | Full rebuild vs. append to existing index |
| **Skip Enrichment** | On / Off | Skip LLM context generation for faster ingestion |
| **Knowledge Graph** | On / Off | Enable Neo4j entity extraction and multi-hop traversal |
| **Cross-Encoder Reranker** | On / Off | Second-pass neural reranking of retrieved results |
| **Enrichment Provider** | Ollama, Groq, Claude, Custom | LLM used for contextual enrichment |
| **Generation Provider** | Ollama, Groq, Claude, Custom | LLM used for answer synthesis |
| **Embedding Provider** | Local (BGE-Large), OpenAI | Embedding model for vector indexing |
| **Child Chunk Size** | Integer | Granularity of indexable segments |
| **Top-K Retrieval** | Integer | Number of candidates fetched pre-rerank |
| **Graph Hops** | Integer | Depth of graph traversal from seed nodes |

---

## Evaluation Portal

Ragfather includes a first-class **evaluation and ablation framework**. Instead of blindly tuning parameters, you can quantitatively compare how different RAG configurations perform on questions *derived from your own documents*.

```mermaid
flowchart TD
DOCS[Your Ingested Documents] --> SYNTH["Synthetic Testset Generator\n(LLM-powered question synthesis)"]
SYNTH --> QA[(Q&A Test Pairs)]

QA --> V1["Variant: naive_rag\nVector-only · No Reranking · No Graph · No CRAG"]
QA --> V2["Variant: advanced_rag\nHybrid (Vector + BM25 + RRF) · Cross-Encoder · No Graph"]
QA --> V3["Variant: ragfather_full\nHybrid + Cross-Encoder + Knowledge Graph + CRAG"]

V1 & V2 & V3 --> RAGAS["RAGAS Evaluation\n(LLM-as-Judge)"]

RAGAS --> F["Faithfulness\nAre answers grounded in context?"]
RAGAS --> AR["Answer Relevancy\nDoes the answer address the question?"]
RAGAS --> CP["Context Precision\nAre retrieved chunks relevant?"]
RAGAS --> CR["Context Recall\nDid retrieval capture the needed info?"]

F & AR & CP & CR --> HISTORY["Persistent History\n(IndexedDB — local, no backend DB)"]
HISTORY --> COMPARE["Cross-Run Comparison\nFiles used · Pipeline params · Eval params · Scores"]
```

### Evaluation Variants

| Variant | Description |
| :--- | :--- |
| `naive_rag` | Baseline vector-only retrieval. No hybrid search, no reranking, no graph, no CRAG. |
| `advanced_rag` | Hybrid retrieval (Vector + BM25 + RRF fusion) with Cross-Encoder reranking. |
| `ragfather_full` | Full system: hybrid retrieval + Cross-Encoder + Knowledge Graph expansion + CRAG loop. |

### Evaluation History

Every benchmark run is automatically saved to the browser's local **IndexedDB**. This gives you a permanent, queryable log of every experiment:
- Which files were ingested
- Exact pipeline configuration at time of training
- Eval parameters (variants run, question subset, RAGAS settings)
- All RAGAS scores in an easy-to-compare table

> **Note:** To reproduce a specific result, you must re-ingest using the same pipeline parameters shown in the history entry.

---

## Chat Interface

```mermaid
sequenceDiagram
participant User
participant Frontend
participant Backend
participant Retriever
participant LLM

User->>Frontend: Submit query
Frontend->>Backend: POST /api/query
Backend->>Retriever: Hybrid search (Vector + BM25 + RRF)

alt Cross-Encoder Enabled
Retriever->>Retriever: Rerank with BGE-Reranker-Large
end

alt Knowledge Graph Enabled
Retriever->>Retriever: Graph traversal expansion (Neo4j)
end

alt CRAG Enabled
Retriever->>LLM: Evaluate context relevance
LLM->>Retriever: Refine / fallback to web search
end

Retriever->>Backend: Final ranked context chunks
Backend->>LLM: Prompt with system context + query + chunks
LLM->>Backend: Generated answer
Backend->>Frontend: Answer + source citations
Frontend->>User: Render response with citations
```

---

## Quick Start

### Prerequisites

- **Docker & Docker Compose** — for orchestrating all services
- **Ollama** (optional but recommended) — for fully local, private LLM inference

> **Ollama setup note:** By default, Ollama binds to `localhost` only. For Docker container access, you must expose it on all interfaces:
> ```bash
> # Linux (systemd)
> sudo systemctl edit ollama --force
> # Add: Environment="OLLAMA_HOST=0.0.0.0"
> sudo systemctl restart ollama
> ```

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/rag-father.git
cd rag-father
cp .env.example .env
# Edit .env and fill in your provider keys (if not using Ollama locally)
```

### 2. Pull Required Models

```bash
ollama pull qwen2.5:7b # Enrichment + Generation (default)
ollama pull bge-large:latest # Embeddings
```

### 3. Start the Stack

```bash
docker compose up --build -d
```

### 4. Open the App

| Interface | URL |
| :--- | :--- |
| Chat | `http://localhost:3000` |
| Admin (Pipeline) | `http://localhost:3000/admin` |
| Evaluation Portal | `http://localhost:3000/evaluate` |

---

## Project Structure

```
rag-father/
├── ragfather/
│ ├── api/ # FastAPI routes (ingestion, evaluation, query, system)
│ ├── ingestion/ # PDF parsing, chunking, enrichment
│ ├── indexing/ # Qdrant, Neo4j, BM25 indexing logic
│ ├── retrieval/ # Hybrid retriever, vector retriever, graph retriever
│ ├── generation/ # LLM answer synthesis (LiteLLM wrapper)
│ ├── evaluation/ # Benchmark runner, RAGAS integration, synthetic data gen
│ ├── query/ # Full query orchestrator (CRAG, retrieval, generation)
│ └── config.py # Central configuration schema
├── frontend/ # React + Vite + TailwindCSS web application
│ └── src/
│ ├── pages/
│ │ ├── AdminInterface.jsx # 4-step pipeline wizard
│ │ ├── EvaluationInterface.jsx # 3-step evaluation wizard + history
│ │ └── ChatInterface.jsx # Conversational RAG interface
│ └── utils/
│ └── db.js # IndexedDB persistence layer
├── data/
│ ├── raw/ # Uploaded source documents
│ ├── processed/ # Chunked data
│ └── eval/ # Synthetic Q&A testsets + benchmark results
├── docker-compose.yml
├── Dockerfile.backend
└── .env.example
```

---

## Service Architecture

| Service | Technology | Port | Purpose |
| :--- | :--- | :--- | :--- |
| **frontend** | React + Vite + Nginx | `3000` | Web UI. Reverse proxies API calls to backend. |
| **backend** | FastAPI (Python 3.11) | `8000` | Ingestion orchestration, query execution, eval runner. |
| **qdrant** | Qdrant | `6333` | High-performance vector database. |
| **neo4j** | Neo4j 5 | `7474` (HTTP), `7687` (Bolt) | Knowledge graph storage and traversal. |

---

## Why No LangChain?

Ragfather is built intentionally **without** LangChain, LlamaIndex, or LangGraph. This is a feature, not an oversight.

1. **Ablation control** — Toggling individual pipeline components (graph, reranker, CRAG) dynamically is far cleaner without static chain abstractions.
2. **Evaluation transparency** — RAGAS requires exact access to intermediate pipeline states (the specific context chunks passed to the LLM). Custom code makes this trivial.
3. **Prompt ownership** — Knowledge graph entity extraction uses hand-tuned prompts. Avoiding `LLMGraphTransformer` means absolute schema control.
4. **Debugging speed** — No unpacking opaque `RunnableSequence` objects. What you write is what runs.

---

## Contributing

Contributions are welcome! Please open an issue to discuss your proposed change before submitting a PR. Make sure to update relevant documentation and add tests where applicable.

---

## License

MIT License — see [LICENSE](LICENSE) for details.