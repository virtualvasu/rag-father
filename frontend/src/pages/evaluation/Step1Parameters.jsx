import React from 'react';
import ToggleCard from '../../components/ToggleCard';
import { Settings2, Database, Zap, Wand2, Hash } from 'lucide-react';

const Step1Parameters = ({
  variants,
  selectedVariants,
  setSelectedVariants,
  questionIds,
  setQuestionIds,
  skipRagas,
  setSkipRagas,
  numQuestions,
  setNumQuestions,
  isGenerating,
  handleGenerate,
  status,
  generateResult
}) => {
  return (
    <div className="border border-border rounded-2xl p-6 md:p-8 bg-surface-high shadow-lg relative overflow-hidden">

      
      <h2 className="text-xl font-display font-semibold mb-6 text-text-primary flex items-center gap-2 relative z-10">
        <Settings2 className="w-5 h-5 text-primary" />
        Evaluation Parameters
      </h2>
      
      <div className="space-y-8 relative z-10">
        {/* Variants Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-sans font-semibold text-text-primary mb-2">
            <Zap className="w-4 h-4 text-accent" />
            Select Pipeline Variants
          </label>
          <p className="text-xs text-text-secondary font-sans mb-4">
            Choose which architectural variants of the RAG pipeline you want to test. "Naive" might be simple vector search, while "Advanced" includes knowledge graphs and cross-encoders.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {variants.map(v => (
              <ToggleCard
                key={v}
                id={`variant_${v}`}
                title={v}
                description={`Include ${v} pipeline in evaluation`}
                checked={!!selectedVariants[v]}
                onChange={(e) => setSelectedVariants({...selectedVariants, [v]: e.target.checked})}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Specific Questions */}
          <div>
            <label className="flex items-center gap-2 text-sm font-sans font-semibold text-text-primary mb-2">
              <Hash className="w-4 h-4 text-primary" />
              Specific Question IDs (Optional)
            </label>
            <p className="text-xs text-text-secondary font-sans mb-2">
              Target specific test cases. Leave blank to run all.
            </p>
            <input 
              type="text" 
              placeholder="e.g. Q001, Q005"
              className="w-full bg-surface border border-border rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono transition-all"
              value={questionIds}
              onChange={e => setQuestionIds(e.target.value)}
            />
          </div>

          {/* LLM Judging */}
          <div>
            <label className="flex items-center gap-2 text-sm font-sans font-semibold text-text-primary mb-2">
              <Database className="w-4 h-4 text-primary" />
              LLM Judging
            </label>
            <p className="text-xs text-text-secondary font-sans mb-2">
              RAGAS uses an LLM-as-a-judge. Disabling it saves API costs.
            </p>
            <ToggleCard
              id="skip_ragas_judge"
              title="Skip RAGAS Judge"
              description="Faster, cheaper, exact-match only."
              checked={skipRagas}
              onChange={(e) => setSkipRagas(e.target.checked)}
            />
          </div>
        </div>

        {/* Auto-Generate Testset */}
        <div className="pt-8 border-t border-border">
          <label className="flex items-center gap-2 text-sm font-sans font-semibold text-text-primary mb-2">
            <Wand2 className="w-4 h-4 text-accent" />
            Auto-Generate Testset
          </label>
          <p className="text-xs text-text-secondary font-sans mb-4">
            If you don't have a ground truth dataset, use the LLM to automatically generate a synthetic test suite based on ingested documents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="number" 
              min="1" max="20"
              className="w-full sm:w-32 bg-surface border border-border rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono transition-all"
              value={numQuestions}
              onChange={e => setNumQuestions(e.target.value)}
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || status === "running"}
              className={`flex-1 py-3 px-6 font-sans text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2
                ${(isGenerating || status === "running") ? 'bg-surface border border-border text-text-muted cursor-not-allowed' : 'bg-surface border border-primary text-primary hover:bg-primary/10 shadow-md'}`}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                  GENERATING MAGIC QUESTIONS...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  GENERATE SYNTHETIC DATASET
                </>
              )}
            </button>
          </div>
          {generateResult && (
            <div className={`mt-4 p-4 rounded-xl font-mono text-sm flex items-center gap-2 ${generateResult.type === 'success' ? 'bg-primary/10 border border-primary text-primary' : 'bg-error/10 border border-error text-error'}`}>
              <span className="flex-shrink-0">{generateResult.type === 'success' ? '✨' : '⚠️'}</span>
              {generateResult.message}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Step1Parameters;
