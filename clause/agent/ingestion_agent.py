import json
import logging
import httpx
from pathlib import Path
from clause.generation.generator import _llm_call

logger = logging.getLogger(__name__)

DATA_RAW_DIR = Path("data/raw")

AGENT_PROMPT_TEMPLATE = """You are an autonomous AI Agent that searches the web and downloads PDF documents for ingestion into a RAG system.
Your objective: {prompt}

CRITICAL RULES FOR PDFs:
If the user asks for a PDF, you MUST find a direct link to a `.pdf` file.
Websites often hide PDFs behind landing pages. DO NOT download the landing page HTML.
To find PDFs via search, always append " filetype:pdf" or " ext:pdf" to your search query!

You have the following tools available:
1. "search_web": Searches the internet. Requires action_input format: {{"query": "your search query filetype:pdf"}}
2. "download_file": Downloads a PDF. Requires action_input format: {{"url": "the direct .pdf url", "filename": "name_of_file.pdf"}}
3. "read_webpage": Reads text and links from a webpage to help find PDF links. DOES NOT SAVE THE FILE. Requires action_input format: {{"url": "the website url"}}
4. "finish": Completes the task. Requires action_input format: {{"message": "summary of what was downloaded"}}

You will be given the observation of your previous action.
You MUST respond with ONLY valid JSON in the following format:
{{
  "thought": "your reasoning here",
  "action": "tool_name",
  "action_input": {{...}}
}}

Past Actions and Observations:
{history}
"""

def search_web(query: str, max_results: int = 5) -> str:
    """Searches the web using DuckDuckGo."""
    try:
        from ddgs import DDGS
        results = DDGS().text(query, max_results=max_results)
        if not results:
            return "No results found."
        
        formatted = []
        for r in results:
            formatted.append(f"Title: {r.get('title')}\nURL: {r.get('href')}\nSnippet: {r.get('body')}")
        return "\n\n".join(formatted)
    except Exception as e:
        return f"Error searching web: {str(e)}"

def download_file(url: str, filename: str) -> str:
    """Downloads a file to data/raw/."""
    try:
        DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
        # Ensure filename is safe and ends with pdf
        if not filename.endswith('.pdf'):
            filename += '.pdf'
        safe_filename = "".join([c for c in filename if c.isalpha() or c.isdigit() or c in (' ', '.', '-', '_')]).rstrip()
        file_path = DATA_RAW_DIR / safe_filename
        
        with httpx.Client(timeout=30, follow_redirects=True) as client:
            response = client.get(url)
            response.raise_for_status()
            
            content_type = response.headers.get("Content-Type", "").lower()
            if "text/html" in content_type:
                return f"Error: The URL '{url}' returned an HTML website, NOT a PDF! Do not save this. You must find a direct link to the actual .pdf file."
            
            with open(file_path, 'wb') as f:
                f.write(response.content)
                
        return f"Successfully downloaded PDF to {file_path}"
    except Exception as e:
        return f"Error downloading file: {str(e)}"

def read_webpage(url: str) -> str:
    """Reads a webpage and extracts text and links without saving it."""
    try:
        from bs4 import BeautifulSoup
        from urllib.parse import urljoin
        with httpx.Client(timeout=30, follow_redirects=True) as client:
            response = client.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, "html.parser")
            # Extract links
            links = []
            for a in soup.find_all('a', href=True):
                href = urljoin(url, a['href'])
                if href.lower().endswith('.pdf'):
                    links.append(f"PDF LINK: {href}")
                elif len(links) < 20: # sample some links
                    links.append(f"Link: {href}")
            
            # Extract text
            text = soup.get_text(separator=' ', strip=True)
            text_preview = text[:1500] + "...(truncated)" if len(text) > 1500 else text
            
            output = f"--- TEXT PREVIEW ---\n{text_preview}\n\n--- LINKS FOUND ---\n" + "\n".join(links[:50])
            
            if len(links) == 0 and len(text) < 200:
                output += "\n\nWARNING: Webpage appears empty or client-side rendered. No useful links found. DO NOT RETRY THIS URL. Use search_web to find a direct .pdf link instead."
                
            return output
    except Exception as e:
        return f"Error reading webpage: {str(e)}"

def run_agent(prompt: str, log_callback=None):
    """Runs the ReAct agent loop."""
    max_steps = 10
    history = []
    
    def log_msg(msg):
        logger.info(msg)
        if log_callback:
            log_callback(msg)
            
    log_msg(f"Initializing agent with prompt: {prompt}")
    
    for step in range(max_steps):
        history_text = "\n".join(history) if history else "None."
        agent_prompt = AGENT_PROMPT_TEMPLATE.format(prompt=prompt, history=history_text)
        
        try:
            response = _llm_call(agent_prompt, max_tokens=1000)
            
            # Cleanup Markdown wrapper if any
            cleaned = response.strip()
            if cleaned.startswith("```json"): cleaned = cleaned[7:]
            if cleaned.startswith("```"): cleaned = cleaned[3:]
            if cleaned.endswith("```"): cleaned = cleaned[:-3]
            
            parsed = json.loads(cleaned.strip(), strict=False)
            
            thought = parsed.get("thought", "")
            action = parsed.get("action", "finish")
            action_input = parsed.get("action_input", {})
            
            log_msg(f"Thought: {thought}")
            log_msg(f"Action: {action}({json.dumps(action_input)})")
            
            history.append(f"Thought: {thought}")
            history.append(f"Action: {action}")
            history.append(f"Action Input: {json.dumps(action_input)}")
            
            if action == "finish":
                msg = action_input.get("message", "Task completed.")
                log_msg(f"Finished: {msg}")
                break
                
            elif action == "search_web":
                query = action_input.get("query", "")
                observation = search_web(query)
                # truncate observation to avoid token limits
                if len(observation) > 2000:
                    observation = observation[:2000] + "...(truncated)"
                history.append(f"Observation: {observation}")
                log_msg(f"Observation: Found {len(observation)} chars of search results.")
                
            elif action == "download_file":
                url = action_input.get("url", "")
                filename = action_input.get("filename", "")
                observation = download_file(url, filename)
                history.append(f"Observation: {observation}")
                log_msg(f"Observation: {observation}")
                
            elif action == "read_webpage":
                url = action_input.get("url", "")
                observation = read_webpage(url)
                history.append(f"Observation: {observation}")
                log_msg(f"Observation: Found {len(observation)} chars of webpage content.")
                
            else:
                observation = f"Unknown action: {action}"
                history.append(f"Observation: {observation}")
                log_msg(observation)
                
        except Exception as e:
            log_msg(f"Error during agent execution: {str(e)}")
            history.append(f"Observation: Error occurred - {str(e)}. Please correct your format or action.")
            
    log_msg("Agent loop terminated.")
    return True
