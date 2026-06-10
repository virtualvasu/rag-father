import React from 'react';
import TerminalOutput from '../../components/TerminalOutput';

const Step2RunEval = ({
  selectedVariants,
  questionIds,
  skipRagas,
  handleRun,
  status,
  message,
  terminalLogs,
  setCurrentStep
}) => {
  const activeVariants = Object.keys(selectedVariants).filter(v => selectedVariants[v]);

  return (
    <div className="border border-border rounded-2xl p-6 md:p-8 bg-surface-high shadow-lg relative overflow-hidden">
      {status === 'completed' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border-2 border-primary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-display font-semibold text-text-primary mb-2">Evaluation Complete!</h3>
            <p className="text-sm font-sans text-text-secondary mb-6">
              The benchmark has finished running successfully. Check out your results.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setCurrentStep(2)}
                className="w-full py-3 px-6 bg-primary text-white font-sans text-sm font-semibold rounded-xl hover:bg-primary-light transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center justify-center gap-2"
              >
                VIEW RESULTS
              </button>
              <button 
                onClick={() => {
                  const overlay = document.querySelector('.bg-black\\/60');
                  if(overlay) overlay.style.display = 'none';
                }}
                className="w-full mt-2 text-xs font-sans text-text-muted hover:text-text-primary transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-display font-semibold mb-6 text-text-primary flex items-center gap-2 relative z-10">
        Review & Execution
      </h2>
      
      <div className="space-y-6 relative z-10">
        
        {/* Configuration Review Section */}
        <div className="mb-6 p-6 border border-border rounded-xl bg-surface-highest/50">
          <h3 className="font-mono text-xs text-primary uppercase tracking-wider mb-4 font-semibold">Evaluation Review</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-sm text-text-primary">
            <div>
              <span className="text-text-muted block text-xs mb-1">Selected Variants:</span>
              <span className="font-medium bg-surface-dark px-2 py-1 rounded border border-border inline-block">
                {activeVariants.length > 0 ? activeVariants.join(", ") : "None"}
              </span>
            </div>
            <div>
              <span className="text-text-muted block text-xs mb-1">Question IDs:</span>
              <span className="font-medium bg-surface-dark px-2 py-1 rounded border border-border inline-block">
                {questionIds.trim() ? questionIds : "All Available"}
              </span>
            </div>
            <div>
              <span className="text-text-muted block text-xs mb-1">RAGAS LLM Judge:</span>
              <span className="font-medium bg-surface-dark px-2 py-1 rounded border border-border inline-block">
                {skipRagas ? "Skipped" : "Enabled"}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleRun}
          disabled={status === "running"}
          className={`w-full py-4 px-6 font-sans text-sm font-semibold rounded-xl transition-all flex justify-center items-center gap-2
            ${(status === "running") ? 'bg-surface border border-border text-text-muted cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-light border border-transparent shadow-[0_0_15px_rgba(59,130,246,0.2)]'}`}
        >
          {status === "running" && <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>}
          {status === "running" ? 'EVALUATION RUNNING...' : 'START EVALUATION'}
        </button>
        {status === "running" && <p className="text-xs text-primary font-mono mt-2 animate-pulse text-center">{message}</p>}

        <div className="mt-8 flex flex-col h-[400px]">
          <h3 className="font-mono text-xs text-primary uppercase tracking-wider mb-3 font-semibold">Execution Trace</h3>
          <TerminalOutput logs={terminalLogs} isRunning={status === "running"} />
        </div>
      </div>
    </div>
  );
};

export default Step2RunEval;
