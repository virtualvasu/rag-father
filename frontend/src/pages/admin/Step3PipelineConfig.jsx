import React from 'react';

const Tooltip = ({ text }) => (
  <div className="relative group inline-block ml-2">
    <div className="flex items-center justify-center w-4 h-4 rounded-full border border-primary text-primary text-[10px] font-bold cursor-help">i</div>
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-surface border border-outline-variant text-on-surface-variant text-xs font-mono shadow-lg z-50 rounded-none pointer-events-none">
      {text}
    </div>
  </div>
);

const Step3PipelineConfig = ({
  pipelineConfig,
  handleConfigChange
}) => {
  return (
    <div className="border border-outline-variant rounded-none p-6 bg-surface-container">
      <h2 className="text-headline-md font-headline-md mb-4 text-secondary">3. Pipeline Configuration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-mono text-sm text-primary uppercase">Provider Settings</h3>
          <div>
            <label className="block text-xs font-mono text-on-surface-variant mb-1">Enrichment Provider</label>
            <select name="enrichment_provider" value={pipelineConfig.enrichment_provider} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary">
              <option value="ollama">Ollama (Local - Free)</option>
              <option value="claude">Claude (Cloud - Paid)</option>
              <option value="custom">Custom (OpenAI Compatible)</option>
              <option value="groq">Groq (Ultra-Fast Cloud)</option>
            </select>
          </div>
          {pipelineConfig.enrichment_provider === 'claude' && (
            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-1">Anthropic API Key</label>
              <input type="password" name="anthropic_api_key" value={pipelineConfig.anthropic_api_key} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="sk-ant-..." />
            </div>
          )}
          <div className="pt-2">
            <label className="block text-xs font-mono text-on-surface-variant mb-1">Generation Provider (For Querying)</label>
            <select name="generation_provider" value={pipelineConfig.generation_provider} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary">
              <option value="ollama">Ollama (Local - Free)</option>
              <option value="claude">Claude (Cloud - Paid)</option>
              <option value="custom">Custom (OpenAI Compatible)</option>
              <option value="groq">Groq (Ultra-Fast Cloud)</option>
            </select>
          </div>
          {pipelineConfig.generation_provider === 'claude' && pipelineConfig.enrichment_provider !== 'claude' && (
            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-1">Anthropic API Key</label>
              <input type="password" name="anthropic_api_key" value={pipelineConfig.anthropic_api_key} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="sk-ant-..." />
            </div>
          )}
          {(pipelineConfig.enrichment_provider === 'custom' || pipelineConfig.generation_provider === 'custom') && (
            <div className="space-y-2 p-3 border border-outline-variant bg-surface-variant/30">
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1">Custom Base URL</label>
                <input type="text" name="custom_llm_base_url" value={pipelineConfig.custom_llm_base_url} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="https://api.groq.com/openai/v1" />
              </div>
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1">Custom Model Name</label>
                <input type="text" name="custom_llm_model" value={pipelineConfig.custom_llm_model} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="llama3-70b-8192" />
              </div>
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1">Custom API Key</label>
                <input type="password" name="custom_llm_api_key" value={pipelineConfig.custom_llm_api_key} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="gsk_..." />
              </div>
            </div>
          )}
          {(pipelineConfig.enrichment_provider === 'groq' || pipelineConfig.generation_provider === 'groq') && (
            <div className="space-y-2 p-3 border border-outline-variant bg-surface-variant/30">
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1">Groq API Key</label>
                <input type="password" name="custom_llm_api_key" value={pipelineConfig.custom_llm_api_key} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="gsk_..." />
              </div>
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1">Groq Model Name</label>
                <input type="text" name="custom_llm_model" value={pipelineConfig.custom_llm_model} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="llama3-70b-8192" />
              </div>
            </div>
          )}
          {pipelineConfig.enrichment_provider === 'ollama' && pipelineConfig.generation_provider === 'ollama' && (
            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-1">Ollama Model</label>
              <input type="text" name="ollama_model" value={pipelineConfig.ollama_model} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="qwen2.5:7b" />
            </div>
          )}
          <div className="pt-2">
            <label className="block text-xs font-mono text-on-surface-variant mb-1">Embedding Provider</label>
            <select name="embedding_provider" value={pipelineConfig.embedding_provider} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary">
              <option value="local">Local (BGE-Large-v1.5)</option>
              <option value="openai">OpenAI (text-embedding-3-large)</option>
            </select>
          </div>
          {pipelineConfig.embedding_provider === 'openai' && (
            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-1">OpenAI API Key</label>
              <input type="password" name="openai_api_key" value={pipelineConfig.openai_api_key} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="sk-proj-..." />
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <h3 className="font-mono text-sm text-primary uppercase">Advanced Tuning</h3>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="wipe_data_on_pipeline_run" name="wipe_data_on_pipeline_run" checked={pipelineConfig.wipe_data_on_pipeline_run} onChange={handleConfigChange} className="w-4 h-4 accent-primary" />
            <div className="flex items-center">
              <label htmlFor="wipe_data_on_pipeline_run" className="text-sm font-mono text-on-surface cursor-pointer">Wipe Data on Run</label>
              <Tooltip text="Clears all previously stored documents and vectors before processing the new batch. Uncheck to append to the existing dataset." />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="skip_enrichment" name="skip_enrichment" checked={pipelineConfig.skip_enrichment} onChange={handleConfigChange} className="w-4 h-4 accent-primary" />
            <div className="flex items-center">
              <label htmlFor="skip_enrichment" className="text-sm font-mono text-on-surface cursor-pointer">Skip Enrichment</label>
              <Tooltip text="Bypasses the LLM enrichment phase (which generates summaries and hypothetical questions). This significantly speeds up ingestion but reduces context richness for retrieval." />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="use_knowledge_graph" name="use_knowledge_graph" checked={pipelineConfig.use_knowledge_graph} onChange={handleConfigChange} className="w-4 h-4 accent-primary" />
            <div className="flex items-center">
              <label htmlFor="use_knowledge_graph" className="text-sm font-mono text-on-surface cursor-pointer">Use Knowledge Graph</label>
              <Tooltip text="Extracts entities and relationships from documents into Neo4j, enabling multi-hop reasoning across connected topics." />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input type="checkbox" id="use_cross_encoder_reranker" name="use_cross_encoder_reranker" checked={pipelineConfig.use_cross_encoder_reranker} onChange={handleConfigChange} className="w-4 h-4 accent-primary" />
            <div className="flex items-center">
              <label htmlFor="use_cross_encoder_reranker" className="text-sm font-mono text-on-surface cursor-pointer">Use Cross-Encoder Reranker</label>
              <Tooltip text="Adds a second pass during retrieval where an advanced model strictly re-scores the initial results. Slower but greatly improves answer relevance." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-1">Child Chunk Size</label>
              <input type="number" name="child_chunk_size" value={pipelineConfig.child_chunk_size} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-1">Parent Chunk Size</label>
              <input type="number" name="parent_chunk_size" value={pipelineConfig.parent_chunk_size} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-1">Top-K Retrieval</label>
              <input type="number" name="top_k_retrieval" value={pipelineConfig.top_k_retrieval} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-1">Top-K Rerank</label>
              <input type="number" name="top_k_rerank" value={pipelineConfig.top_k_rerank} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-mono text-on-surface-variant mb-1">Graph Search Depth (Hops)</label>
              <input type="number" name="graph_search_hops" min="1" max="3" value={pipelineConfig.graph_search_hops} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3PipelineConfig;
