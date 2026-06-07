import React, { useEffect, useRef } from 'react';

const TerminalOutput = ({ logs, isRunning, height = "h-full" }) => {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className={`bg-[#0c1324] dark:bg-[#060908] border border-outline-variant p-4 ${height} overflow-y-auto w-full font-mono text-xs text-white`}>
      <div className="space-y-2">
        {logs.length === 0 && !isRunning && (
          <p className="text-on-surface-variant italic">&gt; Ready for input...</p>
        )}
        {logs.map((log, index) => (
          <p key={index} className="whitespace-pre-wrap break-words">
            <span className="text-primary mr-2">&gt;</span>
            {log}
          </p>
        ))}
        {isRunning && (
          <p className="animate-pulse text-secondary">
            <span className="mr-2">&gt;</span>
            Processing...
          </p>
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default TerminalOutput;
