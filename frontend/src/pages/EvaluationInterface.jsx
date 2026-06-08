import React, { useState, useEffect, useRef } from 'react';
import TerminalOutput from '../components/TerminalOutput';

const EvaluationInterface = ({ toggleTheme, isDark }) => {
  const [variants, setVariants] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [questionIds, setQuestionIds] = useState("");
  const [skipRagas, setSkipRagas] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [results, setResults] = useState([]);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);

  // Setup basic logging interval to pull status
  useEffect(() => {
    let interval;
    if (status === "running") {
      interval = setInterval(fetchStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Stream logs via SSE
  useEffect(() => {
    let eventSource;
    if (status === 'running' || isGenerating) {
      setTerminalLogs([]); // Clear before starting
      eventSource = new EventSource('/api/system/logs/stream');
      
      eventSource.onmessage = (event) => {
        setTerminalLogs(prev => {
          const newLogs = [...prev, event.data];
          return newLogs.slice(-500); // Keep last 500 lines
        });
      };

      eventSource.onerror = (error) => {
        console.error("EventSource failed:", error);
      };
    } else {
      if (eventSource) eventSource.close();
    }
    
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [status, isGenerating]);

  useEffect(() => {
    fetchVariants();
    fetchResults();
    fetchStatus();
  }, []);

  const fetchVariants = async () => {
    try {
      const res = await fetch('/api/evaluation/variants');
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
        // select all by default
        const initSelection = {};
        (data.variants || []).forEach(v => initSelection[v] = true);
        setSelectedVariants(initSelection);
      }
    } catch (e) {
      console.error("Failed to fetch variants", e);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch('/api/evaluation/results');
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (e) {
      console.error("Failed to fetch results", e);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/evaluation/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        setMessage(data.message);
        if (data.status === "completed" || data.status === "failed") {
          fetchResults();
          setTerminalLogs(prev => [...prev, data.message]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch status", e);
    }
  };

  const handleRun = async () => {
    if (status === "running") return;
    
    setTerminalLogs(["Starting evaluation..."]);
    setStatus("running");
    
    const activeVariants = Object.keys(selectedVariants).filter(v => selectedVariants[v]);
    
    const parsedQuestionIds = questionIds.split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      variants: activeVariants,
      question_ids: parsedQuestionIds.length > 0 ? parsedQuestionIds : null,
      skip_ragas: skipRagas
    };

    try {
      const res = await fetch('/api/evaluation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setTerminalLogs(prev => [...prev, "Sent request to backend... waiting for processing to begin in background."]);
      } else {
        const err = await res.json();
        setTerminalLogs(prev => [...prev, `Error: ${err.detail || "Failed to start"}`]);
        setStatus("failed");
      }
    } catch (e) {
      setTerminalLogs(prev => [...prev, `Network error: ${e.message}`]);
      setStatus("failed");
    }
  };

  const handleGenerate = async () => {
    if (isGenerating || status === "running") return;
    
    setTerminalLogs([`Generating synthetic dataset with ${numQuestions} questions... this may take a few minutes depending on your LLM.`]);
    setIsGenerating(true);
    
    try {
      const res = await fetch('/api/evaluation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_questions: Number(numQuestions) })
      });
      const data = await res.json();
      if (res.ok) {
        setTerminalLogs(prev => [...prev, `Success! Generated ${data.num_questions} questions.`]);
      } else {
        setTerminalLogs(prev => [...prev, `Error: ${data.detail || "Failed to generate"}`]);
      }
    } catch (e) {
      setTerminalLogs(prev => [...prev, `Network error: ${e.message}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-background text-on-surface' : 'bg-background text-on-surface'}`}>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-24 pt-8 px-4">
        <header className="mb-8 border-b border-outline-variant pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-display-sm font-display-sm tracking-tight text-primary mb-2">Benchmarks & Evaluation</h1>
            <p className="text-body-lg text-on-surface-variant font-mono max-w-2xl">
              Ablation testing and RAGAS metrics for the RAG pipeline. Select variants to run evaluation against ground truth datasets.
            </p>
          </div>
          <button onClick={toggleTheme} className="p-2 bg-surface border border-outline-variant hover:border-primary text-on-surface transition-colors cursor-pointer">
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Col: Config */}
        <div className="md:col-span-1 space-y-6 border border-outline-variant rounded-none p-6 bg-surface-container">
          <h2 className="text-headline-md font-headline-md mb-4 text-secondary">Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-2">Select Variants</label>
              <div className="space-y-2">
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
              <label className="block text-xs font-mono text-on-surface-variant mb-1">Specific Question IDs (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. Q001, Q005"
                className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary font-mono"
                value={questionIds}
                onChange={e => setQuestionIds(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-mono text-on-surface cursor-pointer mt-4">
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-primary"
                checked={skipRagas}
                onChange={e => setSkipRagas(e.target.checked)}
              />
              Skip RAGAS LLM Judge (Faster)
            </label>

            <button 
              onClick={handleRun}
              disabled={status === "running" || isGenerating}
              className={`w-full py-3 px-4 font-mono text-sm uppercase tracking-wider transition-colors mt-2
                ${(status === "running" || isGenerating) ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed border border-outline-variant' : 'bg-primary text-on-primary hover:bg-secondary border border-transparent'}`}
            >
              {status === "running" ? 'Running...' : 'Run Benchmark'}
            </button>
            {status === "running" && <p className="text-xs text-secondary font-mono mt-2 animate-pulse">{message}</p>}

            <div className="pt-4 mt-4 border-t border-outline-variant">
              <label className="block text-xs font-mono text-on-surface-variant mb-2">Auto-Generate Testset (LLM)</label>
              <div className="flex gap-2 mb-2">
                <input 
                  type="number" 
                  min="1" max="20"
                  className="w-20 bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary font-mono"
                  value={numQuestions}
                  onChange={e => setNumQuestions(e.target.value)}
                />
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || status === "running"}
                  className={`flex-1 py-2 px-2 font-mono text-xs uppercase tracking-wider transition-colors
                    ${(isGenerating || status === "running") ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed border border-outline-variant' : 'bg-surface border border-primary text-primary hover:bg-primary/10'}`}
                >
                  {isGenerating ? 'Generating...' : 'Generate Questions'}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Col: Terminal Output */}
        <div className="md:col-span-2 flex flex-col h-[400px]">
          <h2 className="text-headline-md font-headline-md mb-4 text-secondary">Execution Trace</h2>
          <TerminalOutput logs={terminalLogs} isRunning={status === "running"} />
        </div>
      </div>

      {/* Results Dashboard */}
      <div className="border border-outline-variant rounded-none p-6 bg-surface-container mt-8">
        <h2 className="text-headline-md font-headline-md mb-4 text-secondary">Past Evaluation Results</h2>
        {results.length === 0 ? (
          <p className="text-sm font-mono text-on-surface-variant">No evaluation results found.</p>
        ) : (
          <div className="space-y-6">
            {results.map((run, idx) => (
              <div key={idx} className="border border-outline-variant p-4 bg-surface">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-mono text-sm text-primary font-bold">{run.filename}</h3>
                    <p className="text-xs font-mono text-on-surface-variant">{run.timestamp}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-on-surface-variant block">Questions Evaluated</span>
                    <span className="text-lg font-mono text-on-surface">{run.num_questions}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(run.variants).map(([vName, vData]) => {
                    const ragas = vData.ragas_scores || {};
                    return (
                      <div key={vName} className="border border-outline-variant p-3 bg-surface-container">
                        <h4 className="font-mono text-xs uppercase text-secondary mb-2">{vName}</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-on-surface-variant">Faithfulness:</span>
                            <span className="text-on-surface">{ragas.faithfulness !== undefined ? ragas.faithfulness.toFixed(2) : '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-on-surface-variant">Answer Rel:</span>
                            <span className="text-on-surface">{ragas.answer_relevancy !== undefined ? ragas.answer_relevancy.toFixed(2) : '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-on-surface-variant">Context Prec:</span>
                            <span className="text-on-surface">{ragas.context_precision !== undefined ? ragas.context_precision.toFixed(2) : '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-on-surface-variant">Context Rec:</span>
                            <span className="text-on-surface">{ragas.context_recall !== undefined ? ragas.context_recall.toFixed(2) : '-'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  </div>
  );
};

export default EvaluationInterface;
