import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Database, FileDigit, Fingerprint, Search, Activity, Rocket } from 'lucide-react';

const steps = [
  { id: 'ingest', title: '1. Ingest', icon: Database, desc: 'Connect to any data source. PDF, HTML, Markdown, or raw text. Ragfather standardizes it all instantly.' },
  { id: 'chunk', title: '2. Chunk', icon: FileDigit, desc: 'Intelligently split documents. Use semantic boundaries, fixed sizes, or specialized parsers.' },
  { id: 'embed', title: '3. Embed', icon: Fingerprint, desc: 'Transform text into high-dimensional vectors using state-of-the-art embedding models.' },
  { id: 'retrieve', title: '4. Retrieve', icon: Search, desc: 'Execute hybrid searches combining dense vector similarity with sparse keyword matching.' },
  { id: 'evaluate', title: '5. Evaluate', icon: Activity, desc: 'Rigorously test pipeline variants with built-in RAGAS metrics for faithfulness and relevance.' },
  { id: 'deploy', title: '6. Deploy', icon: Rocket, desc: 'Expose your optimized RAG pipeline as a production-ready, scalable API.' },
];

export default function JourneyLine() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"] // Restored to center for perfect 1:1 mapping
  });

  // Use clip-path to reveal the glowing snake perfectly, avoiding SVG pathLength scaling bugs
  const clipPath = useTransform(scrollYProgress, [0, 1], ["inset(0% 0% 100% 0%)", "inset(0% 0% 0% 0%)"]);

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto h-[1600px] md:h-[1200px] my-32">
      
      {/* SVG Snake Track */}
      <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-32 md:w-48 pointer-events-none">
        
        {/* Faint background snake */}
        <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-full drop-shadow-2xl">
          <path 
            d="M 50 0 C -10 50, -10 150, 50 200 C 110 250, 110 350, 50 400 C -10 450, -10 550, 50 600 C 110 650, 110 750, 50 800 C -10 850, -10 950, 50 1000" 
            stroke="var(--color-border)" 
            strokeWidth="2" 
            fill="none" 
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Animated glowing snake */}
        <motion.svg 
          viewBox="0 0 100 1000" 
          preserveAspectRatio="none" 
          className="absolute top-0 left-0 w-full h-full drop-shadow-2xl"
          style={{ clipPath }}
        >
          <defs>
            <linearGradient id="snakeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path 
            d="M 50 0 C -10 50, -10 150, 50 200 C 110 250, 110 350, 50 400 C -10 450, -10 550, 50 600 C 110 650, 110 750, 50 800 C -10 850, -10 950, 50 1000" 
            stroke="url(#snakeGradient)" 
            strokeWidth="6" 
            fill="none" 
            vectorEffect="non-scaling-stroke"
            filter="url(#glow)"
          />
        </motion.svg>
      </div>

      {/* Nodes */}
      {steps.map((step, index) => {
        const progressPoint = index / (steps.length - 1);
        const start = Math.max(0, progressPoint - 0.2);
        const end = Math.min(1, progressPoint + 0.2);
        
        const opacity = useTransform(scrollYProgress, [start, progressPoint, end], [0.3, 1, 0.3]);
        const scale = useTransform(scrollYProgress, [start, progressPoint, end], [0.9, 1.05, 0.9]);
        
        // Dynamic node styles for lively animation
        const nodeScale = useTransform(scrollYProgress, [start, progressPoint, end], [1, 1.3, 1]);
        const boxShadow = useTransform(scrollYProgress, [start, progressPoint, end], [
          "0px 0px 0px rgba(37, 99, 235, 0)", 
          "0px 0px 35px rgba(37, 99, 235, 0.9)", 
          "0px 0px 0px rgba(37, 99, 235, 0)"
        ]);
        const nodeColor = useTransform(scrollYProgress, [start, progressPoint], ["#121212", "#2563EB"]);
        const iconColor = useTransform(scrollYProgress, [start, progressPoint], ["#6E6E73", "#FFFFFF"]);

        const isEven = index % 2 === 0;
        const topPosition = `${progressPoint * 100}%`;

        return (
          <div 
            key={step.id} 
            className={`absolute w-full flex items-center ${isEven ? 'justify-start' : 'justify-end'}`}
            style={{ top: topPosition, transform: 'translateY(-50%)' }}
          >
            {/* Text Content */}
            <motion.div 
              style={{ opacity, scale }}
              className={`w-[40%] md:w-[45%] glass-panel p-6 md:p-8 rounded-2xl relative z-20 shadow-2xl ${isEven ? 'text-right pr-12 md:pr-16' : 'text-left pl-12 md:pl-16'}`}
            >
              <h3 className={`font-display text-xl md:text-2xl font-bold text-text-primary mb-3 flex items-center gap-3 ${isEven ? 'justify-end' : 'justify-start'}`}>
                {isEven ? (
                  <>{step.title} <step.icon className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" /></>
                ) : (
                  <><step.icon className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" /> {step.title}</>
                )}
              </h3>
              <p className="font-sans text-text-secondary text-sm md:text-base leading-relaxed">{step.desc}</p>
            </motion.div>

            {/* The Lively Node */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-16 h-16 z-30">
              {/* Outer pulsing ring */}
              <motion.div 
                style={{ scale: nodeScale, opacity: useTransform(scrollYProgress, [start, progressPoint], [0, 0.6]) }}
                className="absolute inset-0 rounded-full bg-primary blur-md"
              />
              {/* Inner energetic core */}
              <motion.div 
                style={{ scale: nodeScale, boxShadow, backgroundColor: nodeColor }}
                className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border-4 border-surface-dark bg-surface-highest transition-colors duration-300"
              >
                <motion.div style={{ color: iconColor }}>
                  <step.icon className="w-5 h-5 md:w-6 md:h-6" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
