import React from 'react';
import TerminalOutput from '../../components/TerminalOutput';
import { Upload, FileText, Trash2, Eye, Cpu, RefreshCw, Play, Database, Check } from 'lucide-react';

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
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="border border-border rounded-2xl p-6 md:p-8 bg-surface-high shadow-lg relative overflow-hidden">

        <h2 className="text-xl font-display font-semibold mb-6 text-text-primary flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Document Ingestion
        </h2>
        
        <div className="space-y-6 relative z-10">
          <div className="border-2 border-dashed border-border rounded-xl p-10 text-center bg-surface-highest hover:bg-surface-highest/80 hover:border-primary/50 transition-all cursor-pointer group"
               onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              multiple 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className="w-16 h-16 rounded-full bg-surface-dark flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="font-display text-sm font-semibold text-text-primary mb-1">
              {files.length > 0 ? `${files.length} files selected` : "Click to browse PDFs"}
            </p>
            <p className="font-sans text-xs text-text-muted">
              Only PDF files are supported currently.
            </p>
          </div>
          
          {files.length > 0 && (
            <ul className="font-mono text-xs text-text-secondary space-y-2 bg-surface-highest p-4 rounded-xl border border-border">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-primary" />
                  {f.name}
                </li>
              ))}
            </ul>
          )}

          <button 
            onClick={handleUpload}
            disabled={files.length === 0 || uploadStatus === 'uploading'}
            className="w-full py-4 bg-primary text-white font-sans text-sm font-semibold rounded-xl hover:bg-primary-light disabled:opacity-50 transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          >
            {uploadStatus === 'uploading' && <RefreshCw className="w-4 h-4 animate-spin" />}
            {uploadStatus === 'uploading' ? 'UPLOADING...' : 'UPLOAD DOCUMENTS'}
          </button>
          
          {uploadStatus === 'success' && <p className="text-accent font-sans text-xs flex items-center gap-1 justify-center"><Check className="w-3 h-3" /> Upload successful</p>}
          {uploadStatus === 'error' && <p className="text-error font-sans text-xs flex items-center gap-1 justify-center">Upload failed</p>}
          
          {documents.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="font-sans text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-secondary" />
                Workspace Documents
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-highest group hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-surface-dark flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                        <FileText className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                      </div>
                      <div className="truncate">
                        <p className="truncate font-sans text-sm font-medium text-text-primary">{doc.name || doc}</p>
                        {doc.size_kb !== undefined && (
                          <p className="text-xs text-text-muted mt-0.5">
                            {doc.size_kb} KB • {new Date(doc.modified * 1000).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setPreviewDoc(doc.name || doc)} className="p-2 rounded-md bg-surface-dark text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors" title="Preview">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteDoc(doc.name || doc)} className="p-2 rounded-md bg-surface-dark text-text-secondary hover:text-error hover:bg-error/10 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agentic Ingestion Section */}
      <div className="border border-border rounded-2xl p-6 md:p-8 bg-surface-high shadow-lg relative overflow-hidden">

        <div className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="text-xl font-display font-semibold text-text-primary flex items-center gap-2">
            <Cpu className="w-5 h-5 text-secondary" />
            Agentic Ingestion
          </h2>
          {agentStatus === 'running' && (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
            </span>
          )}
        </div>
        
        <div className="space-y-5 relative z-10">
          <p className="font-sans text-sm text-text-secondary leading-relaxed">
            Command the AI Agent to search the web, find relevant PDFs, and download them into the system automatically.
          </p>
          
          <div className="relative">
            <textarea
              value={agentPrompt}
              onChange={(e) => setAgentPrompt(e.target.value)}
              placeholder="e.g. Find and download the latest Tesla 10-K filings from SEC.gov"
              className="w-full h-32 bg-surface-highest border border-border p-4 rounded-xl text-sm font-sans text-text-primary focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 resize-none placeholder-text-muted transition-all"
              disabled={agentStatus === 'running'}
            />
            <div className="absolute bottom-4 right-4 text-xs font-mono text-text-muted">
              {agentPrompt.length} chars
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleRunAgent}
              disabled={!agentPrompt.trim() || agentStatus === 'running'}
              className="flex-1 py-3.5 bg-secondary text-surface-dark font-sans font-bold text-sm rounded-xl hover:bg-secondary-light disabled:opacity-50 transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
            >
              {agentStatus === 'running' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  AGENT RUNNING...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  COMMAND AGENT
                </>
              )}
            </button>
            {agentStatus === 'completed' || agentStatus === 'failed' ? (
              <button 
                onClick={handleResetAgent}
                className="px-6 py-3.5 bg-surface border border-border text-text-primary font-sans font-medium text-sm rounded-xl hover:border-text-secondary transition-all"
              >
                RESET
              </button>
            ) : null}
          </div>

          {agentLogs.length > 0 && (
            <div className="mt-6">
              <TerminalOutput logs={agentLogs} height="max-h-96" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step1Upload;
