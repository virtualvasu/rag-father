import React from 'react';

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
  status
}) => {
  return (
    <div className="border border-outline-variant rounded-none p-6 bg-surface-container">
      <h2 className="text-headline-md font-headline-md mb-4 text-secondary">1. Evaluation Parameters</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-mono text-primary uppercase mb-2">Select Pipeline Variants</label>
          <p className="text-xs text-on-surface-variant font-mono mb-3">
            Choose which architectural variants of the RAG pipeline you want to test. 
            For example, "Naive" might be simple vector search, while "Advanced" includes knowledge graphs and cross-encoders.
          </p>
          <div className="space-y-2 bg-surface p-4 border border-outline-variant">
            {variants.map(v => (
              <label key={v} className="flex items-center gap-2 text-sm font-mono text-on-surface cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-primary"
                  checked={!!selectedVariants[v]}
                  onChange={(e) => setSelectedVariants({...selectedVariants, [v]: e.target.checked})}
                />
                {v}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-mono text-primary uppercase mb-2">Specific Question IDs (Optional)</label>
          <p className="text-xs text-on-surface-variant font-mono mb-2">
            Target specific test cases from your evaluation dataset. Leave blank to run all available questions.
          </p>
          <input 
            type="text" 
            placeholder="e.g. Q001, Q005"
            className="w-full bg-surface border border-outline-variant p-3 text-sm text-on-surface focus:outline-none focus:border-primary font-mono"
            value={questionIds}
            onChange={e => setQuestionIds(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-mono text-primary uppercase mb-2">LLM Judging</label>
          <p className="text-xs text-on-surface-variant font-mono mb-2">
            RAGAS relies on an LLM-as-a-judge to grade the responses. Disabling this saves significant API costs and time, but you will only receive basic exact-match metrics.
          </p>
          <label className="flex items-center gap-2 text-sm font-mono text-on-surface cursor-pointer p-3 bg-surface border border-outline-variant">
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-primary"
              checked={skipRagas}
              onChange={e => setSkipRagas(e.target.checked)}
            />
            Skip RAGAS LLM Judge (Faster, cheaper)
          </label>
        </div>

        <div className="pt-6 border-t border-outline-variant">
          <label className="block text-sm font-mono text-primary uppercase mb-2">Auto-Generate Testset (LLM)</label>
          <p className="text-xs text-on-surface-variant font-mono mb-3">
            If you don't have a ground truth dataset, you can use the LLM to automatically generate a synthetic test suite based on the ingested documents.
          </p>
          <div className="flex gap-4">
            <input 
              type="number" 
              min="1" max="20"
              className="w-24 bg-surface border border-outline-variant p-3 text-sm text-on-surface focus:outline-none focus:border-primary font-mono"
              value={numQuestions}
              onChange={e => setNumQuestions(e.target.value)}
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || status === "running"}
              className={`flex-1 py-3 px-4 font-mono text-sm uppercase tracking-wider transition-colors
                ${(isGenerating || status === "running") ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed border border-outline-variant' : 'bg-surface border border-primary text-primary hover:bg-primary/10'}`}
            >
              {isGenerating ? 'GENERATING MAGIC QUESTIONS...' : 'GENERATE SYNTHETIC DATASET'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Step1Parameters;
