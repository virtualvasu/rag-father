import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Cpu, Database, Network, Search, FileSignature, Layers } from 'lucide-react';

const stages = [
  { id: 'ingest', title: 'Ingestion', icon: FileText, desc: 'Parse and chunk diverse document formats into processable segments.' },
  { id: 'enrich', title: 'Enrichment', icon: Cpu, desc: 'LLM generates hypothetical questions, summaries, and extracts entities.' },
  { id: 'index', title: 'Indexing', icon: Database, desc: 'Store dense vectors in Qdrant, sparse in BM25, and relationships in Neo4j.' },
  { id: 'retrieve', title: 'Retrieval', icon: Network, desc: 'Hybrid search with Reciprocal Rank Fusion + Knowledge Graph traversal.' },
  { id: 'rerank', title: 'Reranking', icon: Layers, desc: 'Cross-encoder precisely re-scores chunks against the user query.' },
  { id: 'generate', title: 'Generation', icon: FileSignature, desc: 'Final LLM synthesis with CRAG hallucination checks and exact citations.' },
];

const PipelineVisualizer = () => {
  const [activeStage, setActiveStage] = useState(null);

  return (
    <div className="w-full max-w-5xl mx-auto py-12">
      {/* Pipeline Flow Container */}
      <div className="relative flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
        
        {/* Animated Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2 z-0 overflow-hidden rounded-full">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent animate-flow" />
        </div>

        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.id;
          
          return (
            <motion.div 
              key={stage.id}
              className="relative z-10 w-full md:w-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Node Card */}
              <button
                onClick={() => setActiveStage(isActive ? null : stage.id)}
                className={`
                  w-full md:w-16 md:h-16 flex items-center justify-center p-4 md:p-0
                  rounded-xl md:rounded-2xl transition-all duration-300
                  ${isActive 
                    ? 'bg-primary text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] scale-110' 
                    : 'bg-surface-high border border-border text-text-secondary hover:text-primary hover:border-primary hover:bg-surface-highest'
                  }
                `}
              >
                <div className="flex md:hidden items-center gap-3 w-full">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-display font-semibold text-sm">{stage.title}</span>
                </div>
                <Icon className="hidden md:block w-6 h-6" />
              </button>

              {/* Node Label (Desktop only) */}
              <div className="hidden md:block absolute -bottom-8 left-1/2 -translate-x-1/2 w-24 text-center">
                <span className={`font-display text-xs transition-colors duration-300 ${isActive ? 'text-primary font-bold' : 'text-text-muted'}`}>
                  {stage.title}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Expandable Details Section */}
      <div className="mt-12 md:mt-24 min-h-[120px]">
        <AnimatePresence mode="wait">
          {activeStage ? (
            <motion.div
              key={activeStage}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-surface-high border border-border rounded-2xl p-6 md:p-8 max-w-2xl mx-auto shadow-xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {React.createElement(stages.find(s => s.id === activeStage).icon, { className: "w-6 h-6" })}
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
                    {stages.find(s => s.id === activeStage).title}
                  </h3>
                  <p className="font-sans text-text-secondary leading-relaxed">
                    {stages.find(s => s.id === activeStage).desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <p className="text-text-muted font-mono text-sm uppercase tracking-widest text-center">
                Select a stage to view details
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PipelineVisualizer;
