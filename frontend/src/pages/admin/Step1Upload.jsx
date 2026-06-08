import React from 'react';
import TerminalOutput from '../../components/TerminalOutput';

const Step1Upload = ({
  files,
  fileInputRef,
  handleFileChange,
  handleUpload,
  uploadStatus,
  documents,
  setPreviewDoc,
  handleDeleteDoc,
  agentPrompt,
  setAgentPrompt,
  agentStatus,
  handleRunAgent,
  handleResetAgent,
  agentLogs
}) => {
  return (
    <>
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
              <h3 className="font-mono text-sm text-primary uppercase mb-3">Workspace Documents</h3>
              <div className="font-mono text-xs text-on-surface space-y-2 max-h-64 overflow-y-auto pr-2">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border border-outline-variant bg-surface">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <svg className="w-4 h-4 text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="truncate">
                        <p className="truncate font-bold text-primary">{doc.name || doc}</p>
                        {doc.size_kb !== undefined && (
                          <p className="text-[10px] text-on-surface-variant">
                            {doc.size_kb} KB • {new Date(doc.modified * 1000).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <button onClick={() => setPreviewDoc(doc.name || doc)} className="px-2 py-1 bg-secondary text-background hover:bg-secondary-fixed-dim transition-colors uppercase text-[10px] font-bold">View</button>
                      <button onClick={() => handleDeleteDoc(doc.name || doc)} className="px-2 py-1 bg-error text-on-error hover:opacity-80 transition-colors uppercase text-[10px] font-bold">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agentic Ingestion Section */}
      <div className="border border-outline-variant rounded-none p-6 bg-surface-container">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-headline-md font-headline-md text-secondary">OR: Agentic Ingestion</h2>
          {agentStatus === 'running' && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span></span>}
        </div>
        
        <div className="space-y-4">
          <p className="font-mono text-xs text-on-surface-variant">
            Command the AI Agent to search the web, find relevant PDFs, and download them into the system automatically.
          </p>
          
          <textarea
            value={agentPrompt}
            onChange={(e) => setAgentPrompt(e.target.value)}
            placeholder="e.g. Find and download the latest Tesla 10-K filings from SEC.gov"
            className="w-full h-24 bg-surface border border-outline-variant p-3 text-sm font-mono text-on-surface focus:outline-none focus:border-primary resize-none placeholder-on-surface-variant"
            disabled={agentStatus === 'running'}
          />
          
          <div className="flex gap-2">
            <button 
              onClick={handleRunAgent}
              disabled={!agentPrompt.trim() || agentStatus === 'running'}
              className="flex-1 py-3 bg-secondary text-on-secondary font-mono text-sm uppercase hover:bg-opacity-90 disabled:opacity-50 transition-all"
            >
              {agentStatus === 'running' ? 'AGENT RUNNING...' : 'COMMAND AGENT'}
            </button>
            {agentStatus === 'completed' || agentStatus === 'failed' ? (
              <button 
                onClick={handleResetAgent}
                className="px-4 py-3 bg-surface border border-outline-variant text-on-surface font-mono text-sm uppercase hover:border-primary transition-all"
              >
                RESET
              </button>
            ) : null}
          </div>

          {agentLogs.length > 0 && (
            <div className="mt-4">
              <TerminalOutput logs={agentLogs} height="max-h-96" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Step1Upload;
