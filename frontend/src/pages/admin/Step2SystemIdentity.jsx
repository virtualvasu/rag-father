import React from 'react';

const Step2SystemIdentity = ({
  promptUseCase,
  setPromptUseCase,
  isGeneratingPrompt,
  handleGeneratePrompt,
  systemPrompt,
  setSystemPrompt,
  handleSavePrompt
}) => {
  return (
    <div className="border border-outline-variant rounded-none p-6 bg-surface-container">
      <h2 className="text-headline-md font-headline-md mb-4 text-secondary">2. System Identity (Prompt)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <p className="text-sm font-mono text-on-surface-variant">
            Define the core persona and instructions for the RAG assistant. You can manually edit the prompt or use the AI to generate a highly robust prompt based on your use case.
          </p>
          <div>
            <label className="block text-xs font-mono text-on-surface-variant mb-1">Auto-Generate from Use Case</label>
            <input 
              type="text" 
              value={promptUseCase}
              onChange={(e) => setPromptUseCase(e.target.value)}
              placeholder="e.g. Medical RAG for clinical guidelines" 
              className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary mb-2" 
              disabled={isGeneratingPrompt}
            />
            <button 
              onClick={handleGeneratePrompt}
              disabled={!promptUseCase.trim() || isGeneratingPrompt}
              className="w-full py-2 bg-secondary text-on-secondary font-mono text-sm uppercase hover:bg-opacity-90 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
            >
              {isGeneratingPrompt && <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>}
              {isGeneratingPrompt ? 'GENERATING MAGIC PROMPT...' : 'GENERATE MAGIC PROMPT'}
            </button>
          </div>
        </div>
        <div className="space-y-4 flex flex-col">
          <label className="block text-xs font-mono text-on-surface-variant mb-1">System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full flex-grow min-h-[150px] bg-surface border border-outline-variant p-3 text-sm font-mono text-on-surface focus:outline-none focus:border-primary resize-y"
            disabled={isGeneratingPrompt}
          />
          <button 
            onClick={handleSavePrompt}
            disabled={isGeneratingPrompt}
            className="w-full py-2 bg-surface border border-outline-variant text-on-surface font-mono text-sm uppercase hover:border-primary transition-all"
          >
            SAVE PROMPT
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step2SystemIdentity;
