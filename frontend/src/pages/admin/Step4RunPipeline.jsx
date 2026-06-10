import React from 'react';
import TerminalOutput from '../../components/TerminalOutput';
import { Play, RotateCcw, Activity, CheckCircle2, ChevronRight, BarChart3, MessageSquare, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <div className="border border-border rounded-2xl p-6 md:p-8 bg-surface-high shadow-lg relative overflow-hidden">
      
      <h2 className="text-xl font-display font-semibold mb-6 text-text-primary flex items-center gap-2 relative z-10">
        <Activity className="w-5 h-5 text-primary" />
        Processing Pipeline
      </h2>
      
      <div className="space-y-8 relative z-10">
        <p className="font-sans text-sm text-text-secondary leading-relaxed">
          Run the ingestion and indexing pipeline. This will chunk the uploaded documents, enrich them, and populate the Qdrant and Neo4j databases.
        </p>

        {/* Configuration Review Section */}
        <div className="p-5 border border-border rounded-xl bg-surface-highest/50">
          <h3 className="font-sans text-sm font-semibold text-text-primary mb-4 flex items-center gap-2 border-b border-border pb-2">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            Configuration Review
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-sm">
            <div>
              <span className="block text-xs font-mono text-text-muted uppercase mb-1">Enrichment</span>
              <span className="font-sans font-medium text-text-primary">{pipelineConfig.enrichment_provider}</span>
            </div>
            <div>
              <span className="block text-xs font-mono text-text-muted uppercase mb-1">Generation</span>
              <span className="font-sans font-medium text-text-primary">{pipelineConfig.generation_provider}</span>
            </div>
            <div>
              <span className="block text-xs font-mono text-text-muted uppercase mb-1">Embedding</span>
              <span className="font-sans font-medium text-text-primary">{pipelineConfig.embedding_provider}</span>
            </div>
            <div>
              <span className="block text-xs font-mono text-text-muted uppercase mb-1">Prompt</span>
              <span className="font-sans font-medium text-text-primary">{systemPrompt ? 'Configured' : 'Default'}</span>
            </div>
            <div>
              <span className="block text-xs font-mono text-text-muted uppercase mb-1">Knowledge Graph</span>
              <span className={`font-sans font-medium ${pipelineConfig.use_knowledge_graph ? 'text-accent' : 'text-text-secondary'}`}>
                {pipelineConfig.use_knowledge_graph ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div>
              <span className="block text-xs font-mono text-text-muted uppercase mb-1">Cross-Encoder</span>
              <span className={`font-sans font-medium ${pipelineConfig.use_cross_encoder_reranker ? 'text-accent' : 'text-text-secondary'}`}>
                {pipelineConfig.use_cross_encoder_reranker ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div>
              <span className="block text-xs font-mono text-text-muted uppercase mb-1">Graph Hops</span>
              <span className="font-mono text-text-primary">{pipelineConfig.graph_search_hops}</span>
            </div>
            <div>
              <span className="block text-xs font-mono text-text-muted uppercase mb-1">Top-K</span>
              <span className="font-mono text-text-primary">{pipelineConfig.top_k_retrieval}</span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={startPipeline}
            disabled={pipelineStatus === 'running'}
            className="flex-1 py-4 bg-primary text-white font-sans text-sm font-semibold rounded-xl hover:bg-primary-light disabled:opacity-50 transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          >
            {pipelineStatus === 'running' ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                PIPELINE RUNNING...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                START PIPELINE
              </>
            )}
          </button>

          <button 
            onClick={handleReset}
            disabled={pipelineStatus === 'running'}
            className="flex-1 py-4 bg-surface border border-error text-error font-sans text-sm font-semibold rounded-xl hover:bg-error/10 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            RESET SYSTEM
          </button>
        </div>

        {/* Status Display */}
        <div className="bg-surface-dark border border-border rounded-xl p-5 shadow-inner overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>
          <div className="font-mono text-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-text-muted">SYSTEM STATUS:</span>
              <span className={`font-bold ${
                pipelineStatus === 'running' ? 'text-secondary animate-pulse' : 
                pipelineStatus === 'completed' ? 'text-accent' : 
                pipelineStatus === 'failed' ? 'text-error' : 
                'text-primary'
              }`}>
                {pipelineStatus.toUpperCase()}
              </span>
            </div>
            
            {pipelineMessage && (
              <div className="text-text-primary flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                <span>{pipelineMessage}</span>
              </div>
            )}
            
            {pipelineResult && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-accent text-xs uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                  <Database className="w-3 h-3" />
                  Indexing Results
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface p-3 rounded border border-border">
                    <span className="block text-[10px] text-text-muted uppercase mb-1">Qdrant Vectors</span>
                    <span className="text-lg font-bold text-text-primary">{pipelineResult.indexing.qdrant_points}</span>
                  </div>
                  <div className="bg-surface p-3 rounded border border-border">
                    <span className="block text-[10px] text-text-muted uppercase mb-1">BM25 Chunks</span>
                    <span className="text-lg font-bold text-text-primary">{pipelineResult.indexing.bm25_chunks}</span>
                  </div>
                  <div className="bg-surface p-3 rounded border border-border">
                    <span className="block text-[10px] text-text-muted uppercase mb-1">Neo4j Nodes</span>
                    <span className="text-lg font-bold text-text-primary">{pipelineResult.indexing.neo4j_nodes}</span>
                  </div>
                  <div className="bg-surface p-3 rounded border border-border">
                    <span className="block text-[10px] text-text-muted uppercase mb-1">Neo4j Edges</span>
                    <span className="text-lg font-bold text-text-primary">{pipelineResult.indexing.neo4j_edges}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Streaming Logs */}
        {(pipelineLogs.length > 0 || pipelineStatus === 'running') && (
          <div className="mt-4 rounded-xl overflow-hidden border border-border shadow-lg">
            <TerminalOutput logs={pipelineLogs} isRunning={pipelineStatus === 'running'} height="h-64" />
          </div>
        )}

        {pipelineStatus === 'completed' && (
          <div className="mt-8 p-6 bg-surface-highest border border-primary/30 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4 border-2 border-primary">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-display font-bold text-text-primary mb-2">Pipeline Complete</h3>
            <p className="text-sm font-sans text-text-secondary mb-6">
              Documents have been successfully indexed and enriched.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/evaluate"
                className="py-3 px-6 bg-surface-high border border-border text-text-primary font-sans text-sm font-semibold rounded-xl hover:border-primary transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <BarChart3 className="w-4 h-4" />
                RUN EVALUATION
              </Link>
              <Link 
                to="/chat"
                className="py-3 px-8 bg-primary text-white font-sans text-sm font-semibold rounded-xl hover:bg-primary-light transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                <MessageSquare className="w-4 h-4" />
                LAUNCH CHAT
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step4RunPipeline;
