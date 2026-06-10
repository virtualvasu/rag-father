import React from 'react';
import { Check } from 'lucide-react';

const StepIndicator = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-border z-0" />
        
        {/* Progress Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary z-0 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isClickable = index <= currentStep; // Only allow clicking back to completed steps or current

          return (
            <div 
              key={step.id || index}
              className="relative z-10 flex flex-col items-center gap-2"
            >
              <button
                onClick={() => isClickable && onStepClick && onStepClick(index)}
                disabled={!isClickable}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs transition-all duration-300
                  ${isCompleted ? 'bg-primary text-white hover:bg-primary-light shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 
                    isActive ? 'bg-surface-highest border-2 border-primary text-primary shadow-[0_0_10px_rgba(99,102,241,0.3)] scale-110' : 
                    'bg-surface border-2 border-border text-text-muted cursor-not-allowed'}
                `}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : (index + 1)}
              </button>
              
              <div className={`
                absolute top-10 w-24 text-center text-xs font-display transition-colors duration-300
                ${isActive ? 'text-primary font-semibold' : 
                  isCompleted ? 'text-text-primary' : 
                  'text-text-muted'}
              `}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
