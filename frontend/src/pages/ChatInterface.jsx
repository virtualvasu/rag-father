import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Moon, Sun, ArrowRight, Paperclip, Lock, 
  Cpu, Search, Network, FileText, Scale,
  Copy, Flag, BookOpen, RotateCw, Layers, Server,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function ChatInterface({ toggleTheme, isDark }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useCrag, setUseCrag] = useState(true);
  const [useGraph, setUseGraph] = useState(true);
  const [useReranker, setUseReranker] = useState(true);
  const [useCitations, setUseCitations] = useState(true);
  const messagesEndRef = useRef(null);

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
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsLoading(true);

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

      setMessages(prev => [...prev, newAssistantMsg]);
    } catch (error) {
      console.error("Failed to fetch query:", error);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "An error occurred while connecting to the Ragfather API. Please check if the backend is running.",
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
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
    <div className="bg-background text-on-surface h-screen overflow-hidden flex font-body-md transition-colors duration-300">
      <Sidebar />
      
      {/* Main Layout Workspace */}
      <div className="flex-1 flex ml-64 h-full bg-surface transition-colors duration-300">
        
        {/* Center Column: Chat Canvas */}
        <main className="flex-1 flex flex-col h-full border-r border-on-surface relative">
          
          {/* Context Header */}
          <header className="h-[60px] min-h-[60px] border-b border-on-surface flex items-center justify-between px-lg bg-surface/90 backdrop-blur-sm sticky top-0 z-10 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest bg-on-surface/10 px-2 py-1">Ragfather_OS</span>
              <h2 className="font-headline-md text-xl text-on-surface truncate">
                {messages.length > 0 ? "Analysis_Active" : "Awaiting_Query"}
              </h2>
            </div>
            <div className="flex items-center gap-sm">
              <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </header>
          
          {/* Scrollable Chat History - Editorial Stream */}
          <div className="flex-1 overflow-y-auto px-12 md:px-24 py-16 flex flex-col gap-16">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                <Scale className="w-16 h-16 text-primary mb-6" />
                <h3 className="font-headline-lg text-4xl text-on-surface mb-2 flex items-center justify-center gap-2">
                  Ragfather Active
                  <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-4 h-8 bg-primary"></motion.span>
                </h3>
                <p className="font-mono text-sm text-on-surface-variant text-center max-w-md uppercase tracking-widest">
                  Awaiting parameters for document extraction and timeline construction.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <DocumentBlock key={msg.id} msg={msg} />
              ))
            )}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start opacity-70">
                <div className="flex flex-col gap-2 w-full max-w-3xl">
                  <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-2 mb-4">
                    <div className="w-2 h-2 bg-primary"></div>
                    <span className="font-mono text-xs uppercase tracking-widest text-primary">System Processing</span>
                  </div>
                  <div className="flex items-end gap-1 h-6 mt-2">
                    <motion.div animate={{ height: ["20%", "100%", "20%"] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0 }} className="w-2 bg-on-surface" />
                    <motion.div animate={{ height: ["40%", "80%", "40%"] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }} className="w-2 bg-on-surface" />
                    <motion.div animate={{ height: ["100%", "30%", "100%"] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }} className="w-2 bg-on-surface" />
                    <motion.div animate={{ height: ["60%", "100%", "60%"] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.45 }} className="w-2 bg-on-surface" />
                    <motion.div animate={{ height: ["30%", "70%", "30%"] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.6 }} className="w-2 bg-on-surface" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="p-8 bg-surface border-t border-on-surface z-10 transition-colors duration-300">
            <div className="relative flex items-end gap-4 max-w-4xl mx-auto">
              <button className="p-2 text-on-surface-variant hover:text-primary transition-colors flex-shrink-0">
                <Paperclip className="w-5 h-5" />
              </button>
              <div className="flex-1 border-l-4 border-l-transparent focus-within:border-l-primary border-b-2 border-b-on-surface focus-within:border-b-primary transition-colors pb-1 pl-3">
                <textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-lg text-lg resize-none min-h-[32px] max-h-[200px] outline-none" 
                  placeholder="Define query parameters..." 
                  rows={1}
                  disabled={isLoading}
                />
              </div>
              <button 
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isLoading}
                className="p-3 bg-on-surface text-surface disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary transition-colors flex-shrink-0 flex items-center justify-center border border-on-surface"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 items-center max-w-4xl mx-auto border-b border-outline-variant/30 pb-3 mb-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={useCrag} onChange={e => setUseCrag(e.target.checked)} className="accent-primary w-3 h-3" disabled={isLoading} />
                <span className="font-mono text-[10px] text-on-surface-variant group-hover:text-primary transition-colors uppercase tracking-widest">CRAG Check</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={useGraph} onChange={e => setUseGraph(e.target.checked)} className="accent-primary w-3 h-3" disabled={isLoading} />
                <span className="font-mono text-[10px] text-on-surface-variant group-hover:text-primary transition-colors uppercase tracking-widest">Knowledge Graph</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={useReranker} onChange={e => setUseReranker(e.target.checked)} className="accent-primary w-3 h-3" disabled={isLoading} />
                <span className="font-mono text-[10px] text-on-surface-variant group-hover:text-primary transition-colors uppercase tracking-widest">Cross-Encoder</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={useCitations} onChange={e => setUseCitations(e.target.checked)} className="accent-primary w-3 h-3" disabled={isLoading} />
                <span className="font-mono text-[10px] text-on-surface-variant group-hover:text-primary transition-colors uppercase tracking-widest">Source Citations</span>
              </label>
            </div>
            <div className="flex justify-between items-center max-w-4xl mx-auto">
              <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Output requires verification.</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-secondary flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Encrypted Connection
              </span>
            </div>
          </div>
        </main>
        
        {/* Right Column: Metadata Panel (Execution Trace) */}
        <aside className="w-[360px] bg-surface-container-low flex flex-col h-full border-l border-on-surface overflow-y-auto transition-colors duration-300">
          <header className="h-[60px] min-h-[60px] border-b border-on-surface flex items-center justify-between px-6 sticky top-0 bg-surface-container-low/90 backdrop-blur-sm z-10 transition-colors duration-300">
            <h3 className="font-mono text-sm uppercase tracking-[0.2em] text-on-surface flex items-center gap-3 font-bold">
              <Cpu className="text-secondary w-4 h-4" />
              Trace
            </h3>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-primary"></div>
              <div className="w-1.5 h-1.5 bg-primary animate-pulse"></div>
            </div>
          </header>
          
          {latestAssistantMessage ? (
            <div className="p-6 flex flex-col gap-8">
              {/* CRAG Score Instrumentation */}
              <div className="border border-on-surface bg-surface p-5">
                <div className="flex justify-between items-end mb-4">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Confidence Index</span>
                  <span className="font-mono text-3xl text-primary leading-none">
                    {Math.round(latestAssistantMessage.crag_score * 100)}<span className="text-sm">%</span>
                  </span>
                </div>
                <div className="h-[2px] w-full bg-outline-variant/30 overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(latestAssistantMessage.crag_score * 100)}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-primary absolute top-0 left-0"
                  />
                </div>
                <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  <span>Thr: 85%</span>
                  <span className={latestAssistantMessage.crag_score >= 0.85 ? "text-primary" : "text-error"}>
                    {latestAssistantMessage.crag_score >= 0.85 ? "[VALID]" : "[WARN]"}
                  </span>
                </div>
              </div>
              
              {/* Instrumental Metrics Grid */}
              <div className="grid grid-cols-2 gap-px bg-on-surface border border-on-surface">
                <div className="bg-surface p-4 flex flex-col justify-between aspect-square">
                  <span className="font-mono text-[10px] text-secondary uppercase flex items-center gap-2">
                    <Search className="w-3 h-3" /> Vec. Hits
                  </span>
                  <div className="text-right">
                    <span className="font-mono text-3xl text-on-surface">
                      {latestAssistantMessage.retrieval?.vector_hits || 0}
                    </span>
                  </div>
                </div>
                <div className="bg-surface p-4 flex flex-col justify-between aspect-square">
                  <span className="font-mono text-[10px] text-secondary uppercase flex items-center gap-2">
                    <Network className="w-3 h-3" /> Graph Nodes
                  </span>
                  <div className="text-right">
                    <span className="font-mono text-3xl text-on-surface">
                      {latestAssistantMessage.retrieval?.graph_hits || 0}
                    </span>
                  </div>
                </div>
                <div className="bg-surface p-4 flex flex-col justify-between aspect-square">
                  <span className="font-mono text-[10px] text-secondary uppercase flex items-center gap-2">
                    <RotateCw className="w-3 h-3" /> Iters
                  </span>
                  <div className="text-right">
                    <span className="font-mono text-3xl text-on-surface">
                      {latestAssistantMessage.iterations || 0}
                    </span>
                  </div>
                </div>
                <div className="bg-surface p-4 flex flex-col justify-between aspect-square">
                  <span className="font-mono text-[10px] text-secondary uppercase flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Chunks
                  </span>
                  <div className="text-right">
                    <span className="font-mono text-3xl text-on-surface">
                      {latestAssistantMessage.chunks_used || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Provider Info */}
              <div className="border border-on-surface bg-surface p-4 flex items-center justify-between">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                  <Server className="w-3 h-3 text-secondary" /> Model Engine
                </span>
                <span className="font-mono text-sm text-on-surface uppercase">
                  {latestAssistantMessage.provider || 'unknown'}
                </span>
              </div>
              
              {/* Document Context Analyzed */}
              {latestAssistantMessage.citations && latestAssistantMessage.citations.length > 0 && (
                <div>
                  <h4 className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-4 border-b border-on-surface pb-2">Context Mapping</h4>
                  <ul className="flex flex-col gap-3">
                    {/* Dedup acts for display */}
                    {Array.from(new Set(latestAssistantMessage.citations.map(c => c.act))).map((act, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 border border-outline-variant/50 bg-surface hover:border-primary transition-colors cursor-default">
                        <FileText className="text-primary w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-mono text-xs text-on-surface truncate">{act}</span>
                          <span className="font-mono text-[10px] text-on-surface-variant mt-1">
                            [{latestAssistantMessage.citations.filter(c => c.act === act).length} refs]
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
             <div className="p-6 flex flex-col items-center justify-center h-full opacity-30 text-center">
               <Cpu className="w-16 h-16 text-on-surface mb-6" />
               <p className="font-mono text-xs uppercase tracking-widest text-on-surface">Trace buffer empty.<br/>Awaiting process.</p>
             </div>
          )}
        </aside>
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start w-full">
        <div className="w-full max-w-3xl flex flex-col gap-2">
          <div className="flex items-center gap-3 border-b border-on-surface pb-2">
            <div className="w-2 h-2 bg-secondary"></div>
            <span className="font-mono text-xs uppercase tracking-widest text-secondary">Inquiry Parameters</span>
          </div>
          <h2 className="font-headline-lg text-3xl md:text-4xl text-on-surface mt-2 font-medium">
            {msg.content}
          </h2>
        </div>
      </motion.div>
    );
  }

  // Post-process answer text: convert [Source N] to clickable spans
  const renderAnswerWithClickableSources = (content) => {
    if (!content) return null;
    // Replace [Source N] or [Source N][Source M] patterns with placeholders
    // then render via custom component
    const processedContent = content.replace(
      /\[Source\s+(\d+)\]/gi,
      (match, n) => `[Source ${n}]`
    );

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Intercept text nodes to convert [Source N] to clickable elements
          p: ({ children }) => (
            <p>{renderWithSourceLinks(children, handleSourceClick)}</p>
          ),
          li: ({ children }) => (
            <li>{renderWithSourceLinks(children, handleSourceClick)}</li>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start w-full mt-8">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-on-surface pb-2">
          <div className="w-2 h-2 bg-primary"></div>
          <span className="font-mono text-xs uppercase tracking-widest text-primary">Analysis Output</span>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className={`prose prose-lg dark:prose-invert max-w-none 
            prose-p:font-body-md prose-p:leading-relaxed prose-p:text-on-surface-variant
            prose-headings:font-headline-md prose-headings:text-on-surface prose-headings:font-medium prose-headings:mt-8 prose-headings:mb-4
            prose-a:text-secondary prose-a:underline-offset-4
            prose-code:font-mono prose-code:text-sm prose-code:text-primary prose-code:bg-surface-variant/50 prose-code:px-1.5 prose-code:py-0.5
            prose-strong:text-on-surface prose-strong:font-semibold
            prose-ul:list-square prose-ul:pl-4
            ${msg.isError ? 'text-error prose-p:text-error' : ''}`}>
            {msg.isError ? (
              <p>{msg.content}</p>
            ) : (
              renderAnswerWithClickableSources(msg.content)
            )}
          </div>
          
          {/* Citations Reference Index */}
          {!msg.isError && msg.citations && msg.citations.length > 0 && (
            <div className="mt-8 pt-8 border-t border-outline-variant/30">
              <div className="font-mono text-xs text-on-surface uppercase tracking-[0.2em] flex items-center gap-3 mb-6">
                <BookOpen className="w-4 h-4" /> Reference Index
              </div>
              <div className="grid grid-cols-1 gap-4">
                {msg.citations.map((cit, idx) => {
                  const cardKey = cit.source_index ?? idx;
                  const isExpanded = expandedCitation === cardKey;
                  const isHighlighted = highlightedCitation === cardKey;
                  return (
                    <motion.div
                      key={idx}
                      ref={el => { citationRefs.current[cardKey] = el; }}
                      animate={isHighlighted ? { borderColor: ['var(--color-primary)', 'var(--color-outline-variant)'] } : {}}
                      transition={{ duration: 1.5 }}
                      className={`bg-surface border-l-2 pl-4 py-3 flex flex-col gap-2 group transition-colors cursor-pointer
                        ${isHighlighted ? 'border-primary shadow-sm' : 'border-primary/40 hover:border-primary'}`}
                      onClick={() => setExpandedCitation(isExpanded ? null : cardKey)}
                    >
                      {/* Citation Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {cit.source_index != null && (
                            <span className="font-mono text-[10px] bg-primary text-surface px-1.5 py-0.5 flex-shrink-0">
                              S{cit.source_index}
                            </span>
                          )}
                          <span className="font-mono text-sm text-on-surface font-bold truncate">
                            {cit.act || 'Unknown Source'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {cit.section_number && (
                            <span className="bg-on-surface text-surface font-mono text-[10px] uppercase px-2 py-0.5 whitespace-nowrap">
                              {cit.section_type} {cit.section_number}
                            </span>
                          )}
                          <button className="text-on-surface-variant hover:text-primary transition-colors">
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Section Title */}
                      {cit.section_title && (
                        <p className="font-body-sm text-on-surface-variant italic text-sm" title={cit.section_title}>
                          {cit.section_title}
                        </p>
                      )}

                      {/* Expandable Text Excerpt */}
                      <AnimatePresence>
                        {isExpanded && cit.text_excerpt && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 pt-2 border-t border-outline-variant/30">
                              <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest block mb-1">Source Excerpt</span>
                              <p className="font-body-sm text-on-surface-variant text-sm leading-relaxed">
                                "{cit.text_excerpt}{cit.text_excerpt.length >= 300 ? '…' : ''}"
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
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-outline-variant/20">
            <button className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
              <Copy className="w-3 h-3" /> Copy Full Text
            </button>
            <button className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-secondary transition-colors flex items-center gap-2">
              <Flag className="w-3 h-3" /> Flag Discrepancy
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
            className="inline-flex items-center font-mono text-[10px] bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.5 mx-0.5 hover:bg-primary hover:text-surface transition-colors cursor-pointer"
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
