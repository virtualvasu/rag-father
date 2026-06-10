import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { BarChart3, ArrowLeft, ArrowRight } from 'lucide-react';
import StepIndicator from '../components/StepIndicator';

// Admin Steps
import Step1Upload from './admin/Step1Upload';
import Step2SystemIdentity from './admin/Step2SystemIdentity';
import Step3PipelineConfig from './admin/Step3PipelineConfig';
import Step4RunPipeline from './admin/Step4RunPipeline';

const AdminInterface = () => {

  // ----------------------------------------------------
  // PIPELINE STATE
  // ----------------------------------------------------
  const [pipelineStep, setPipelineStep] = useState(0); // 0-indexed for StepIndicator
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState('idle'); // idle, running, completed, failed
  const [pipelineMessage, setPipelineMessage] = useState('');
  const [pipelineResult, setPipelineResult] = useState(null);
  const [pipelineLogs, setPipelineLogs] = useState([]);
  
  // Agent states
  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentStatus, setAgentStatus] = useState("idle");
  const [agentLogs, setAgentLogs] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  
  // System Prompt states
  const [systemPrompt, setSystemPrompt] = useState("");
  const [promptUseCase, setPromptUseCase] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const [pipelineConfig, setPipelineConfig] = useState({
    skip_enrichment: false,
    use_knowledge_graph: true,
    use_cross_encoder_reranker: true,
    wipe_data_on_pipeline_run: true,
    graph_search_hops: 1,
    enrichment_provider: 'ollama',
    generation_provider: 'ollama',
    embedding_provider: 'local',
    anthropic_api_key: '',
    openai_api_key: '',
    custom_llm_base_url: '',
    custom_llm_api_key: '',
    custom_llm_model: '',
    ollama_model: 'qwen2.5:7b',
    child_chunk_size: 256,
    parent_chunk_size: 1024,
    child_chunk_overlap: 20,
    top_k_retrieval: 20,
    top_k_rerank: 5,
    max_agent_iterations: 3
  });
  const fileInputRef = useRef(null);



  // ----------------------------------------------------
  // EFFECTS: PIPELINE
  // ----------------------------------------------------
  useEffect(() => {
    fetchDocuments();
    fetchSystemPrompt();
  }, []);

  useEffect(() => {
    let interval;
    if (pipelineStatus === 'running') {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/pipeline/status');
          const data = await res.json();
          setPipelineStatus(data.status);
          setPipelineMessage(data.message);
          if (data.result) setPipelineResult(data.result);
        } catch (error) {
          console.error("Failed to fetch pipeline status:", error);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [pipelineStatus]);

  useEffect(() => {
    let eventSource;
    if (pipelineStatus === 'running') {
      setPipelineLogs([]); 
      eventSource = new EventSource('/api/system/logs/stream');
      eventSource.onmessage = (event) => setPipelineLogs(prev => [...prev, event.data].slice(-500));
    } else {
      if (eventSource) eventSource.close();
    }
    return () => { if (eventSource) eventSource.close(); };
  }, [pipelineStatus]);

  useEffect(() => {
    let intervalId;
    if (agentStatus === 'running') {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch('/api/agent/status');
          if (res.ok) {
            const data = await res.json();
            setAgentStatus(data.status);
            setAgentLogs(data.logs || []);
            if (data.status === 'completed' || data.status === 'failed') {
              clearInterval(intervalId);
              fetchDocuments(); 
            }
          }
        } catch (err) {}
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [agentStatus]);



  // ----------------------------------------------------
  // PIPELINE HANDLERS
  // ----------------------------------------------------
  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPipelineConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.files || []);
      }
    } catch (err) {}
  };

  const handleDeleteDoc = async (filename) => {
    if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
      try {
        const res = await fetch(`/api/documents/${filename}`, { method: 'DELETE' });
        if (res.ok) fetchDocuments();
      } catch (err) {}
    }
  };

  const handleFileChange = (e) => setFiles(Array.from(e.target.files));

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploadStatus('uploading');
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      if (response.ok) {
        setUploadStatus('success');
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDocuments();
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      setUploadStatus('error');
    }
  };

  const startPipeline = async () => {
    try {
      let payload = { ...pipelineConfig };
      if (payload.enrichment_provider === 'groq') {
        payload.enrichment_provider = 'custom';
        payload.custom_llm_base_url = 'https://api.groq.com/openai/v1';
      }
      if (payload.generation_provider === 'groq') {
        payload.generation_provider = 'custom';
        payload.custom_llm_base_url = 'https://api.groq.com/openai/v1';
      }

      const response = await fetch('/api/pipeline/run', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setPipelineStatus('running');
        setPipelineMessage('Pipeline execution started...');
        setPipelineResult(null);
      } else {
        const errorData = await response.json();
        setPipelineMessage(`> Error: ${errorData.detail || 'Failed to start pipeline'}`);
        setPipelineStatus('failed');
      }
    } catch (error) {
      setPipelineMessage(`> Error: Could not connect to server`);
      setPipelineStatus('failed');
    }
  };

  const handleReset = async () => {
    if (window.confirm("ARE YOU SURE? This will permanently delete all uploaded PDFs and reset the workspace data.")) {
      try {
        setPipelineMessage('Wiping system data...');
        const response = await fetch('/api/pipeline/reset', { method: 'DELETE' });
        if (response.ok) {
          const data = await response.json();
          setPipelineMessage(`> ${data.message}`);
          setPipelineStatus('idle');
          setPipelineResult(null);
          fetchDocuments();
        } else {
          setPipelineMessage('> Error: Failed to reset system.');
        }
      } catch (error) {}
    }
  };

  const handleRunAgent = async () => {
    if (!agentPrompt.trim()) return;
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: agentPrompt })
      });
      if (res.ok) {
        setAgentStatus('running');
        setAgentLogs([]);
      }
    } catch (err) {}
  };

  const fetchSystemPrompt = async () => {
    try {
      const res = await fetch('/api/system/prompt');
      if (res.ok) {
        const data = await res.json();
        setSystemPrompt(data.system_prompt || "");
      }
    } catch (err) {}
  };

  const handleSavePrompt = async () => {
    try {
      const res = await fetch('/api/system/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt: systemPrompt })
      });
      if (res.ok) alert("System prompt saved successfully!");
    } catch (err) {}
  };

  const handleGeneratePrompt = async () => {
    if (!promptUseCase.trim()) return;
    setIsGeneratingPrompt(true);
    try {
      const res = await fetch('/api/system/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ use_case: promptUseCase })
      });
      if (res.ok) {
        const data = await res.json();
        setSystemPrompt(data.system_prompt);
      }
    } catch (err) {
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleResetAgent = async () => {
    try {
      await fetch('/api/agent/reset', { method: 'POST' });
      setAgentStatus('idle');
      setAgentLogs([]);
      setAgentPrompt('');
    } catch (err) {}
  };



  const pipelineSteps = [
    { id: 'upload', label: 'Upload Data' },
    { id: 'identity', label: 'System Identity' },
    { id: 'config', label: 'Pipeline Config' },
    { id: 'execute', label: 'Execute' }
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
                to="/evaluate"
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all text-text-secondary hover:text-text-primary hover:bg-surface-high"
              >
                <BarChart3 className="w-4 h-4" /> Evaluation Portal
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-12 py-12">
        <div className="animate-fade-in space-y-12">
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-text-primary mb-2">System Admin</h1>
              <p className="text-text-secondary font-sans">Configure your end-to-end RAG pipeline, ingest documents, and index them into vector and graph databases.</p>
            </div>

            <StepIndicator steps={pipelineSteps} currentStep={pipelineStep} onStepClick={(i) => setPipelineStep(i)} />

            <div className="mt-12">
              {pipelineStep === 0 && (
                <Step1Upload 
                  files={files} fileInputRef={fileInputRef} handleFileChange={handleFileChange} handleUpload={handleUpload}
                  uploadStatus={uploadStatus} documents={documents} setPreviewDoc={setPreviewDoc} handleDeleteDoc={handleDeleteDoc}
                  agentPrompt={agentPrompt} setAgentPrompt={setAgentPrompt} agentStatus={agentStatus} handleRunAgent={handleRunAgent}
                  handleResetAgent={handleResetAgent} agentLogs={agentLogs}
                />
              )}
              {pipelineStep === 1 && (
                <Step2SystemIdentity 
                  promptUseCase={promptUseCase} setPromptUseCase={setPromptUseCase} isGeneratingPrompt={isGeneratingPrompt}
                  handleGeneratePrompt={handleGeneratePrompt} systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt}
                  handleSavePrompt={handleSavePrompt}
                />
              )}
              {pipelineStep === 2 && (
                <Step3PipelineConfig pipelineConfig={pipelineConfig} handleConfigChange={handleConfigChange} />
              )}
              {pipelineStep === 3 && (
                <Step4RunPipeline 
                  pipelineStatus={pipelineStatus} pipelineMessage={pipelineMessage} pipelineResult={pipelineResult}
                  pipelineLogs={pipelineLogs} startPipeline={startPipeline} handleReset={handleReset}
                  pipelineConfig={pipelineConfig} systemPrompt={systemPrompt}
                />
              )}

              {/* Navigation Controls */}
              <div className="flex justify-between mt-8 pt-8 border-t border-border">
                <button
                  onClick={() => setPipelineStep(prev => Math.max(0, prev - 1))}
                  disabled={pipelineStep === 0 || pipelineStatus === 'running'}
                  className="py-3 px-6 bg-surface-high border border-border text-text-primary font-sans text-sm font-semibold rounded-xl hover:border-primary disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> BACK
                </button>
                <button
                  onClick={() => setPipelineStep(prev => Math.min(3, prev + 1))}
                  disabled={pipelineStep === 3 || pipelineStatus === 'running'}
                  className="py-3 px-6 bg-primary text-white font-sans text-sm font-semibold rounded-xl hover:bg-primary-light disabled:opacity-50 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                >
                  NEXT STEP <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
      </main>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-fade-in">
          <div className="bg-surface-highest border border-border rounded-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-dark">
              <h3 className="font-sans font-semibold text-primary">{previewDoc}</h3>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-lg bg-surface hover:bg-error/10 text-text-secondary hover:text-error transition-colors font-sans text-sm font-medium"
              >
                Close (ESC)
              </button>
            </div>
            <div className="flex-grow bg-white">
              <iframe 
                src={`/api/documents/${previewDoc}`} 
                title="Document Preview" 
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInterface;
