import React, { useState, useEffect, useRef } from 'react';
import Step1Upload from './admin/Step1Upload';
import Step2SystemIdentity from './admin/Step2SystemIdentity';
import Step3PipelineConfig from './admin/Step3PipelineConfig';
import Step4RunPipeline from './admin/Step4RunPipeline';

const AdminInterface = ({ toggleTheme, isDark }) => {
  const [currentStep, setCurrentStep] = useState(1);
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
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  const handleDeleteDoc = async (filename) => {
    if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
      try {
        const res = await fetch(`/api/documents/${filename}`, { method: 'DELETE' });
        if (res.ok) fetchDocuments();
      } catch (err) {
        console.error("Failed to delete document", err);
      }
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Poll pipeline status
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

  // Stream pipeline logs via SSE
  useEffect(() => {
    let eventSource;
    if (pipelineStatus === 'running') {
      setPipelineLogs([]); // Clear before starting
      eventSource = new EventSource('/api/system/logs/stream');
      
      eventSource.onmessage = (event) => {
        setPipelineLogs(prev => {
          const newLogs = [...prev, event.data];
          return newLogs.slice(-500); // Keep last 500 lines
        });
      };

      eventSource.onerror = (error) => {
        console.error("EventSource failed:", error);
        if (eventSource.readyState === EventSource.CLOSED) {
          // Connection closed by server
        }
      };
    } else {
      if (eventSource) eventSource.close();
    }
    
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [pipelineStatus]);


  // Poll agent status
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
              fetchDocuments(); // Refresh documents
            }
          }
        } catch (err) {
          console.error("Failed to fetch agent status", err);
        }
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [agentStatus]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploadStatus('uploading');
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        setUploadStatus('success');
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDocuments();
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus('error');
    }
  };

  const startPipeline = async () => {
    try {
      let payload = { ...pipelineConfig };
      
      // Auto-configure Groq mapping
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
        headers: {
          'Content-Type': 'application/json'
        },
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
      console.error("Failed to start pipeline", error);
      setPipelineMessage(`> Error: Could not connect to server`);
      setPipelineStatus('failed');
    }
  };

  const handleReset = async () => {
    if (window.confirm("ARE YOU SURE? This will permanently delete all uploaded PDFs and reset the workspace data. The databases will be fully overwritten on the next pipeline run.")) {
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
      } catch (error) {
        console.error("Failed to reset system", error);
        setPipelineMessage('> Error: Could not connect to server.');
      }
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
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSystemPrompt = async () => {
    try {
      const res = await fetch('/api/system/prompt');
      if (res.ok) {
        const data = await res.json();
        setSystemPrompt(data.system_prompt || "");
      }
    } catch (err) {
      console.error("Failed to fetch system prompt", err);
    }
  };

  useEffect(() => {
    fetchSystemPrompt();
  }, []);

  const handleSavePrompt = async () => {
    try {
      const res = await fetch('/api/system/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt: systemPrompt })
      });
      if (res.ok) {
        alert("System prompt saved successfully!");
      } else {
        alert("Failed to save system prompt.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving system prompt.");
    }
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
        alert("System prompt generated and saved!");
      } else {
        alert("Failed to generate system prompt.");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating system prompt.");
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
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-background text-on-surface' : 'bg-background text-on-surface'}`}>
      <div className="w-full px-4 md:px-12 py-8 mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-headline-xl font-headline-xl text-primary mb-2">System Admin</h1>
            <p className="text-body-lg text-on-surface-variant font-mono">DOCUMENT INGESTION & PIPELINE CONTROL</p>
          </div>
          <button onClick={toggleTheme} className="p-2 bg-surface border border-outline-variant hover:border-primary text-on-surface transition-colors cursor-pointer">
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </header>

        {/* Stepper Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {['Upload Documents', 'System Identity', 'Pipeline Config', 'Run Pipeline'].map((stepName, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isPast = currentStep > stepNumber;
              return (
                <div key={stepNumber} className="flex flex-col items-center relative z-10 w-1/4">
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
          <div className="relative -mt-11 top-4 h-1 bg-outline-variant z-0 mx-10">
            <div className="absolute top-0 left-0 h-full bg-primary transition-all duration-300" style={{ width: `${((currentStep - 1) / 3) * 100}%` }}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          
          {currentStep === 1 && (
            <Step1Upload 
              files={files}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              handleUpload={handleUpload}
              uploadStatus={uploadStatus}
              documents={documents}
              setPreviewDoc={setPreviewDoc}
              handleDeleteDoc={handleDeleteDoc}
              agentPrompt={agentPrompt}
              setAgentPrompt={setAgentPrompt}
              agentStatus={agentStatus}
              handleRunAgent={handleRunAgent}
              handleResetAgent={handleResetAgent}
              agentLogs={agentLogs}
            />
          )}

          {currentStep === 2 && (
            <Step2SystemIdentity 
              promptUseCase={promptUseCase}
              setPromptUseCase={setPromptUseCase}
              isGeneratingPrompt={isGeneratingPrompt}
              handleGeneratePrompt={handleGeneratePrompt}
              systemPrompt={systemPrompt}
              setSystemPrompt={setSystemPrompt}
              handleSavePrompt={handleSavePrompt}
            />
          )}

          {currentStep === 3 && (
            <Step3PipelineConfig 
              pipelineConfig={pipelineConfig}
              handleConfigChange={handleConfigChange}
            />
          )}

          {currentStep === 4 && (
            <Step4RunPipeline 
              pipelineStatus={pipelineStatus}
              pipelineMessage={pipelineMessage}
              pipelineResult={pipelineResult}
              pipelineLogs={pipelineLogs}
              startPipeline={startPipeline}
              handleReset={handleReset}
              pipelineConfig={pipelineConfig}
              systemPrompt={systemPrompt}
            />
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between mt-8 border-t border-outline-variant pt-6">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || pipelineStatus === 'running'}
              className="py-3 px-8 bg-surface border border-outline-variant text-on-surface font-mono text-sm uppercase hover:border-primary disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              BACK
            </button>
            <button
              onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
              disabled={currentStep === 4 || pipelineStatus === 'running'}
              className="py-3 px-8 bg-primary text-on-primary font-mono text-sm uppercase hover:bg-primary-fixed-dim disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
            >
              NEXT STEP
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>

        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-surface border border-outline-variant w-full max-w-6xl h-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant">
              <h3 className="font-mono text-primary font-bold">{previewDoc}</h3>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="p-2 bg-error/10 text-error hover:bg-error hover:text-on-error transition-colors font-mono text-xs uppercase"
              >
                Close (ESC)
              </button>
            </div>
            <div className="flex-grow overflow-hidden bg-white">
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
