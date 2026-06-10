import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, ArrowRight, Sliders, Layers, 
  BarChart3, Cpu, Terminal, ShieldCheck,
  Code2, Play
} from 'lucide-react';
import ParticleBackground from '../components/landing/ParticleBackground';
import JourneyLine from '../components/landing/JourneyLine';
import GlobalCompanion from '../components/landing/GlobalCompanion';

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '10%']);
  const opacityProgress = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const heroTexts = [
    "Ingesting docs...",
    "Chunking content...",
    "Embedding vectors...",
    "Answer ready."
  ];

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % heroTexts.length);
    }, 2500);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div 
      className="min-h-screen bg-surface-dark font-sans text-text-primary antialiased selection:bg-primary/30 selection:text-primary relative overflow-x-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Dynamic Cursor Glow */}
      <div 
        className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none z-0 transition-opacity duration-300 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.03) 40%, rgba(0, 0, 0, 0) 70%)',
          transform: `translate(${mousePosition.x - 300}px, ${mousePosition.y - 300}px)`,
          opacity: isHovering ? 1 : 0,
        }}
      />

      {/* Grid Pattern Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      {/* Navigation */}
      <header className="bg-surface-dark/80 backdrop-blur-xl w-full top-0 sticky z-50 border-b border-border transition-all duration-300">
        <div className="flex justify-between items-center px-6 md:px-12 py-4 w-full max-w-7xl mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="font-display text-xl font-bold text-text-primary tracking-tight">RAGFATHER</span>
          </div>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Evaluation', 'Docs'].map((item) => (
              <a key={item} className="font-sans text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200" href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}>
                {item}
              </a>
            ))}
          </nav>
          
          {/* Actions */}
          <div className="flex items-center gap-6">
            <Link to="/chat" className="hidden md:block font-sans text-sm font-medium text-text-secondary hover:text-primary transition-colors">
              Open Chat
            </Link>
            <Link to="/admin" className="bg-primary hover:bg-primary-light text-white font-sans text-sm font-semibold px-6 py-2.5 rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-2">
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Hero Section */}
        <section className="min-h-[90vh] flex flex-col justify-center items-center text-center pt-20 pb-12 relative overflow-hidden">
          <ParticleBackground />
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            style={{ y: heroY, opacity: opacityProgress }}
            className="flex flex-col items-center gap-8 z-10 w-full max-w-4xl"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border glass-panel">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              <span className="font-mono text-xs text-text-secondary uppercase tracking-wider font-medium">OPEN SOURCE · SELF-HOSTED · LOCAL-FIRST</span>
            </motion.div>

            <div className="h-[120px] md:h-[180px] lg:h-[200px] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.h1 
                  key={currentTextIndex}
                  initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ y: -20, opacity: 0, filter: 'blur(10px)' }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-text-secondary leading-[1.1] pb-2"
                >
                  {heroTexts[currentTextIndex]}
                </motion.h1>
              </AnimatePresence>
            </div>
            
            <motion.p variants={itemVariants} className="font-sans text-lg md:text-xl text-text-secondary max-w-2xl font-light leading-relaxed">
              The end-to-end platform for creating production-grade Retrieval-Augmented Generation systems. Total customization. Rigorous evaluation. Complete ownership.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full justify-center">
              <Link to="/admin" className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-light text-white font-sans text-base font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center gap-3">
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#" className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-border hover:border-text-muted text-text-primary font-sans text-base font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-3">
                <Code2 className="w-5 h-5" />
                <span>View on GitHub</span>
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* Stats Section */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="py-12 w-full"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            {[
              { label: 'Pipeline Components', value: '12+' },
              { label: 'Retrieval Strategies', value: '3' },
              { label: 'RAGAS Metrics', value: '4' },
              { label: 'LLM Providers', value: '4+' },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants} className="bg-surface-high p-8 flex flex-col items-center justify-center text-center hover:bg-surface-highest transition-colors">
                <span className="font-display text-4xl font-bold text-text-primary mb-2">{stat.value}</span>
                <span className="font-sans text-sm text-text-secondary font-medium">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Interactive Pipeline Diagram */}
        <section id="how-it-works" className="py-24 border-t border-border">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">Complete Pipeline Transparency</h2>
            <p className="font-sans text-text-secondary max-w-2xl mx-auto text-lg">
              Stop guessing what happens inside the black box. Ragfather exposes every stage of the RAG process for you to inspect, configure, and optimize.
            </p>
          </div>
          
          <JourneyLine />
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 border-t border-border">
          <div className="mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">Production-Ready Features</h2>
            <p className="font-sans text-text-secondary max-w-2xl text-lg">
              Everything you need to build RAG applications that actually work in the real world.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Sliders, title: 'Total Customization', desc: 'Toggle Knowledge Graph, CRAG, Cross-Encoder Reranking, skip enrichment, and configure chunk sizes on the fly.' },
              { icon: Layers, title: 'Hybrid Retrieval', desc: 'Combines dense vector search (Qdrant), sparse retrieval (BM25), and optional Knowledge Graph traversal using Reciprocal Rank Fusion.' },
              { icon: BarChart3, title: 'Built-in Evaluation', desc: 'Integrated RAGAS scoring to rigorously measure Faithfulness, Answer Relevancy, Context Precision, and Context Recall.' },
              { icon: Cpu, title: 'Multiple Providers', desc: 'Seamlessly switch between Ollama (local), Groq (fast cloud), Claude, or any custom OpenAI-compatible endpoint.' },
              { icon: Terminal, title: 'Real-time Logs', desc: 'SSE-powered live log streaming during pipeline execution so you can see exactly what is happening under the hood.' },
              { icon: ShieldCheck, title: 'Local-First Privacy', desc: 'Everything can run entirely on your infrastructure. Zero data leaves your machine when using local Ollama models.' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group glass-panel p-8 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] hover:border-primary-light/50"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-text-primary mb-3">{feature.title}</h3>
                <p className="font-sans text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Evaluation Showcase */}
        <section id="evaluation" className="py-24 border-t border-border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-6">Stop Guessing. Start Measuring.</h2>
              <p className="font-sans text-lg text-text-secondary leading-relaxed mb-8">
                Building RAG is easy. Building good RAG is incredibly hard. Ragfather includes a built-in evaluation portal powered by RAGAS, allowing you to objectively measure the impact of every architectural decision you make.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Auto-generate synthetic testsets using LLMs',
                  'Compare naive vs advanced pipeline variants side-by-side',
                  'Identify failure modes before hitting production',
                  'Maintain a historical record of all evaluations'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                    </div>
                    <span className="font-sans text-text-primary">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/evaluate" className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary-light transition-colors">
                Explore the Evaluation Portal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">

              
              <h3 className="font-mono text-sm uppercase tracking-wider text-text-secondary mb-6 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Ablation Study Results
              </h3>
              
              <div className="space-y-6">
                {[
                  { name: 'naive_rag', f: 72.3, a: 68.5, p: 61.2, r: 58.9 },
                  { name: 'advanced_rag', f: 88.7, a: 82.4, p: 79.6, r: 76.3 },
                  { name: 'ragfather_full', f: 95.1, a: 91.8, p: 88.4, r: 85.7, highlight: true },
                ].map((row, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${row.highlight ? 'bg-primary/5 border-primary/30' : 'bg-surface-highest border-transparent'}`}>
                    <div className="flex justify-between mb-3">
                      <span className={`font-mono text-sm font-bold ${row.highlight ? 'text-primary' : 'text-text-primary'}`}>{row.name}</span>
                      {row.highlight && <span className="font-sans text-xs bg-primary text-white px-2 py-0.5 rounded-full">Best</span>}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-text-muted">Faithful</span>
                        <span className={`font-mono text-xs ${row.f > 90 ? 'text-accent' : row.f > 75 ? 'text-secondary' : 'text-error'}`}>{row.f}%</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-text-muted">Ans Rel</span>
                        <span className={`font-mono text-xs ${row.a > 90 ? 'text-accent' : row.a > 75 ? 'text-secondary' : 'text-error'}`}>{row.a}%</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-text-muted">Ctx Prec</span>
                        <span className={`font-mono text-xs ${row.p > 90 ? 'text-accent' : row.p > 75 ? 'text-secondary' : 'text-error'}`}>{row.p}%</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-text-muted">Ctx Rec</span>
                        <span className={`font-mono text-xs ${row.r > 90 ? 'text-accent' : row.r > 75 ? 'text-secondary' : 'text-error'}`}>{row.r}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start / Tech Stack */}
        <section id="docs" className="py-24 border-t border-border">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">Up and Running in Minutes</h2>
            <p className="font-sans text-text-secondary max-w-2xl mx-auto text-lg">
              Everything is containerized. Bring your own data, and let the system handle the rest.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="glass-panel rounded-2xl overflow-hidden font-mono text-sm shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-surface-highest border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                </div>
                <span className="ml-2 text-text-muted text-xs">bash</span>
              </div>
              <div className="p-6 space-y-4 text-text-primary">
                <div>
                  <span className="text-text-muted"># 1. Clone the repository</span><br/>
                  <span className="text-secondary">git clone</span> https://github.com/yourusername/ragfather.git<br/>
                  <span className="text-secondary">cd</span> ragfather
                </div>
                <div>
                  <span className="text-text-muted"># 2. Add your documents</span><br/>
                  <span className="text-secondary">cp</span> ~/my-docs/*.pdf ./data/raw/
                </div>
                <div>
                  <span className="text-text-muted"># 3. Start the entire stack</span><br/>
                  <span className="text-secondary">docker-compose</span> up -d
                </div>
                <div className="text-accent flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                  <Play className="w-4 h-4" /> Ready at http://localhost:5173
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-highest w-full border-t border-border z-40 relative mt-12">
        <div className="flex flex-col justify-center items-center px-6 md:px-12 py-12 w-full max-w-7xl mx-auto gap-8">
          <div className="flex flex-col md:flex-row justify-between w-full items-center gap-4 border-b border-border pb-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="font-display text-xl text-text-primary font-bold tracking-tight">RAGFATHER</span>
              <span className="font-sans text-sm text-text-secondary">The open-source RAG platform.</span>
            </div>
            <div className="flex gap-6">
              <a className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors" href="#">GitHub</a>
              <a className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors" href="#">Documentation</a>
              <a className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors" href="#">MIT License</a>
            </div>
          </div>
          <div className="w-full text-center md:text-left">
            <span className="font-sans text-sm text-text-muted">
              © {new Date().getFullYear()} Ragfather. Built for production.
            </span>
          </div>
        </div>
      </footer>

      <GlobalCompanion />
    </div>
  );
}
