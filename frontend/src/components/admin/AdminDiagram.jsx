import React from 'react';
import { FileText, Cpu, Database, Network, Search, Layers } from 'lucide-react';

const DiagramNode = ({ icon: Icon, title, desc, className = "" }) => (
  <div className={`glass-panel border border-border p-4 rounded-xl flex flex-col items-center text-center w-full ${className}`}>
    <div className="bg-surface-highest p-3 rounded-full mb-3">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h4 className="font-display font-bold text-sm text-text-primary mb-1">{title}</h4>
    <p className="text-xs text-text-secondary font-sans leading-tight">{desc}</p>
  </div>
);

const VerticalLine = ({ h = "h-8" }) => (
  <div className={`w-1 ${h} bg-slate-400/80 mx-auto my-2`} />
);

export default function AdminDiagram() {
  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-surface-dark border border-border rounded-2xl mt-8">
      <div className="flex flex-col items-center">
        
        {/* Step 1 */}
        <div className="w-64">
          <DiagramNode icon={FileText} title="Raw Documents" desc="PDFs & HTML uploaded by user" />
        </div>
        
        <VerticalLine />

        {/* Step 2 */}
        <div className="w-64">
          <DiagramNode icon={Layers} title="Document Parser" desc="OCR + Table Extraction" />
        </div>

        {/* Branching Lines */}
        <div className="w-full max-w-lg flex flex-col items-center">
          <VerticalLine />
          <div className="w-full h-1 bg-slate-400/80" />
          <div className="w-full flex justify-between px-16">
             <div className="w-1 h-6 bg-slate-400/80" />
             <div className="w-1 h-6 bg-slate-400/80" />
             <div className="w-1 h-6 bg-slate-400/80" />
          </div>
        </div>

        {/* Step 3: Chunking */}
        <div className="w-full grid grid-cols-3 gap-4 mb-2">
          <DiagramNode icon={Layers} title="Parent Chunks" desc="Broad context" />
          <DiagramNode icon={Layers} title="Child Chunks" desc="Granular retrieval" />
          <DiagramNode icon={FileText} title="Table Chunks" desc="Structured data" />
        </div>

        {/* Enrichment under Child Chunks */}
        <div className="w-full grid grid-cols-3 gap-4 mb-2">
          <div className="col-start-2 flex flex-col items-center">
             <VerticalLine />
             <DiagramNode icon={Cpu} title="LLM Enrichment" desc="Summaries & Hypo-QA" className="bg-primary/5 border-primary/30" />
          </div>
        </div>

        {/* Converge Lines */}
        <div className="w-full max-w-lg flex flex-col items-center">
          <div className="w-full flex justify-between px-16">
             <div className="w-1 h-6 bg-slate-400/80" />
             <div className="w-1 h-6 bg-slate-400/80" />
             <div className="w-1 h-6 bg-slate-400/80" />
          </div>
          <div className="w-full h-1 bg-slate-400/80" />
          <VerticalLine />
        </div>

        {/* Step 4: Indexing */}
        <div className="w-full max-w-md grid grid-cols-2 gap-6">
          <DiagramNode icon={Database} title="Qdrant DB" desc="Semantic Vector Search" />
          <DiagramNode icon={Network} title="Neo4j Graph" desc="Entity Traversal" />
        </div>

        <VerticalLine />

        {/* Final */}
        <div className="w-64">
          <DiagramNode icon={Search} title="Ready for Query" desc="Hybrid RAG Enabled" className="bg-success/10 border-success/30" />
        </div>

      </div>
    </div>
  );
}
