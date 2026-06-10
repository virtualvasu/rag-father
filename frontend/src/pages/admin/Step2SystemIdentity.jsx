import React from 'react';
import { Bot, Sparkles, Save, BrainCircuit } from 'lucide-react';

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
    <div className="border border-border rounded-2xl p-6 md:p-8 bg-surface-high shadow-lg relative overflow-hidden">

      
      <h2 className="text-xl font-display font-semibold mb-6 text-text-primary flex items-center gap-2">
        <Bot className="w-5 h-5 text-primary" />
        System Identity (Prompt)
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
        {/* Left Column - Generation */}
        <div className="space-y-6">
          <p className="text-sm font-sans text-text-secondary leading-relaxed">
            Define the core persona and instructions for the RAG assistant. You can manually edit the prompt or use the AI to generate a highly robust prompt based on your use case.
          </p>
          
          <div className="p-5 border border-border rounded-xl bg-surface-highest/50">
            <h3 className="font-sans text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              Auto-Generate from Use Case
            </h3>
            
            <div className="space-y-4">
              <div>
                <input 
                  type="text" 
                  value={promptUseCase}
                  onChange={(e) => setPromptUseCase(e.target.value)}
                  placeholder="e.g. Medical RAG for clinical guidelines" 
                  className="w-full bg-surface-highest border border-border p-3 rounded-lg text-sm font-sans text-text-primary focus:outline-none focus:border-secondary transition-colors placeholder-text-muted" 
                  disabled={isGeneratingPrompt}
                />
              </div>
              <button 
                onClick={handleGeneratePrompt}
                disabled={!promptUseCase.trim() || isGeneratingPrompt}
                className="w-full py-3 bg-surface border border-secondary text-secondary font-sans text-sm font-medium rounded-lg hover:bg-secondary/10 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {isGeneratingPrompt ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                    GENERATING...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" />
                    GENERATE MAGIC PROMPT
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Column - Editor */}
        <div className="flex flex-col h-full min-h-[300px]">
          <div className="flex justify-between items-end mb-2">
            <label className="text-sm font-sans font-semibold text-text-primary">System Prompt</label>
            <span className="text-xs font-mono text-text-muted">
              {systemPrompt.length} chars
            </span>
          </div>
          
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full flex-grow bg-surface-highest border border-border p-4 rounded-xl text-sm font-sans text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 resize-y transition-all placeholder-text-muted mb-4 shadow-inner"
            disabled={isGeneratingPrompt}
            placeholder="You are a helpful assistant..."
          />
          
          <button 
            onClick={handleSavePrompt}
            disabled={isGeneratingPrompt}
            className="w-full py-3 bg-primary text-white font-sans text-sm font-medium rounded-xl hover:bg-primary-light transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          >
            <Save className="w-4 h-4" />
            SAVE PROMPT
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step2SystemIdentity;
