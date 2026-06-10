import React, { useState, useEffect, useRef } from 'react';
import Step1Parameters from './evaluation/Step1Parameters';
import Step2RunEval from './evaluation/Step2RunEval';
import Step3Results from './evaluation/Step3Results';
import EvaluationHistory from './evaluation/EvaluationHistory';
import { saveEvaluation, getAllEvaluations } from '../utils/db';

const EvaluationInterface = ({ toggleTheme, isDark }) => {
  const [currentStep, setCurrentStep] = useState(1);
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
  const [generateResult, setGenerateResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

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
        
        // Sync to IndexedDB
        if (data.results) {
          for (const r of data.results) {
            try {
              await saveEvaluation(r);
            } catch (e) {
              console.error("Failed to save to IndexedDB", e);
            }
          }
        }
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
    setGenerateResult(null);
    
    try {
      const res = await fetch('/api/evaluation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_questions: Number(numQuestions) })
      });
      const data = await res.json();
      if (res.ok) {
        setTerminalLogs(prev => [...prev, `Success! Generated ${data.num_questions} questions.`]);
        setGenerateResult({ type: 'success', message: `Success! Generated ${data.num_questions} questions.` });
      } else {
        setTerminalLogs(prev => [...prev, `Error: ${data.detail || "Failed to generate"}`]);
        setGenerateResult({ type: 'error', message: `Error: ${data.detail || "Failed to generate"}` });
      }
    } catch (e) {
      setTerminalLogs(prev => [...prev, `Network error: ${e.message}`]);
      setGenerateResult({ type: 'error', message: `Network error: ${e.message}` });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-background text-on-surface' : 'bg-background text-on-surface'}`}>
      <div className="w-full px-4 md:px-12 py-8 mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-headline-xl font-headline-xl text-primary mb-2">Benchmarks & Evaluation</h1>
            <p className="text-body-lg text-on-surface-variant font-mono max-w-2xl">
              Ablation testing and RAGAS metrics for the RAG pipeline. Select variants to run evaluation against ground truth datasets.
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setShowHistory(!showHistory)} 
              className={`py-2 px-4 border font-mono text-sm transition-colors ${showHistory ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-outline-variant hover:border-primary text-on-surface'}`}
            >
              {showHistory ? "CLOSE HISTORY" : "VIEW HISTORY"}
            </button>
            <button onClick={toggleTheme} className="p-2 bg-surface border border-outline-variant hover:border-primary text-on-surface transition-colors cursor-pointer">
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>
        </header>

        {showHistory ? (
          <EvaluationHistory />
        ) : (
          <>
            {/* Stepper Progress */}
            <div className="mb-10">
              <div className="flex items-center justify-between">
                {['Evaluation Parameters', 'Review & Execution', 'Evaluation Results'].map((stepName, index) => {
                  const stepNumber = index + 1;
                  const isActive = currentStep === stepNumber;
                  const isPast = currentStep > stepNumber;
                  return (
                    <div key={stepNumber} className="flex flex-col items-center relative z-10 w-1/3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm border-2 transition-colors ${
                        isActive ? 'bg-primary border-primary text-on-primary' : 
                        isPast ? 'bg-primary-fixed border-primary-fixed text-on-primary-fixed' : 
                        'bg-surface border-outline-variant text-on-surface-variant'
                      }`}>
                        {stepNumber}
                      </div>
                      <div className={`mt-2 text-xs font-mono text-center ${isActive || isPast ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {stepName}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="relative -mt-11 top-4 h-1 bg-outline-variant z-0 mx-20">
                <div className="absolute top-0 left-0 h-full bg-primary transition-all duration-300" style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              
              {currentStep === 1 && (
                <Step1Parameters 
                  variants={variants}
                  selectedVariants={selectedVariants}
                  setSelectedVariants={setSelectedVariants}
                  questionIds={questionIds}
                  setQuestionIds={setQuestionIds}
                  skipRagas={skipRagas}
                  setSkipRagas={setSkipRagas}
                  numQuestions={numQuestions}
                  setNumQuestions={setNumQuestions}
                  isGenerating={isGenerating}
                  handleGenerate={handleGenerate}
                  status={status}
                  generateResult={generateResult}
                />
              )}

              {currentStep === 2 && (
                <Step2RunEval 
                  selectedVariants={selectedVariants}
                  questionIds={questionIds}
                  skipRagas={skipRagas}
                  handleRun={handleRun}
                  status={status}
                  message={message}
                  terminalLogs={terminalLogs}
                  setCurrentStep={setCurrentStep}
                />
              )}

              {currentStep === 3 && (
                <Step3Results 
                  results={results}
                />
              )}

              {/* Navigation Controls */}
              <div className="flex justify-between mt-8 border-t border-outline-variant pt-6">
                <button
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1 || status === 'running'}
                  className="py-3 px-8 bg-surface border border-outline-variant text-on-surface font-mono text-sm uppercase hover:border-primary disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  BACK
                </button>
                <button
                  onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
                  disabled={currentStep === 3 || status === 'running'}
                  className="py-3 px-8 bg-primary text-on-primary font-mono text-sm uppercase hover:bg-primary-fixed-dim disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                >
                  NEXT STEP
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EvaluationInterface;
