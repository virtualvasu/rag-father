import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Network, Cpu, Settings, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import AdminDiagram from './AdminDiagram';

export default function AdminIntro({ onContinue }) {
  const [showDiagram, setShowDiagram] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    exit: { opacity: 0, y: -50, transition: { duration: 0.4, ease: "easeInOut" } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-4xl mx-auto px-6 py-12"
    >
      <motion.div variants={itemVariants} className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-text-primary mb-4">
          Welcome to the <span className="text-primary">Pipeline</span>
        </h1>
        <p className="text-lg text-text-secondary font-sans max-w-2xl mx-auto">
          Ragfather is an end-to-end RAG creation platform. Here, you will build a completely local, multi-index knowledge base without relying on black-box abstractions.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        <div className="glass-panel p-6 rounded-2xl flex gap-4">
          <div className="bg-primary/20 p-3 rounded-xl h-fit">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-text-primary text-lg mb-2">1. Ingestion & Indexing</h3>
            <p className="text-sm text-text-secondary font-sans">
              Upload your raw PDFs. We will chunk them, extract tables, and generate semantic embeddings using a local BGE model into a high-performance Qdrant vector database.
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex gap-4">
          <div className="bg-primary/20 p-3 rounded-xl h-fit">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-text-primary text-lg mb-2">2. LLM Enrichment</h3>
            <p className="text-sm text-text-secondary font-sans">
              By default, an LLM will read every chunk and generate a contextual summary and hypothetical questions to vastly improve retrieval accuracy.
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex gap-4">
          <div className="bg-primary/20 p-3 rounded-xl h-fit">
            <Network className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-text-primary text-lg mb-2">3. Knowledge Graph</h3>
            <p className="text-sm text-text-secondary font-sans">
              We extract named entities and relationships from your text to build a Neo4j Knowledge Graph, enabling multi-hop reasoning over your documents.
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex gap-4">
          <div className="bg-primary/20 p-3 rounded-xl h-fit">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-text-primary text-lg mb-2">4. Total Control</h3>
            <p className="text-sm text-text-secondary font-sans">
              You dictate the parameters. Toggle cross-encoder reranking, graph traversal depth, and chunk sizes to perfectly tune your specific dataset.
            </p>
          </div>
        </div>

      </motion.div>

      <motion.div variants={itemVariants} className="flex justify-center mb-12">
        <button 
          onClick={() => setShowDiagram(!showDiagram)}
          className="flex items-center gap-2 px-6 py-3 bg-surface border border-border rounded-full text-text-secondary hover:text-text-primary hover:border-primary transition-all font-sans text-sm font-medium"
        >
          {showDiagram ? "Hide Architecture" : "Deep Dive: View Architecture"}
          {showDiagram ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </motion.div>

      <AnimatePresence>
        {showDiagram && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-12"
          >
            <AdminDiagram />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button 
          onClick={onContinue}
          className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-sans font-bold rounded-xl hover:bg-primary-light transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2"
        >
          Start Building <ArrowRight className="w-5 h-5" />
        </button>
        <button 
          onClick={onContinue}
          className="w-full sm:w-auto px-8 py-4 bg-transparent text-text-secondary hover:text-text-primary font-sans font-medium transition-all"
        >
          Skip Intro
        </button>
      </motion.div>
    </motion.div>
  );
}
