import React from 'react';

const MetricBar = ({ label, value, max = 1 }) => {
  // value is expected to be a decimal between 0 and 1
  const percentage = value !== undefined && value !== null ? Math.round((value / max) * 100) : null;
  
  let colorClass = 'bg-border'; // default
  let textClass = 'text-text-secondary';
  
  if (percentage !== null) {
    if (percentage >= 80) {
      colorClass = 'bg-accent';
      textClass = 'text-accent';
    } else if (percentage >= 60) {
      colorClass = 'bg-secondary';
      textClass = 'text-secondary';
    } else {
      colorClass = 'bg-error';
      textClass = 'text-error';
    }
  }

  const displayValue = percentage !== null ? `${percentage}%` : '-';

  return (
    <div className="flex items-center gap-4 w-full">
      <div className="w-32 flex-shrink-0 font-sans text-sm text-text-secondary truncate">
        {label}
      </div>
      
      <div className="flex-1 h-2 bg-surface-highest rounded-full overflow-hidden">
        {percentage !== null && (
          <div 
            className={`h-full ${colorClass} transition-all duration-1000 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
      
      <div className={`w-12 text-right font-mono text-sm font-semibold ${textClass}`}>
        {displayValue}
      </div>
    </div>
  );
};

export default MetricBar;
