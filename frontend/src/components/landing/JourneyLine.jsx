import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const steps = [
  { id: 'ingest', title: '1. Ingest', desc: 'Connect to any data source. PDF, HTML, Markdown, or raw text. Ragfather standardizes it all instantly.' },
  { id: 'chunk', title: '2. Chunk', desc: 'Intelligently split documents. Use semantic boundaries, fixed sizes, or specialized parsers.' },
  { id: 'embed', title: '3. Embed', desc: 'Transform text into high-dimensional vectors using state-of-the-art embedding models.' },
  { id: 'retrieve', title: '4. Retrieve', desc: 'Execute hybrid searches combining dense vector similarity with sparse keyword matching.' },
  { id: 'evaluate', title: '5. Evaluate', desc: 'Rigorously test pipeline variants with built-in RAGAS metrics for faithfulness and relevance.' },
  { id: 'deploy', title: '6. Deploy', desc: 'Expose your optimized RAG pipeline as a production-ready, scalable API.' },
];

export default function JourneyLine() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  // The glowing line height
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto py-32 px-4">
      
      {/* Background track line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-surface-highest -translate-x-1/2 rounded-full overflow-hidden">
        {/* Animated glowing line */}
        <motion.div 
          className="absolute top-0 left-0 right-0 origin-top"
          style={{ 
            height: lineHeight, 
            background: 'linear-gradient(to bottom, #60A5FA, #2563EB, #10B981)',
            boxShadow: '0 0 15px rgba(37, 99, 235, 0.8)'
          }}
        />
      </div>

      {/* Nodes */}
      <div className="relative z-10 flex flex-col gap-32">
        {steps.map((step, index) => {
          // Calculate when this specific node should be active based on its index
          const progressPoint = index / (steps.length - 1);
          const start = Math.max(0, progressPoint - 0.15);
          const end = Math.min(1, progressPoint + 0.15);
          
          const opacity = useTransform(scrollYProgress, [start, progressPoint, end], [0.2, 1, 0.2]);
          const scale = useTransform(scrollYProgress, [start, progressPoint, end], [0.8, 1.1, 0.8]);
          const boxShadow = useTransform(scrollYProgress, [start, progressPoint, end], [
            "0px 0px 0px rgba(37, 99, 235, 0)", 
            "0px 0px 25px rgba(37, 99, 235, 0.8)", 
            "0px 0px 0px rgba(37, 99, 235, 0)"
          ]);
          
          const nodeColor = useTransform(scrollYProgress, [start, progressPoint], ["#333333", "#2563EB"]);

          const isEven = index % 2 === 0;

          return (
            <div key={step.id} className={`flex items-center w-full ${isEven ? 'justify-start' : 'justify-end'}`}>
              
              {/* Text Content */}
              <motion.div 
                style={{ opacity }}
                className={`w-[45%] glass-panel p-8 rounded-2xl relative ${isEven ? 'text-right pr-12' : 'text-left pl-12'}`}
              >
                <h3 className="font-display text-2xl md:text-3xl font-bold text-text-primary mb-3">{step.title}</h3>
                <p className="font-sans text-text-secondary text-base md:text-lg leading-relaxed">{step.desc}</p>
                
                {/* Connecting horizontal line to the node */}
                <div className={`absolute top-1/2 -translate-y-1/2 w-8 h-px bg-border ${isEven ? '-right-8' : '-left-8'}`} />
              </motion.div>

              {/* The Node itself on the central line */}
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8">
                <motion.div 
                  style={{ scale, boxShadow, backgroundColor: nodeColor }}
                  className="w-5 h-5 rounded-full border-[3px] border-surface-dark z-20"
                />
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
