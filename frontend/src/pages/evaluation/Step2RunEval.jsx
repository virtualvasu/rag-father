import React from 'react';
import TerminalOutput from '../../components/TerminalOutput';

const Step2RunEval = ({
  selectedVariants,
  questionIds,
  skipRagas,
  handleRun,
  status,
  message,
  terminalLogs
}) => {
  const activeVariants = Object.keys(selectedVariants).filter(v => selectedVariants[v]);

  return (
    <div className="border border-outline-variant rounded-none p-6 bg-surface-container">
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
