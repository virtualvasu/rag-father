import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useVelocity, useSpring, useTransform, AnimatePresence } from 'framer-motion';

export default function GlobalCompanion() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });
  
  // Responsive squish based on scroll velocity
  const velocityY = useTransform(smoothVelocity, [-1000, 0, 1000], [-10, 0, 10]);
  const stretchY = useTransform(smoothVelocity, [-1000, 0, 1000], [1.15, 1, 1.15]);
  const squishX = useTransform(smoothVelocity, [-1000, 0, 1000], [0.85, 1, 0.85]);
  const rotation = useTransform(smoothVelocity, [-1000, 0, 1000], [-15, 0, 15]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Calculate mouse position relative to center of screen for eye tracking
      const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 1000);
  };

  return (
    <motion.div 
      className="fixed bottom-8 right-8 z-[100] cursor-grab active:cursor-grabbing"
      drag
      dragConstraints={{ top: -600, bottom: 0, left: -1000, right: 0 }}
      dragElastic={0.2}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Idle floating animation wrapper */}
      <motion.div
        animate={isClicked ? { rotate: 360, y: -20 } : { y: [0, -12, 0] }}
        transition={
          isClicked 
            ? { duration: 0.5, type: "spring" } 
            : { repeat: Infinity, duration: 4, ease: "easeInOut" }
        }
        className="relative"
      >
        {/* Main Body */}
        <motion.div 
          style={{ scaleX: squishX, scaleY: stretchY, rotate: rotation }}
          className="w-16 h-16 rounded-[24px] bg-surface-highest border border-border shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden relative backdrop-blur-xl"
        >
          {/* Inner glass texture */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-surface-dark to-surface-highest opacity-80" />
          <div className="absolute inset-0 bg-primary/10" />
          
          {/* Face Container - moves with scroll and mouse */}
          <motion.div 
            style={{ y: velocityY }}
            animate={{ 
              x: mousePosition.x * 8,
              y: mousePosition.y * 8,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20, mass: 0.5 }}
            className="flex gap-2.5 relative z-10"
          >
            {/* Left Eye */}
            <div className="w-3.5 h-5 bg-black rounded-full overflow-hidden flex items-center justify-center relative shadow-inner">
               <motion.div 
                 animate={{ scaleY: isHovered ? 0.1 : 1 }} 
                 className="w-full h-full bg-primary/20 absolute inset-0 origin-bottom"
               />
               <motion.div 
                 animate={{ 
                   x: mousePosition.x * 2.5,
                   y: mousePosition.y * 2.5,
                 }}
                 className="w-1.5 h-1.5 bg-primary-light rounded-full shadow-[0_0_10px_var(--color-primary-light)]" 
               />
            </div>
            {/* Right Eye */}
            <div className="w-3.5 h-5 bg-black rounded-full overflow-hidden flex items-center justify-center relative shadow-inner">
               <motion.div 
                 animate={{ scaleY: isHovered ? 0.1 : 1 }} 
                 className="w-full h-full bg-primary/20 absolute inset-0 origin-bottom"
               />
               <motion.div 
                 animate={{ 
                   x: mousePosition.x * 2.5,
                   y: mousePosition.y * 2.5,
                 }}
                 className="w-1.5 h-1.5 bg-primary-light rounded-full shadow-[0_0_10px_var(--color-primary-light)]" 
               />
            </div>
          </motion.div>
        </motion.div>
        
        {/* Interactive Tooltip */}
        <AnimatePresence>
          {isHovered && !isClicked && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, y: 10, scale: 0.8, rotate: -5 }}
              className="absolute bottom-20 right-0 w-48 glass-panel rounded-xl p-3 shadow-2xl origin-bottom-right pointer-events-none"
            >
              <p className="font-sans text-xs text-text-primary m-0 font-medium">I monitor the RAG pipeline. Give me a spin!</p>
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-surface-high border-b border-r border-border transform rotate-45" />
            </motion.div>
          )}
          {isClicked && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="absolute bottom-20 right-0 glass-panel rounded-xl px-4 py-2 shadow-2xl pointer-events-none"
            >
              <p className="font-sans text-sm text-text-primary m-0 font-bold">WEEEEE! 🚀</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
