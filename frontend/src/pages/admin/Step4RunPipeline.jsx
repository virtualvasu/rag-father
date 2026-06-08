import React from 'react';
import TerminalOutput from '../../components/TerminalOutput';

const Step4RunPipeline = ({
  pipelineStatus,
  pipelineMessage,
  pipelineResult,
  pipelineLogs,
  startPipeline,
  handleReset,
  pipelineConfig,
  systemPrompt
}) => {
  return (
    <div className="border border-outline-variant rounded-none p-6 bg-surface-container">
      <h2 className="text-headline-md font-headline-md mb-4 text-secondary">4. Processing Pipeline</h2>
      
      <div className="space-y-6">
        <p className="text-body-sm text-on-surface-variant">
          Run the ingestion and indexing pipeline. This will chunk the uploaded documents, enrich them, and populate the Qdrant and Neo4j databases.
        </p>

        {/* Configuration Review Section */}
        <div className="mb-6 p-4 border border-outline-variant bg-surface-variant/20">
          <h3 className="font-mono text-sm text-primary uppercase mb-3">Configuration Review</h3>
          <div className="grid grid-cols-2 gap-4 font-mono text-xs text-on-surface">
            <div>
              <span className="text-on-surface-variant">Enrichment Provider:</span> {pipelineConfig.enrichment_provider}
            </div>
            <div>
              <span className="text-on-surface-variant">Generation Provider:</span> {pipelineConfig.generation_provider}
            </div>
            <div>
              <span className="text-on-surface-variant">Embedding Provider:</span> {pipelineConfig.embedding_provider}
            </div>
            <div>
              <span className="text-on-surface-variant">System Prompt:</span> {systemPrompt ? `Set (${systemPrompt.length} chars)` : "None"}
            </div>
            <div>
              <span className="text-on-surface-variant">Knowledge Graph:</span> {pipelineConfig.use_knowledge_graph ? "Enabled" : "Disabled"}
            </div>
            <div>
              <span className="text-on-surface-variant">Cross-Encoder:</span> {pipelineConfig.use_cross_encoder_reranker ? "Enabled" : "Disabled"}
            </div>
            <div>
              <span className="text-on-surface-variant">Graph Hops:</span> {pipelineConfig.graph_search_hops}
            </div>
            <div>
              <span className="text-on-surface-variant">Top-K Retrieval:</span> {pipelineConfig.top_k_retrieval}
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={startPipeline}
            disabled={pipelineStatus === 'running'}
            className="flex-1 py-3 bg-secondary text-on-secondary font-mono text-sm uppercase hover:bg-secondary-fixed-dim disabled:opacity-50 transition-all flex justify-center items-center gap-2"
          >
            {pipelineStatus === 'running' && (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
            )}
            {pipelineStatus === 'running' ? 'PIPELINE RUNNING' : 'START PIPELINE'}
          </button>

          <button 
            onClick={handleReset}
            disabled={pipelineStatus === 'running'}
            className="flex-1 py-3 bg-error text-on-error font-mono text-sm uppercase hover:bg-[#ff5449] disabled:opacity-50 transition-all"
          >
            RESET SYSTEM
          </button>
        </div>

        {/* Status Display */}
        <div className="bg-[#0c1324] dark:bg-[#060908] border border-outline-variant p-4">
          <div className="font-mono text-xs text-white space-y-2">
            <p>&gt; SYSTEM STATUS: {pipelineStatus.toUpperCase()}</p>
            {pipelineMessage && <p>&gt; {pipelineMessage}</p>}
            
            {pipelineResult && (
              <div className="mt-4 pt-4 border-t border-outline-variant text-tertiary">
                <p className="text-secondary mb-2">INDEXING RESULTS:</p>
                <ul className="space-y-1">
                  <li>Qdrant Vectors: {pipelineResult.indexing.qdrant_points}</li>
                  <li>BM25 Chunks: {pipelineResult.indexing.bm25_chunks}</li>
                  <li>Neo4j Nodes: {pipelineResult.indexing.neo4j_nodes}</li>
                  <li>Neo4j Edges: {pipelineResult.indexing.neo4j_edges}</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Streaming Logs */}
        {(pipelineLogs.length > 0 || pipelineStatus === 'running') && (
          <div className="mt-4">
            <TerminalOutput logs={pipelineLogs} isRunning={pipelineStatus === 'running'} height="h-64" />
          </div>
        )}

        {pipelineStatus === 'completed' && (
          <div className="mt-4 pt-4 border-t border-outline-variant flex justify-end">
            <button 
              onClick={() => window.location.href = '/'}
              className="py-3 px-8 bg-primary text-on-primary font-mono text-sm uppercase hover:bg-primary-fixed-dim transition-all shadow-md flex items-center gap-2"
            >
              LAUNCH CHAT INTERFACE
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step4RunPipeline;
