import React, { useEffect, useRef } from 'react';
import { Terminal, AlertCircle, CheckCircle2, Info } from 'lucide-react';

const TerminalOutput = ({ logs, isRunning, height = "h-64" }) => {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Helper to determine log level and styling
  const formatLogLine = (log) => {
    const text = log.toString();
    if (text.includes('ERROR') || text.includes('FAILED')) {
      return { color: 'text-error', icon: <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> };
    }
    if (text.includes('SUCCESS') || text.includes('COMPLETED')) {
      return { color: 'text-accent', icon: <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" /> };
    }
    if (text.includes('WARN')) {
      return { color: 'text-secondary', icon: <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> };
    }
    return { color: 'text-text-primary', icon: <span className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary opacity-50">&gt;</span> };
  };

  return (
    <div className={`flex flex-col bg-surface-dark border border-border rounded-xl overflow-hidden shadow-lg ${height}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-highest">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-text-muted" />
          <span className="font-mono text-xs text-text-secondary">ragfather-core.log</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-border"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-border"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-border"></div>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed custom-scrollbar">
        <div className="space-y-1.5">
          {logs.length === 0 && !isRunning && (
            <div className="flex items-start gap-2 text-text-muted italic">
              <Info className="w-3 h-3 mt-0.5" />
              <span>System initialized. Awaiting pipeline execution...</span>
            </div>
          )}
          
          {logs.map((log, index) => {
            const { color, icon } = formatLogLine(log);
            return (
              <div key={index} className={`flex items-start gap-2 ${color} hover:bg-surface-highest/50 px-1 rounded`}>
                {icon}
                <span className="break-words font-medium">{log}</span>
              </div>
            );
          })}
          
          {isRunning && (
            <div className="flex items-start gap-2 text-primary mt-4">
              <span className="animate-pulse">&gt;</span>
              <span className="animate-pulse">Processing...</span>
            </div>
          )}
          
          <div ref={endOfMessagesRef} className="h-2" />
        </div>
      </div>
    </div>
  );
};

export default TerminalOutput;
