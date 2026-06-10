import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StepIndicator from '../components/StepIndicator';

import Step1Parameters from './evaluation/Step1Parameters';
import Step2RunEval from './evaluation/Step2RunEval';
import Step3Results from './evaluation/Step3Results';
import EvaluationHistory from './evaluation/EvaluationHistory';
import { saveEvaluation } from '../utils/db';

import { ArrowLeft, ArrowRight, Clock, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EvalIntro from '../components/evaluation/EvalIntro';

const EvaluationInterface = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [evalStep, setEvalStep] = useState(0); // 0-indexed
  const [variants, setVariants] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [questionIds, setQuestionIds] = useState("");
  const [skipRagas, setSkipRagas] = useState(false);
  const [evalStatus, setEvalStatus] = useState("idle");
  const [evalMessage, setEvalMessage] = useState("");
  const [evalResults, setEvalResults] = useState([]);
  const [evalTerminalLogs, setEvalTerminalLogs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [generateResult, setGenerateResult] = useState(null);
  const [showEvalHistory, setShowEvalHistory] = useState(false);

  useEffect(() => {
    fetchVariants();
    fetchResults();
    fetchEvalStatus();
  }, []);

  useEffect(() => {
    let interval;
    if (evalStatus === "running") {
      interval = setInterval(fetchEvalStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [evalStatus]);

  useEffect(() => {
    let eventSource;
    if (evalStatus === 'running' || isGenerating) {
      setEvalTerminalLogs([]);
      eventSource = new EventSource('/api/system/logs/stream');
      eventSource.onmessage = (event) => setEvalTerminalLogs(prev => [...prev, event.data].slice(-500));
    } else {
      if (eventSource) eventSource.close();
    }
    return () => { if (eventSource) eventSource.close(); };
  }, [evalStatus, isGenerating]);

  const fetchVariants = async () => {
    try {
      const res = await fetch('/api/evaluation/variants');
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
        const initSelection = {};
        (data.variants || []).forEach(v => initSelection[v] = true);
        setSelectedVariants(initSelection);
      }
    } catch (e) {}
  };

  const fetchResults = async () => {
    try {
      const res = await fetch('/api/evaluation/results');
      if (res.ok) {
        const data = await res.json();
        setEvalResults(data.results || []);
        if (data.results) {
          for (const r of data.results) {
            try { await saveEvaluation(r); } catch (e) {}
          }
        }
      }
    } catch (e) {}
  };

  const fetchEvalStatus = async () => {
    try {
      const res = await fetch('/api/evaluation/status');
      if (res.ok) {
        const data = await res.json();
        setEvalStatus(data.status);
        setEvalMessage(data.message);
        if (data.status === "completed" || data.status === "failed") {
          fetchResults();
          setEvalTerminalLogs(prev => [...prev, data.message]);
        }
      }
    } catch (e) {}
  };

  const handleRunEval = async () => {
    if (evalStatus === "running") return;
    setEvalTerminalLogs(["Starting evaluation..."]);
    setEvalStatus("running");
    
    const activeVariants = Object.keys(selectedVariants).filter(v => selectedVariants[v]);
    const parsedQuestionIds = questionIds.split(",").map(s => s.trim()).filter(s => s.length > 0);

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
        setEvalTerminalLogs(prev => [...prev, "Sent request to backend... waiting for processing to begin in background."]);
      } else {
        const err = await res.json();
        setEvalTerminalLogs(prev => [...prev, `Error: ${err.detail || "Failed to start"}`]);
        setEvalStatus("failed");
      }
    } catch (e) {
      setEvalTerminalLogs(prev => [...prev, `Network error: ${e.message}`]);
      setEvalStatus("failed");
    }
  };

  const handleGenerateEvalSet = async () => {
    if (isGenerating || evalStatus === "running") return;
    setEvalTerminalLogs([`Generating synthetic dataset with ${numQuestions} questions...`]);
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
        setEvalTerminalLogs(prev => [...prev, `Success! Generated ${data.num_questions} questions.`]);
        setGenerateResult({ type: 'success', message: `Success! Generated ${data.num_questions} questions.` });
      } else {
        setEvalTerminalLogs(prev => [...prev, `Error: ${data.detail || "Failed to generate"}`]);
        setGenerateResult({ type: 'error', message: `Error: ${data.detail || "Failed to generate"}` });
      }
    } catch (e) {
      setGenerateResult({ type: 'error', message: `Network error: ${e.message}` });
    } finally {
      setIsGenerating(false);
    }
  };

  const evalSteps = [
    { id: 'params', label: 'Parameters' },
    { id: 'run', label: 'Execution' },
    { id: 'results', label: 'Results' }
  ];

  return (
    <div className={`min-h-screen dark bg-surface-dark text-text-primary font-sans`}>
      {/* Top Header */}
      <header className="bg-surface-highest/80 backdrop-blur-xl border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-display text-xl font-bold tracking-tight text-text-primary hover:text-primary transition-colors">
              RAGFATHER
            </Link>
            
            {/* Nav */}
            <nav className="hidden md:flex bg-surface-dark border border-border p-1 rounded-lg">
              <Link 
                to="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all text-text-secondary hover:text-text-primary hover:bg-surface-high"
              >
                <Settings2 className="w-4 h-4" /> Pipeline Config
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-12 py-12">
        <AnimatePresence mode="wait">
          {showIntro ? (
            <EvalIntro key="intro" onContinue={() => setShowIntro(false)} />
          ) : (
            <motion.div 
              key="wizard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Evaluation Portal</h1>
              <p className="text-text-secondary font-sans max-w-2xl">
                Test and measure pipeline performance using RAGAS. Auto-generate ground truth testsets or run side-by-side ablations.
              </p>
            </div>
            <button 
              onClick={() => setShowEvalHistory(!showEvalHistory)} 
              className={`py-2 px-4 rounded-lg font-sans text-sm font-medium transition-all flex items-center gap-2 ${showEvalHistory ? 'bg-primary text-white shadow-md' : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary'}`}
            >
              <Clock className="w-4 h-4" />
              {showEvalHistory ? "Back to Current Eval" : "View History"}
            </button>
          </div>

          {showEvalHistory ? (
            <EvaluationHistory />
          ) : (
            <>
              <StepIndicator steps={evalSteps} currentStep={evalStep} onStepClick={(i) => setEvalStep(i)} />
              
              <div className="mt-12">
                {evalStep === 0 && (
                  <Step1Parameters 
                    variants={variants} selectedVariants={selectedVariants} setSelectedVariants={setSelectedVariants}
                    questionIds={questionIds} setQuestionIds={setQuestionIds} skipRagas={skipRagas} setSkipRagas={setSkipRagas}
                    numQuestions={numQuestions} setNumQuestions={setNumQuestions} isGenerating={isGenerating} handleGenerate={handleGenerateEvalSet}
                    status={evalStatus} generateResult={generateResult}
                  />
                )}
                {evalStep === 1 && (
                  <Step2RunEval 
                    selectedVariants={selectedVariants} questionIds={questionIds} skipRagas={skipRagas}
                    handleRun={handleRunEval} status={evalStatus} message={evalMessage} terminalLogs={evalTerminalLogs} setCurrentStep={setEvalStep}
                  />
                )}
                {evalStep === 2 && (
                  <Step3Results results={evalResults} />
                )}

                {/* Navigation Controls */}
                <div className="flex justify-between mt-8 pt-8 border-t border-border">
                  <button
                    onClick={() => setEvalStep(prev => Math.max(0, prev - 1))}
                    disabled={evalStep === 0 || evalStatus === 'running'}
                    className="py-3 px-6 bg-surface-high border border-border text-text-primary font-sans text-sm font-semibold rounded-xl hover:border-primary disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> BACK
                  </button>
                  <button
                    onClick={() => setEvalStep(prev => Math.min(2, prev + 1))}
                    disabled={evalStep === 2 || evalStatus === 'running'}
                    className="py-3 px-6 bg-primary text-white font-sans text-sm font-semibold rounded-xl hover:bg-primary-light disabled:opacity-50 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                  >
                    NEXT STEP <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default EvaluationInterface;
