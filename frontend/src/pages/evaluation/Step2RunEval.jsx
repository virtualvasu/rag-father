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
    <div className="border border-outline-variant rounded-none p-6 bg-surface-container relative">
      {status === 'completed' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant p-8 max-w-md w-full shadow-2xl animate-fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4 border-2 border-primary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-headline-md font-headline-md text-primary mb-2">Evaluation Complete!</h3>
            <p className="text-sm font-mono text-on-surface-variant mb-6">
              The benchmark has finished running successfully. Check out your results.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setCurrentStep(3)}
                className="w-full py-3 px-6 bg-primary text-on-primary font-mono text-sm uppercase hover:bg-primary-fixed-dim transition-all shadow-md flex items-center justify-center gap-2"
              >
                VIEW RESULTS
              </button>
              <button 
                onClick={() => {
                  const overlay = document.querySelector('.bg-black\\/60');
                  if(overlay) overlay.style.display = 'none';
                }}
                className="w-full mt-2 text-xs font-mono text-on-surface-variant hover:text-on-surface underline transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-headline-md font-headline-md mb-4 text-secondary">2. Review & Execution</h2>
      
      <div className="space-y-6">
        
        {/* Configuration Review Section */}
        <div className="mb-6 p-4 border border-outline-variant bg-surface-variant/20">
          <h3 className="font-mono text-sm text-primary uppercase mb-3">Evaluation Review</h3>
          <div className="grid grid-cols-2 gap-4 font-mono text-xs text-on-surface">
            <div>
              <span className="text-on-surface-variant">Selected Variants:</span> {activeVariants.length > 0 ? activeVariants.join(", ") : "None"}
            </div>
            <div>
              <span className="text-on-surface-variant">Question IDs:</span> {questionIds.trim() ? questionIds : "All Available"}
            </div>
            <div>
              <span className="text-on-surface-variant">RAGAS LLM Judge:</span> {skipRagas ? "Skipped" : "Enabled"}
            </div>
          </div>
        </div>

        <button 
          onClick={handleRun}
          disabled={status === "running"}
          className={`w-full py-4 px-4 font-mono text-sm uppercase tracking-wider transition-colors flex justify-center items-center gap-2
            ${(status === "running") ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed border border-outline-variant' : 'bg-secondary text-on-secondary hover:bg-opacity-90 border border-transparent'}`}
        >
          {status === "running" && <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>}
          {status === "running" ? 'EVALUATION RUNNING...' : 'START EVALUATION'}
        </button>
        {status === "running" && <p className="text-xs text-secondary font-mono mt-2 animate-pulse text-center">{message}</p>}

        <div className="mt-8 flex flex-col h-[400px]">
          <h3 className="font-mono text-sm text-primary uppercase mb-2">Execution Trace</h3>
          <TerminalOutput logs={terminalLogs} isRunning={status === "running"} />
        </div>
      </div>
    </div>
  );
};

export default Step2RunEval;
