import React, { useState, useEffect, useRef } from 'react';

const AdminInterface = ({ toggleTheme, isDark }) => {
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState('idle'); // idle, running, completed, failed
  const [pipelineMessage, setPipelineMessage] = useState('');
  const [pipelineResult, setPipelineResult] = useState(null);
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
      const response = await fetch('/api/pipeline/run', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pipelineConfig)
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

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-background text-on-surface' : 'bg-background text-on-surface'}`}>
      <div className="max-w-4xl mx-auto p-8">
        <header className="mb-12 flex justify-between items-start">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Upload Section */}
          <div className="border border-outline-variant rounded-none p-6 bg-surface-container">
            <h2 className="text-headline-md font-headline-md mb-4 text-secondary">1. Document Upload</h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-outline-variant p-8 text-center bg-surface hover:bg-surface-variant transition-colors cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <p className="font-mono text-sm text-on-surface-variant">
                  {files.length > 0 ? `${files.length} files selected` : "CLICK TO BROWSE PDFS"}
                </p>
              </div>
              
              {files.length > 0 && (
                <ul className="font-mono text-xs text-on-surface-variant space-y-1">
                  {files.map((f, i) => <li key={i}>&gt; {f.name}</li>)}
                </ul>
              )}

              <button 
                onClick={handleUpload}
                disabled={files.length === 0 || uploadStatus === 'uploading'}
                className="w-full py-3 bg-primary text-on-primary font-mono text-sm uppercase hover:bg-primary-fixed-dim disabled:opacity-50 transition-all"
              >
                {uploadStatus === 'uploading' ? 'UPLOADING...' : 'UPLOAD DOCUMENTS'}
              </button>
              
              {uploadStatus === 'success' && <p className="text-primary font-mono text-xs">✓ Upload successful</p>}
              {uploadStatus === 'error' && <p className="text-error font-mono text-xs">✗ Upload failed</p>}
              
              {documents.length > 0 && (
                <div className="mt-6 pt-6 border-t border-outline-variant">
                  <h3 className="font-mono text-sm text-primary uppercase mb-3">Uploaded Documents</h3>
                  <ul className="font-mono text-xs text-on-surface space-y-2 max-h-48 overflow-y-auto">
                    {documents.map((doc, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Configuration Section */}
          <div className="border border-outline-variant rounded-none p-6 bg-surface-container md:col-span-2">
            <h2 className="text-headline-md font-headline-md mb-4 text-secondary">2. Pipeline Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-mono text-sm text-primary uppercase">Provider Settings</h3>
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">Enrichment Provider</label>
                  <select name="enrichment_provider" value={pipelineConfig.enrichment_provider} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary">
                    <option value="ollama">Ollama (Local - Free)</option>
                    <option value="claude">Claude (Cloud - Paid)</option>
                    <option value="custom">Custom (OpenAI Compatible)</option>
                  </select>
                </div>
                {pipelineConfig.enrichment_provider === 'claude' && (
                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">Anthropic API Key</label>
                    <input type="password" name="anthropic_api_key" value={pipelineConfig.anthropic_api_key} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="sk-ant-..." />
                  </div>
                )}
                <div className="pt-2">
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">Generation Provider (For Querying)</label>
                  <select name="generation_provider" value={pipelineConfig.generation_provider} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary">
                    <option value="ollama">Ollama (Local - Free)</option>
                    <option value="claude">Claude (Cloud - Paid)</option>
                    <option value="custom">Custom (OpenAI Compatible)</option>
                  </select>
                </div>
                {pipelineConfig.generation_provider === 'claude' && pipelineConfig.enrichment_provider !== 'claude' && (
                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">Anthropic API Key</label>
                    <input type="password" name="anthropic_api_key" value={pipelineConfig.anthropic_api_key} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="sk-ant-..." />
                  </div>
                )}
                {(pipelineConfig.enrichment_provider === 'custom' || pipelineConfig.generation_provider === 'custom') && (
                  <div className="space-y-2 p-3 border border-outline-variant bg-surface-variant/30">
                    <div>
                      <label className="block text-xs font-mono text-on-surface-variant mb-1">Custom Base URL</label>
                      <input type="text" name="custom_llm_base_url" value={pipelineConfig.custom_llm_base_url} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="https://api.groq.com/openai/v1" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-on-surface-variant mb-1">Custom Model Name</label>
                      <input type="text" name="custom_llm_model" value={pipelineConfig.custom_llm_model} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="llama3-70b-8192" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-on-surface-variant mb-1">Custom API Key</label>
                      <input type="password" name="custom_llm_api_key" value={pipelineConfig.custom_llm_api_key} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="gsk_..." />
                    </div>
                  </div>
                )}
                {pipelineConfig.enrichment_provider === 'ollama' && pipelineConfig.generation_provider === 'ollama' && (
                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">Ollama Model</label>
                    <input type="text" name="ollama_model" value={pipelineConfig.ollama_model} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="qwen2.5:7b" />
                  </div>
                )}
                <div className="pt-2">
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">Embedding Provider</label>
                  <select name="embedding_provider" value={pipelineConfig.embedding_provider} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary">
                    <option value="local">Local (BGE-Large-v1.5)</option>
                    <option value="openai">OpenAI (text-embedding-3-large)</option>
                  </select>
                </div>
                {pipelineConfig.embedding_provider === 'openai' && (
                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">OpenAI API Key</label>
                    <input type="password" name="openai_api_key" value={pipelineConfig.openai_api_key} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="sk-proj-..." />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="font-mono text-sm text-primary uppercase">Advanced Tuning</h3>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="wipe_data_on_pipeline_run" name="wipe_data_on_pipeline_run" checked={pipelineConfig.wipe_data_on_pipeline_run} onChange={handleConfigChange} className="w-4 h-4 accent-primary" />
                  <label htmlFor="wipe_data_on_pipeline_run" className="text-sm font-mono text-on-surface cursor-pointer">Wipe Data on Run (Uncheck for Append Mode)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="skip_enrichment" name="skip_enrichment" checked={pipelineConfig.skip_enrichment} onChange={handleConfigChange} className="w-4 h-4 accent-primary" />
                  <label htmlFor="skip_enrichment" className="text-sm font-mono text-on-surface cursor-pointer">Skip Enrichment (Faster pipeline, less contextual metadata)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="use_knowledge_graph" name="use_knowledge_graph" checked={pipelineConfig.use_knowledge_graph} onChange={handleConfigChange} className="w-4 h-4 accent-primary" />
                  <label htmlFor="use_knowledge_graph" className="text-sm font-mono text-on-surface cursor-pointer">Use Knowledge Graph (Neo4j extraction & multi-hop retrieval)</label>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <input type="checkbox" id="use_cross_encoder_reranker" name="use_cross_encoder_reranker" checked={pipelineConfig.use_cross_encoder_reranker} onChange={handleConfigChange} className="w-4 h-4 accent-primary" />
                  <label htmlFor="use_cross_encoder_reranker" className="text-sm font-mono text-on-surface cursor-pointer">Use Cross-Encoder Reranker (Slower but more precise)</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">Child Chunk Size</label>
                    <input type="number" name="child_chunk_size" value={pipelineConfig.child_chunk_size} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">Parent Chunk Size</label>
                    <input type="number" name="parent_chunk_size" value={pipelineConfig.parent_chunk_size} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">Top-K Retrieval</label>
                    <input type="number" name="top_k_retrieval" value={pipelineConfig.top_k_retrieval} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">Top-K Rerank</label>
                    <input type="number" name="top_k_rerank" value={pipelineConfig.top_k_rerank} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">Graph Search Depth (Hops)</label>
                    <input type="number" name="graph_search_hops" min="1" max="3" value={pipelineConfig.graph_search_hops} onChange={handleConfigChange} className="w-full bg-surface border border-outline-variant p-2 text-sm text-on-surface focus:outline-none focus:border-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline Section */}
          <div className="border border-outline-variant rounded-none p-6 bg-surface-container md:col-span-2">
            <h2 className="text-headline-md font-headline-md mb-4 text-secondary">3. Processing Pipeline</h2>
            <div className="space-y-6">
              <p className="text-body-sm text-on-surface-variant">
                Run the ingestion and indexing pipeline. This will chunk the uploaded documents, enrich them, and populate the Qdrant and Neo4j databases.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={startPipeline}
                  disabled={pipelineStatus === 'running'}
                  className="flex-1 py-3 bg-secondary text-on-secondary font-mono text-sm uppercase hover:bg-secondary-fixed-dim disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                >
                  {pipelineStatus === 'running' && (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                  )}
                  {pipelineStatus === 'running' ? 'PIPELINE RUNNING' : 'START PIPELINE'}
                </button>

                <button 
                  onClick={handleReset}
                  disabled={pipelineStatus === 'running'}
                  className="flex-1 py-3 bg-error text-on-error font-mono text-sm uppercase hover:bg-[#ff5449] disabled:opacity-50 transition-all"
                >
                  RESET SYSTEM
                </button>
              </div>

              {/* Status Terminal */}
              <div className="bg-[#0c1324] dark:bg-[#060908] border border-outline-variant p-4 h-48 overflow-y-auto">
                <div className="font-mono text-xs text-white space-y-2">
                  <p>&gt; SYSTEM STATUS: {pipelineStatus.toUpperCase()}</p>
                  {pipelineMessage && <p>&gt; {pipelineMessage}</p>}
                  
                  {pipelineResult && (
                    <div className="mt-4 pt-4 border-t border-outline-variant text-tertiary">
                      <p className="text-secondary mb-2">INDEXING RESULTS:</p>
                      <ul className="space-y-1">
                        <li>Qdrant Vectors: {pipelineResult.indexing.qdrant_points}</li>
                        <li>BM25 Chunks: {pipelineResult.indexing.bm25_chunks}</li>
                        <li>Neo4j Nodes: {pipelineResult.indexing.neo4j_nodes}</li>
                        <li>Neo4j Edges: {pipelineResult.indexing.neo4j_edges}</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {pipelineStatus === 'completed' && (
                <div className="mt-4 pt-4 border-t border-outline-variant flex justify-end">
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="py-3 px-8 bg-primary text-on-primary font-mono text-sm uppercase hover:bg-primary-fixed-dim transition-all shadow-md flex items-center gap-2"
                  >
                    LAUNCH CHAT INTERFACE
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminInterface;
