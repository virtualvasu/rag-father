import os
import sys
import argparse
from ragfather.generation.generator import _llm_call

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

def generate_and_save_system_prompt(use_case: str):
    print(f"Generating system prompt for use-case: '{use_case}'...")
    
    generation_prompt = PROMPT_TEMPLATE.format(use_case=use_case)
    
    try:
        new_system_prompt = _llm_call(prompt=generation_prompt, system_prompt="You are an expert prompt engineer.", max_tokens=1500)
        
        prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "system_prompt.txt")
        with open(prompt_path, "w", encoding="utf-8") as f:
            f.write(new_system_prompt.strip())
            
        print(f"\nSuccessfully generated and saved the new system prompt to {prompt_path}!\n")
        print("--- NEW SYSTEM PROMPT ---")
        print(new_system_prompt.strip())
        print("-------------------------")
        
    except Exception as e:
        print(f"Failed to generate system prompt: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate an optimized system prompt for Ragfather.")
    parser.add_argument("--context", "-c", type=str, required=True, help="The use-case or context for the RAG system.")
    args = parser.parse_args()
    
    generate_and_save_system_prompt(args.context)
