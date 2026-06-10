import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Moon, Sun, ArrowRight, Paperclip, Lock, 
  Cpu, Search, Network, FileText, Scale,
  Copy, Flag, BookOpen, RotateCw, Layers, Server,
  ChevronDown, ChevronUp, Activity, Terminal,
  Trash2, AlertTriangle, Info
} from 'lucide-react';
import { getSession, saveSession } from '../utils/chatDb';
import Sidebar from '../components/Sidebar';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useCrag, setUseCrag] = useState(true);
  const [useGraph, setUseGraph] = useState(true);
  const [useReranker, setUseReranker] = useState(true);
  const [useCitations, setUseCitations] = useState(true);
  const [tracePanelOpen, setTracePanelOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [storageWarning, setStorageWarning] = useState(null);
  const messagesEndRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = new URLSearchParams(location.search).get('session');

  // Load session on mount or when sessionId changes
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        setMessages([]);
        return;
      }
      try {
        const session = await getSession(sessionId);
        if (session && session.messages) {
          setMessages(session.messages);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    loadSession();
  }, [sessionId]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userQuery = inputValue.trim();
    
    // Add User Message to State
    const newUserMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const newMessages = [...messages, newUserMsg];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    let currentId = sessionId;
    let sessionTitle = messages.length > 0 ? undefined : userQuery.slice(0, 30) + (userQuery.length > 30 ? '...' : '');

    if (!currentId) {
      currentId = 'session_' + Date.now();
      navigate(`/chat?session=${currentId}`, { replace: true });
    } else {
      try {
        const existingSession = await getSession(currentId);
        if (existingSession && existingSession.title) {
          sessionTitle = existingSession.title;
        }
      } catch (err) {}
    }

    try {
      await saveSession({
        id: currentId,
        title: sessionTitle || 'New Chat',
        updatedAt: Date.now(),
        messages: newMessages
      });
    } catch (err) {
      if (err.message === 'QuotaExceededError') {
        setStorageWarning("Your browser storage is full. Please clear some chat history to save new messages.");
      }
    }

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          use_crag: useCrag,
          use_graph: useGraph,
          use_reranker: useReranker,
          use_citations: useCitations
        })
      });

      if (!response.ok) {
        throw new Error(`API returned status: ${response.status}`);
      }

      const data = await response.json();

      const newAssistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        citations: data.citations || [],
        crag_score: data.crag_score || 0,
        iterations: data.iterations || 0,
        chunks_used: data.chunks_used || 0,
        provider: data.provider || 'unknown',
        retrieval: data.retrieval || { vector_hits: 0, bm25_hits: 0, graph_hits: 0, candidates: 0 },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...newMessages, newAssistantMsg];
      setMessages(finalMessages);
      
      try {
        await saveSession({
          id: currentId,
          title: sessionTitle || 'New Chat',
          updatedAt: Date.now(),
          messages: finalMessages
        });
      } catch (err) {
        if (err.message === 'QuotaExceededError') {
          setStorageWarning("Your browser storage is full. Please clear some chat history to save new messages.");
        }
      }
    } catch (error) {
      console.error("Failed to fetch query:", error);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "An error occurred while connecting to the Ragfather API. Please check if the backend is running.",
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      const finalMessagesWithError = [...newMessages, errorMsg];
      setMessages(finalMessagesWithError);
      
      try {
        await saveSession({
          id: currentId,
          title: sessionTitle || 'New Chat',
          updatedAt: Date.now(),
          messages: finalMessagesWithError
        });
      } catch (err) {
        if (err.message === 'QuotaExceededError') {
          setStorageWarning("Your browser storage is full. Please clear some chat history to save new messages.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Get the latest assistant message to drive the metadata panel
  const latestAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' && !m.isError);

  return (
    <div className={`min-h-screen dark bg-surface-dark text-text-primary font-sans flex transition-colors duration-300`}>
      <Sidebar />
      
      {/* Main Layout Workspace */}
      <div className="flex-1 flex ml-64 h-screen bg-surface-dark transition-colors duration-300 relative overflow-hidden">
        
        {/* Background glow */}


        {/* Center Column: Chat Canvas */}
        <main className="flex-1 flex flex-col h-full border-r border-border relative z-10">
          
          {/* Context Header */}
          <header className="h-[72px] min-h-[72px] border-b border-border flex items-center justify-between px-8 bg-surface-highest/80 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-2 py-1 rounded">RAG_OS</span>
              <h2 className="font-display text-xl font-bold text-text-primary truncate flex items-center gap-2">
                {messages.length > 0 ? (
                  <>
                    <Activity className="w-5 h-5 text-accent" />
                    Analysis Active
                  </>
                ) : (
                  <>
                    <Terminal className="w-5 h-5 text-text-muted" />
                    Awaiting Query
                  </>
                )}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setTracePanelOpen(!tracePanelOpen)} className="md:hidden p-2 text-text-secondary hover:text-primary transition-colors border border-border rounded-lg">
                <Cpu className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Storage Warning Banner */}
          {storageWarning && (
            <div className="bg-error/10 border-b border-error/20 px-6 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-error flex-shrink-0" />
              <p className="text-sm font-sans text-error flex-1">{storageWarning}</p>
            </div>
          )}

          {/* Storage Info Banner */}
          <div className="bg-surface-high border-b border-border px-6 py-2 flex items-center justify-center gap-2 shadow-sm">
            <Info className="w-4 h-4 text-text-muted" />
            <p className="text-xs font-sans text-text-muted">
              Your chat history is stored locally in your browser. No data is saved on our servers.
            </p>
          </div>
          
          {/* Scrollable Chat History */}
          <div className="flex-1 overflow-y-auto px-6 md:px-16 lg:px-24 py-12 flex flex-col gap-12 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-70">
                <div className="w-24 h-24 rounded-full bg-surface-high border border-border flex items-center justify-center mb-8 shadow-2xl relative">

                   <Activity className="w-12 h-12 text-primary relative z-10" />
                </div>
                <h3 className="font-display text-3xl font-bold text-text-primary mb-3">
                  Ragfather Online
                </h3>
                <p className="font-sans text-sm text-text-secondary text-center max-w-md">
                  Specify your parameters below to initialize data retrieval and graph traversal.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <DocumentBlock key={msg.id} msg={msg} />
              ))
            )}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start opacity-70 animate-fade-in">
                <div className="flex flex-col gap-2 w-full max-w-3xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                      <Terminal className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-mono text-xs uppercase tracking-widest text-primary animate-pulse">System Processing</span>
                  </div>
                  <div className="flex items-center gap-2 h-8 pl-11">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="p-6 bg-surface-highest/90 backdrop-blur-md border-t border-border z-20">
            <div className="max-w-4xl mx-auto">
              <div className="relative flex items-end gap-3 bg-surface border border-border rounded-2xl p-2 shadow-inner focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <button className="p-3 text-text-muted hover:text-primary transition-colors flex-shrink-0 bg-surface-high rounded-xl">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 py-3 px-2">
                  <textarea 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-none focus:ring-0 text-text-primary font-sans text-base resize-none min-h-[24px] max-h-[200px] outline-none custom-scrollbar" 
                    placeholder="Ask Ragfather anything..." 
                    rows={1}
                    disabled={isLoading}
                  />
                </div>
                <button 
                  onClick={handleSubmit}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-3 bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-light transition-colors flex-shrink-0 flex items-center justify-center rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap justify-between items-center px-2">
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                    className="flex items-center gap-1 font-sans text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
                  >
                    Advanced Options {advancedOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <AnimatePresence>
                    {advancedOpen && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-4 items-center mt-2"
                      >
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" checked={useCrag} onChange={e => setUseCrag(e.target.checked)} className="accent-primary w-4 h-4 rounded bg-surface border-border" disabled={isLoading} />
                          <span className="font-sans text-xs font-medium text-text-secondary group-hover:text-primary transition-colors">CRAG Check</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" checked={useGraph} onChange={e => setUseGraph(e.target.checked)} className="accent-primary w-4 h-4 rounded bg-surface border-border" disabled={isLoading} />
                          <span className="font-sans text-xs font-medium text-text-secondary group-hover:text-primary transition-colors">Knowledge Graph</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" checked={useReranker} onChange={e => setUseReranker(e.target.checked)} className="accent-primary w-4 h-4 rounded bg-surface border-border" disabled={isLoading} />
                          <span className="font-sans text-xs font-medium text-text-secondary group-hover:text-primary transition-colors">Cross-Encoder</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" checked={useCitations} onChange={e => setUseCitations(e.target.checked)} className="accent-primary w-4 h-4 rounded bg-surface border-border" disabled={isLoading} />
                          <span className="font-sans text-xs font-medium text-text-secondary group-hover:text-primary transition-colors">Source Citations</span>
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="hidden sm:block font-sans text-[10px] text-text-muted mt-2 self-start">
                  Enter to send, Shift+Enter for new line
                </div>
              </div>
            </div>
          </div>
        </main>
        
        {/* Right Column: Execution Trace Panel */}
        <AnimatePresence>
          {tracePanelOpen && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-surface-highest border-l border-border flex flex-col h-full overflow-y-auto custom-scrollbar relative z-20"
            >
              <header className="h-[72px] min-h-[72px] border-b border-border flex items-center justify-between px-6 sticky top-0 bg-surface-highest/90 backdrop-blur-md z-10">
                <h3 className="font-display font-semibold text-text-primary flex items-center gap-2">
                  <Cpu className="text-primary w-4 h-4" />
                  Execution Trace
                </h3>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                </div>
              </header>
              
              {latestAssistantMessage ? (
                <div className="p-6 flex flex-col gap-6 animate-fade-in">
                  
                  {/* CRAG Score Instrumentation */}
                  <div className="bg-surface border border-border rounded-xl p-5 shadow-inner">
                    <div className="flex justify-between items-end mb-3">
                      <span className="font-sans text-sm font-semibold text-text-secondary">Confidence Index</span>
                      <span className="font-display text-3xl font-bold text-primary leading-none">
                        {Math.round(latestAssistantMessage.crag_score * 100)}<span className="text-lg">%</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-dark rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(latestAssistantMessage.crag_score * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full absolute top-0 left-0 rounded-full ${latestAssistantMessage.crag_score >= 0.85 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      />
                    </div>
                    <div className="mt-3 flex justify-between font-mono text-xs text-text-muted">
                      <span>Threshold: 85%</span>
                      <span className={latestAssistantMessage.crag_score >= 0.85 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {latestAssistantMessage.crag_score >= 0.85 ? "VERIFIED" : "WARNING"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Instrumental Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                      <span className="font-sans text-xs font-semibold text-text-secondary flex items-center gap-2 mb-2">
                        <Search className="w-3 h-3 text-accent" /> Vector Hits
                      </span>
                      <span className="font-mono text-2xl font-bold text-text-primary text-right">
                        {latestAssistantMessage.retrieval?.vector_hits || 0}
                      </span>
                    </div>
                    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                      <span className="font-sans text-xs font-semibold text-text-secondary flex items-center gap-2 mb-2">
                        <Network className="w-3 h-3 text-accent" /> Graph Nodes
                      </span>
                      <span className="font-mono text-2xl font-bold text-text-primary text-right">
                        {latestAssistantMessage.retrieval?.graph_hits || 0}
                      </span>
                    </div>
                    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                      <span className="font-sans text-xs font-semibold text-text-secondary flex items-center gap-2 mb-2">
                        <RotateCw className="w-3 h-3 text-primary" /> Iterations
                      </span>
                      <span className="font-mono text-2xl font-bold text-text-primary text-right">
                        {latestAssistantMessage.iterations || 0}
                      </span>
                    </div>
                    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                      <span className="font-sans text-xs font-semibold text-text-secondary flex items-center gap-2 mb-2">
                        <Layers className="w-3 h-3 text-primary" /> Chunks Used
                      </span>
                      <span className="font-mono text-2xl font-bold text-text-primary text-right">
                        {latestAssistantMessage.chunks_used || 0}
                      </span>
                    </div>
                  </div>

                  {/* Provider Info */}
                  <div className="border border-border bg-surface rounded-xl p-4 flex items-center justify-between">
                    <span className="font-sans text-sm font-semibold text-text-secondary flex items-center gap-2">
                      <Server className="w-4 h-4 text-primary" /> Engine
                    </span>
                    <span className="font-mono text-sm font-bold text-text-primary uppercase bg-surface-dark px-2 py-1 rounded">
                      {latestAssistantMessage.provider || 'unknown'}
                    </span>
                  </div>
                  
                  {/* Document Context Analyzed */}
                  {latestAssistantMessage.citations && latestAssistantMessage.citations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-sans text-sm font-semibold text-text-primary mb-3 flex items-center gap-2 border-b border-border pb-2">
                        <FileText className="w-4 h-4 text-accent" />
                        Context Mapping
                      </h4>
                      <ul className="flex flex-col gap-2">
                        {/* Dedup acts for display */}
                        {Array.from(new Set(latestAssistantMessage.citations.map(c => c.act))).map((act, idx) => (
                          <li key={idx} className="flex items-start gap-3 p-3 border border-border rounded-lg bg-surface hover:border-primary transition-colors cursor-default">
                            <FileText className="text-text-muted w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div className="flex flex-col overflow-hidden w-full">
                              <span className="font-sans text-sm font-medium text-text-primary truncate">{act}</span>
                              <div className="flex justify-between items-center mt-1">
                                <span className="font-mono text-[10px] text-text-muted bg-surface-dark px-1.5 py-0.5 rounded">
                                  {latestAssistantMessage.citations.filter(c => c.act === act).length} REFS
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                 <div className="p-8 flex flex-col items-center justify-center h-full opacity-50 text-center">
                   <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
                     <Cpu className="w-8 h-8 text-text-muted" />
                   </div>
                   <h4 className="font-sans font-semibold text-text-primary mb-1">Trace buffer empty</h4>
                   <p className="font-sans text-xs text-text-secondary">Run a query to populate telemetry.</p>
                 </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DocumentBlock({ msg }) {
  const isUser = msg.role === 'user';
  const [expandedCitation, setExpandedCitation] = useState(null);
  const [highlightedCitation, setHighlightedCitation] = useState(null);
  const citationRefs = useRef({});

  // Click handler for [Source N] inline links
  const handleSourceClick = useCallback((sourceIndex) => {
    setExpandedCitation(sourceIndex);
    setHighlightedCitation(sourceIndex);
    // Scroll citation card into view
    const el = citationRefs.current[sourceIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    // Remove highlight after 2s
    setTimeout(() => setHighlightedCitation(null), 2000);
  }, []);

  if (isUser) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end w-full">
        <div className="w-full max-w-2xl bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-none p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">U</span>
            </div>
            <span className="font-sans text-xs font-semibold text-primary">USER INQUIRY</span>
          </div>
          <h2 className="font-sans text-xl text-text-primary leading-relaxed">
            {msg.content}
          </h2>
        </div>
      </motion.div>
    );
  }

  // Post-process answer text: convert [Source N] to clickable spans
  const renderAnswerWithClickableSources = (content) => {
    if (!content) return null;
    const processedContent = content.replace(
      /\[Source\s+(\d+)\]/gi,
      (match, n) => `[Source ${n}]`
    );

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-4">{renderWithSourceLinks(children, handleSourceClick)}</p>,
          li: ({ children }) => <li className="mb-2">{renderWithSourceLinks(children, handleSourceClick)}</li>,
          h1: ({ children }) => <h1 className="text-2xl font-display font-bold mt-8 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-display font-bold mt-6 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-display font-bold mt-5 mb-2">{children}</h3>,
          code: ({ inline, children }) => 
            inline ? 
              <code className="bg-surface-dark px-1.5 py-0.5 rounded font-mono text-sm text-accent">{children}</code> : 
              <div className="bg-surface-dark p-4 rounded-xl border border-border overflow-x-auto my-4"><code className="font-mono text-sm">{children}</code></div>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start w-full mt-4">
      <div className="w-full max-w-3xl flex flex-col gap-4">
        
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center shadow-sm">
            <Terminal className="w-4 h-4 text-primary" />
          </div>
          <span className="font-sans text-sm font-semibold text-text-primary">RAGFATHER AGENT</span>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className={`prose prose-invert max-w-none font-sans leading-relaxed text-text-primary ${msg.isError ? 'text-error' : ''}`}>
            {msg.isError ? (
              <p className="bg-error/10 border border-error p-4 rounded-xl">{msg.content}</p>
            ) : (
              renderAnswerWithClickableSources(msg.content)
            )}
          </div>
          
          {/* Citations Reference Index */}
          {!msg.isError && msg.citations && msg.citations.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <div className="font-sans text-sm font-semibold text-text-secondary flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-accent" /> Reference Sources
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {msg.citations.map((cit, idx) => {
                  const cardKey = cit.source_index ?? idx;
                  const isExpanded = expandedCitation === cardKey;
                  const isHighlighted = highlightedCitation === cardKey;
                  return (
                    <motion.div
                      key={idx}
                      ref={el => { citationRefs.current[cardKey] = el; }}
                      animate={isHighlighted ? { scale: [1, 1.02, 1], borderColor: ['var(--color-primary)', 'var(--color-border)'] } : {}}
                      transition={{ duration: 0.5 }}
                      className={`bg-surface border rounded-xl overflow-hidden flex flex-col group transition-all cursor-pointer
                        ${isHighlighted ? 'border-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-border hover:border-primary/50'}`}
                      onClick={() => setExpandedCitation(isExpanded ? null : cardKey)}
                    >
                      {/* Citation Header */}
                      <div className="p-3 bg-surface-high flex justify-between items-start gap-2 border-b border-border">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {cit.source_index != null && (
                            <span className="font-mono text-xs font-bold bg-primary text-white px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                              S{cit.source_index}
                            </span>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-sans text-sm text-text-primary font-semibold truncate" title={cit.act || 'Unknown Source'}>
                              {cit.act || 'Unknown Source'}
                            </span>
                            {cit.section_number && (
                              <span className="text-xs text-text-secondary mt-0.5">
                                {cit.section_type} {cit.section_number}
                              </span>
                            )}
                          </div>
                        </div>
                        <button className="text-text-muted hover:text-primary transition-colors mt-0.5 flex-shrink-0">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Expandable Text Excerpt */}
                      <AnimatePresence>
                        {isExpanded && cit.text_excerpt && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="p-3 bg-surface-dark">
                              <p className="font-sans text-sm text-text-secondary leading-relaxed line-clamp-6">
                                "{cit.text_excerpt}"
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Bar below document */}
        {!msg.isError && (
          <div className="flex items-center gap-4 mt-2">
            <button className="px-3 py-1.5 bg-surface border border-border rounded-lg font-sans text-xs font-medium text-text-secondary hover:text-primary hover:border-primary transition-colors flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5" /> Copy Answer
            </button>
            <button className="px-3 py-1.5 bg-surface border border-border rounded-lg font-sans text-xs font-medium text-text-secondary hover:text-error hover:border-error transition-colors flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" /> Report Issue
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Recursively walk React children and replace [Source N] text nodes
 * with clickable <button> elements.
 */
function renderWithSourceLinks(children, onSourceClick) {
  if (!children) return children;

  const sourceRegex = /\[Source\s+(\d+)\]/gi;

  const processNode = (node, keyPrefix) => {
    if (typeof node === 'string') {
      const parts = [];
      let lastIndex = 0;
      let match;
      sourceRegex.lastIndex = 0; // reset regex state
      while ((match = sourceRegex.exec(node)) !== null) {
        if (match.index > lastIndex) {
          parts.push(node.slice(lastIndex, match.index));
        }
        const n = parseInt(match[1], 10);
        parts.push(
          <button
            key={`${keyPrefix}-src-${n}-${match.index}`}
            onClick={(e) => { e.stopPropagation(); onSourceClick(n); }}
            className="inline-flex items-center font-mono text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 rounded px-1.5 py-0.5 mx-1 hover:bg-primary hover:text-white transition-colors cursor-pointer align-middle"
            title={`Jump to Source ${n}`}
          >
            S{n}
          </button>
        );
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < node.length) {
        parts.push(node.slice(lastIndex));
      }
      return parts.length === 0 ? node : parts;
    }
    if (Array.isArray(node)) {
      return node.map((child, i) => processNode(child, `${keyPrefix}-${i}`));
    }
    return node;
  };

  if (Array.isArray(children)) {
    return children.map((child, i) => processNode(child, `rsl-${i}`));
  }
  return processNode(children, 'rsl');
}
