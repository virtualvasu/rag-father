"""
Test the full query pipeline: retrieval → generation.

Usage:
    python scripts/run_query.py "What are the eligibility criteria for startup recognition?"
    python scripts/run_query.py "What is the penalty for late filing?" --source handbook.pdf
    python scripts/run_query.py "..." --no-crag     # skip CRAG check
    python scripts/run_query.py "..." --no-graph    # skip graph expansion
"""

import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

from ragfather.query import answer_query


def main():
    args = sys.argv[1:]

    if not args or args[0].startswith("--"):
        print("Usage: python scripts/run_query.py \"<your question>\" [--source SOURCE] [--no-crag] [--no-graph]")
        sys.exit(1)

    query = args[0]
    filter_source = None
    use_crag = "--no-crag" not in args
    use_graph = "--no-graph" not in args

    if "--source" in args:
        source_idx = args.index("--source")
        if source_idx + 1 < len(args):
            filter_source = args[source_idx + 1]

    print(f"\n{'='*60}")
    print(f"Query: {query}")
    if filter_source:
        print(f"Filter: {filter_source}")
    print(f"{'='*60}\n")

    result = answer_query(
        query=query,
        filter_source=filter_source,
        use_graph=use_graph,
        use_crag=use_crag,
    )

    print("\n" + "="*60)
    print("ANSWER")
    print("="*60)
    print(result["answer"])

    print("\n" + "="*60)
    print("METADATA")
    print("="*60)
    print(f"Provider      : {result['provider']}")
    print(f"Iterations    : {result['iterations']}")
    print(f"CRAG score    : {result['crag_score']:.2f}")
    print(f"Chunks used   : {result['chunks_used']}")
    print(f"Retrieval     : vector={result['retrieval']['vector_hits']} "
          f"bm25={result['retrieval']['bm25_hits']} "
          f"graph={result['retrieval']['graph_hits']}")
    print(f"Citations     : {len(result['citations'])}")

    if result["citations"]:
        print("\nCitations:")
        for c in result["citations"]:
            print(f"  [{c['source']}, {c['section_type']} {c['section_number']}]"
                  f"{' — ' + c['section_title'] if c.get('section_title') else ''}")


if __name__ == "__main__":
    main()
