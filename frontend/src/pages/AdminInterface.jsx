import React, { useState, useEffect, useRef } from 'react';

const AdminInterface = ({ isDark }) => {
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState('idle'); // idle, running, completed, failed
  const [pipelineMessage, setPipelineMessage] = useState('');
  const [pipelineResult, setPipelineResult] = useState(null);
  const fileInputRef = useRef(null);

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
      const response = await fetch('/api/pipeline/run', { method: 'POST' });
      if (response.ok) {
        setPipelineStatus('running');
        setPipelineMessage('Pipeline execution started...');
        setPipelineResult(null);
      }
    } catch (error) {
      console.error("Failed to start pipeline", error);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-background text-on-surface' : 'bg-background text-on-surface'}`}>
      <div className="max-w-4xl mx-auto p-8">
        <header className="mb-12">
          <h1 className="text-headline-xl font-headline-xl text-primary mb-2">System Admin</h1>
          <p className="text-body-lg text-on-surface-variant font-mono">DOCUMENT INGESTION & PIPELINE CONTROL</p>
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
            </div>
          </div>

          {/* Pipeline Section */}
          <div className="border border-outline-variant rounded-none p-6 bg-surface-container">
            <h2 className="text-headline-md font-headline-md mb-4 text-secondary">2. Processing Pipeline</h2>
            <div className="space-y-6">
              <p className="text-body-sm text-on-surface-variant">
                Run the ingestion and indexing pipeline. This will chunk the uploaded documents, enrich them, and populate the Qdrant and Neo4j databases.
              </p>
              
              <button 
                onClick={startPipeline}
                disabled={pipelineStatus === 'running'}
                className="w-full py-3 bg-secondary text-on-secondary font-mono text-sm uppercase hover:bg-secondary-fixed-dim disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {pipelineStatus === 'running' && (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                )}
                {pipelineStatus === 'running' ? 'PIPELINE RUNNING' : 'START PIPELINE'}
              </button>

              {/* Status Terminal */}
              <div className="bg-[#0c1324] dark:bg-[#060908] border border-outline-variant p-4 h-48 overflow-y-auto">
                <div className="font-mono text-xs text-primary space-y-2">
                  <p>&gt; SYSTEM STATUS: {pipelineStatus.toUpperCase()}</p>
                  {pipelineMessage && <p className="text-on-surface-variant">&gt; {pipelineMessage}</p>}
                  
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
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminInterface;
