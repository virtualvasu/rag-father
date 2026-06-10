import React from 'react';
import ToggleCard from '../../components/ToggleCard';
import { Database, Network, Search, Eraser } from 'lucide-react';

const Tooltip = ({ text }) => (
  <div className="relative group inline-block ml-2">
    <div className="flex items-center justify-center w-4 h-4 rounded-full border border-primary text-primary text-[10px] font-bold cursor-help">i</div>
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-surface-highest border border-border text-text-secondary text-xs font-sans shadow-lg z-50 rounded pointer-events-none">
      {text}
    </div>
  </div>
);

const Step3PipelineConfig = ({
  pipelineConfig,
  handleConfigChange
}) => {
  return (
    <div className="border border-border rounded-2xl p-6 bg-surface-high">
      <h2 className="text-xl font-display font-semibold mb-6 text-text-primary">Pipeline Configuration</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Provider Settings */}
        <div className="space-y-6">
          <h3 className="font-mono text-sm text-primary uppercase tracking-wider font-semibold border-b border-border pb-2">Provider Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Enrichment Provider</label>
              <select name="enrichment_provider" value={pipelineConfig.enrichment_provider} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer appearance-none">
                <option value="ollama">Ollama (Local - Free)</option>
                <option value="claude">Claude (Cloud - Paid)</option>
                <option value="custom">Custom (OpenAI Compatible)</option>
                <option value="groq">Groq (Ultra-Fast Cloud)</option>
              </select>
            </div>

            {pipelineConfig.enrichment_provider === 'claude' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Anthropic API Key</label>
                <input type="password" name="anthropic_api_key" value={pipelineConfig.anthropic_api_key} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" placeholder="sk-ant-..." />
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Generation Provider</label>
              <select name="generation_provider" value={pipelineConfig.generation_provider} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer appearance-none">
                <option value="ollama">Ollama (Local - Free)</option>
                <option value="claude">Claude (Cloud - Paid)</option>
                <option value="custom">Custom (OpenAI Compatible)</option>
                <option value="groq">Groq (Ultra-Fast Cloud)</option>
              </select>
            </div>

            {pipelineConfig.generation_provider === 'claude' && pipelineConfig.enrichment_provider !== 'claude' && (
              <div>
                <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Anthropic API Key</label>
                <input type="password" name="anthropic_api_key" value={pipelineConfig.anthropic_api_key} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" placeholder="sk-ant-..." />
              </div>
            )}

            {(pipelineConfig.enrichment_provider === 'custom' || pipelineConfig.generation_provider === 'custom') && (
              <div className="space-y-4 p-4 border border-border rounded-xl bg-surface-highest/50">
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Custom Base URL</label>
                  <input type="text" name="custom_llm_base_url" value={pipelineConfig.custom_llm_base_url} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" placeholder="https://api.groq.com/openai/v1" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Custom Model Name</label>
                  <input type="text" name="custom_llm_model" value={pipelineConfig.custom_llm_model} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" placeholder="llama3-70b-8192" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Custom API Key</label>
                  <input type="password" name="custom_llm_api_key" value={pipelineConfig.custom_llm_api_key} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" placeholder="gsk_..." />
                </div>
              </div>
            )}

            {(pipelineConfig.enrichment_provider === 'groq' || pipelineConfig.generation_provider === 'groq') && (
              <div className="space-y-4 p-4 border border-border rounded-xl bg-surface-highest/50">
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Groq API Key</label>
                  <input type="password" name="custom_llm_api_key" value={pipelineConfig.custom_llm_api_key} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" placeholder="gsk_..." />
                </div>
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Groq Model Name</label>
                  <input type="text" name="custom_llm_model" value={pipelineConfig.custom_llm_model} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" placeholder="llama3-70b-8192" />
                </div>
              </div>
            )}

            {pipelineConfig.enrichment_provider === 'ollama' && pipelineConfig.generation_provider === 'ollama' && (
              <div>
                <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Ollama Model</label>
                <input type="text" name="ollama_model" value={pipelineConfig.ollama_model} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" placeholder="qwen2.5:7b" />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Embedding Provider</label>
              <select name="embedding_provider" value={pipelineConfig.embedding_provider} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer appearance-none">
                <option value="local">Local (BGE-Large-v1.5)</option>
                <option value="openai">OpenAI (text-embedding-3-large)</option>
              </select>
            </div>

            {pipelineConfig.embedding_provider === 'openai' && (
              <div>
                <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">OpenAI API Key</label>
                <input type="password" name="openai_api_key" value={pipelineConfig.openai_api_key} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" placeholder="sk-proj-..." />
              </div>
            )}
          </div>
        </div>
        
        {/* Advanced Tuning */}
        <div className="space-y-6">
          <h3 className="font-mono text-sm text-primary uppercase tracking-wider font-semibold border-b border-border pb-2">Pipeline Architecture</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <ToggleCard
              id="wipe_data_on_pipeline_run"
              title="Wipe Data on Run"
              description="Clears all previously stored documents and vectors before processing the new batch. Uncheck to append to the existing dataset."
              icon={Eraser}
              checked={pipelineConfig.wipe_data_on_pipeline_run}
              onChange={handleConfigChange}
            />
            
            <ToggleCard
              id="skip_enrichment"
              title="Skip Enrichment"
              description="Bypasses the LLM enrichment phase (which generates summaries and hypothetical questions). This significantly speeds up ingestion but reduces context richness for retrieval."
              icon={Database}
              checked={pipelineConfig.skip_enrichment}
              onChange={handleConfigChange}
            />

            <ToggleCard
              id="use_knowledge_graph"
              title="Use Knowledge Graph"
              description="Extracts entities and relationships from documents into Neo4j, enabling multi-hop reasoning across connected topics."
              icon={Network}
              checked={pipelineConfig.use_knowledge_graph}
              onChange={handleConfigChange}
            />

            <ToggleCard
              id="use_cross_encoder_reranker"
              title="Cross-Encoder Reranker"
              description="Adds a second pass during retrieval where an advanced model strictly re-scores the initial results. Slower but greatly improves answer relevance."
              icon={Search}
              checked={pipelineConfig.use_cross_encoder_reranker}
              onChange={handleConfigChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Child Chunk Size <Tooltip text="Size in tokens of the smallest searchable units." /></label>
              <input type="number" name="child_chunk_size" value={pipelineConfig.child_chunk_size} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Parent Chunk Size <Tooltip text="Size in tokens of the larger context blocks returned to the LLM." /></label>
              <input type="number" name="parent_chunk_size" value={pipelineConfig.parent_chunk_size} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Top-K Retrieval <Tooltip text="Number of dense vector results to retrieve initially." /></label>
              <input type="number" name="top_k_retrieval" value={pipelineConfig.top_k_retrieval} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Top-K Rerank <Tooltip text="Number of final results passed to the LLM after re-scoring." /></label>
              <input type="number" name="top_k_rerank" value={pipelineConfig.top_k_rerank} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Graph Search Depth (Hops) <Tooltip text="How many relationships out to search in the Knowledge Graph." /></label>
              <input type="number" name="graph_search_hops" min="1" max="3" value={pipelineConfig.graph_search_hops} onChange={handleConfigChange} className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3PipelineConfig;
