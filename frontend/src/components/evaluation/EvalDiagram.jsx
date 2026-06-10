import React from 'react';
import { FileText, Cpu, Scale, CheckCircle2, History } from 'lucide-react';

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

export default function EvalDiagram() {
  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-surface-dark border border-border rounded-2xl mt-8">
      <div className="flex flex-col items-center">
        
        {/* Step 1 */}
        <div className="w-64">
          <DiagramNode icon={FileText} title="Ingested Documents" desc="Source truth from your DB" />
        </div>
        
        <VerticalLine />

        {/* Step 2 */}
        <div className="w-64">
          <DiagramNode icon={Cpu} title="Synthetic Generator" desc="LLM auto-generates QA pairs" className="bg-primary/5 border-primary/30" />
        </div>

        {/* Branch to Variants */}
        <div className="w-full max-w-2xl flex flex-col items-center">
          <VerticalLine />
          <div className="w-full h-1 bg-slate-400/80" />
          <div className="w-full flex justify-between px-16">
             <div className="w-1 h-6 bg-slate-400/80" />
             <div className="w-1 h-6 bg-slate-400/80" />
             <div className="w-1 h-6 bg-slate-400/80" />
          </div>
        </div>

        {/* Step 3: Variants */}
        <div className="w-full grid grid-cols-3 gap-4 mb-2">
          <DiagramNode icon={Scale} title="Naive RAG" desc="Vector Only" />
          <DiagramNode icon={Scale} title="Advanced RAG" desc="Hybrid + Reranking" />
          <DiagramNode icon={Scale} title="Ragfather Full" desc="Graph + CRAG" className="border-primary/50" />
        </div>

        {/* Converge Lines */}
        <div className="w-full max-w-2xl flex flex-col items-center">
          <div className="w-full flex justify-between px-16">
             <div className="w-1 h-6 bg-slate-400/80" />
             <div className="w-1 h-6 bg-slate-400/80" />
             <div className="w-1 h-6 bg-slate-400/80" />
          </div>
          <div className="w-full h-1 bg-slate-400/80" />
          <VerticalLine />
        </div>

        {/* Step 4: RAGAS */}
        <div className="w-64">
          <DiagramNode icon={Cpu} title="RAGAS Framework" desc="LLM-as-a-Judge Evaluation" className="bg-error/5 border-error/30 text-error" />
        </div>

        <VerticalLine />

        {/* Step 5: Metrics */}
        <div className="w-full grid grid-cols-4 gap-4 mb-2">
          <DiagramNode icon={CheckCircle2} title="Faithfulness" desc="Grounded context?" />
          <DiagramNode icon={CheckCircle2} title="Relevancy" desc="Addresses query?" />
          <DiagramNode icon={CheckCircle2} title="Precision" desc="Relevant chunks?" />
          <DiagramNode icon={CheckCircle2} title="Recall" desc="Info captured?" />
        </div>

        <VerticalLine />

        {/* Final: History */}
        <div className="w-64">
          <DiagramNode icon={History} title="Local History" desc="Saved to IndexedDB" className="bg-success/10 border-success/30" />
        </div>

      </div>
    </div>
  );
}
