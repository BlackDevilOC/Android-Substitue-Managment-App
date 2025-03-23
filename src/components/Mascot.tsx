import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MascotProps {
  expression?: 'happy' | 'thinking' | 'excited' | 'surprised' | 'confused' | 'winking';
  message?: string;
  onDismiss?: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  autoHide?: boolean;
  hideAfter?: number; // in milliseconds
}

/**
 * Cute animated mascot component that guides users through app features
 */
export const Mascot: React.FC<MascotProps> = ({
  expression = 'happy',
  message,
  onDismiss,
  position = 'bottom-right',
  size = 'medium',
  animated = true,
  autoHide = false,
  hideAfter = 5000, // 5 seconds default
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isWaving, setIsWaving] = useState(false);
  const [isTalking, setIsTalking] = useState(!!message);
  const [isBlinking, setIsBlinking] = useState(false);
  const [bounce, setBounce] = useState(false);

  // Set up blinking animation
  useEffect(() => {
    if (!animated) return;
    
    // Random blinking
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance to blink
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 200);
      }
    }, 2000);
    
    return () => clearInterval(blinkInterval);
  }, [animated]);

  // Wave animation on initial render
  useEffect(() => {
    if (!animated) return;
    
    setIsWaving(true);
    const waveTimer = setTimeout(() => {
      setIsWaving(false);
    }, 2000);
    
    return () => clearTimeout(waveTimer);
  }, [animated]);

  // Random bounce animation
  useEffect(() => {
    if (!animated) return;
    
    const bounceInterval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance to bounce
        setBounce(true);
        setTimeout(() => setBounce(false), 1000);
      }
    }, 5000);
    
    return () => clearInterval(bounceInterval);
  }, [animated]);

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && hideAfter) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
      }, hideAfter);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, hideAfter, onDismiss]);

  // Get size dimensions
  const getSizeDimensions = () => {
    switch (size) {
      case 'small': return { width: 60, height: 60 };
      case 'medium': return { width: 100, height: 100 };
      case 'large': return { width: 160, height: 160 };
      default: return { width: 100, height: 100 };
    }
  };

  // Get positioning classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left': return 'top-4 left-4';
      case 'top-right': return 'top-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      default: return 'bottom-4 right-4';
    }
  };

  // Get color based on expression
  const getMascotColor = () => {
    switch (expression) {
      case 'happy': return "#5DADE2"; // Blue
      case 'thinking': return "#3498DB"; // Darker blue
      case 'excited': return "#2ECC71"; // Green
      case 'surprised': return "#9B59B6"; // Purple
      case 'confused': return "#F1C40F"; // Yellow
      case 'winking': return "#E74C3C"; // Red
      default: return "#5DADE2"; // Default blue
    }
  };

  // Get eye expression
  const getEyeExpression = () => {
    if (isBlinking) return 'closed';
    
    switch (expression) {
      case 'happy': return 'normal';
      case 'thinking': return 'looking-up';
      case 'excited': return 'wide';
      case 'surprised': return 'wide';
      case 'confused': return 'different';
      case 'winking': return 'winking';
      default: return 'normal';
    }
  };

  // Get mouth expression
  const getMouthExpression = () => {
    switch (expression) {
      case 'happy': return 'smile';
      case 'thinking': return 'neutral';
      case 'excited': return 'open';
      case 'surprised': return 'o';
      case 'confused': return 'squiggle';
      case 'winking': return 'grin';
      default: return 'smile';
    }
  };

  // Render eyes based on expression
  const renderEyes = () => {
    const eyeExpression = getEyeExpression();
    
    if (eyeExpression === 'closed') {
      return (
        <>
          <line x1="10" y1="20" x2="20" y2="20" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="45" y1="20" x2="55" y2="20" stroke="#333" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    }
    
    if (eyeExpression === 'looking-up') {
      return (
        <>
          <circle cx="15" cy="18" r="5" fill="#333" />
          <circle cx="50" cy="18" r="5" fill="#333" />
        </>
      );
    }
    
    if (eyeExpression === 'wide') {
      return (
        <>
          <circle cx="15" cy="20" r="7" fill="#333" />
          <circle cx="50" cy="20" r="7" fill="#333" />
          <circle cx="15" cy="20" r="2" fill="white" />
          <circle cx="50" cy="20" r="2" fill="white" />
        </>
      );
    }
    
    if (eyeExpression === 'different') {
      return (
        <>
          <circle cx="15" cy="20" r="6" fill="#333" />
          {/* Spirally confused eye */}
          <path 
            d="M50 20 Q53 17 50 14 Q47 17 50 20" 
            fill="#333" 
            stroke="#333" 
            strokeWidth="1" 
          />
        </>
      );
    }
    
    if (eyeExpression === 'winking') {
      return (
        <>
          <circle cx="15" cy="20" r="5" fill="#333" />
          <line x1="45" y1="20" x2="55" y2="20" stroke="#333" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    }
    
    // Default normal eyes
    return (
      <>
        <circle cx="15" cy="20" r="5" fill="#333" />
        <circle cx="50" cy="20" r="5" fill="#333" />
      </>
    );
  };

  // Render mouth based on expression
  const renderMouth = () => {
    const mouthExpression = getMouthExpression();
    
    if (mouthExpression === 'smile') {
      return (
        <path 
          d="M20 40 Q32.5 50 45 40" 
          fill="none" 
          stroke="#333" 
          strokeWidth="2"
          strokeLinecap="round" 
        />
      );
    }
    
    if (mouthExpression === 'open') {
      return (
        <path 
          d="M20 40 Q32.5 50 45 40 Q32.5 45 20 40" 
          fill="#333" 
          stroke="#333" 
          strokeWidth="1" 
        />
      );
    }
    
    if (mouthExpression === 'o') {
      return (
        <circle cx="32.5" cy="40" r="5" fill="#333" />
      );
    }
    
    if (mouthExpression === 'squiggle') {
      return (
        <path 
          d="M20 40 Q25 38 30 40 Q35 42 40 40 Q45 38 50 40" 
          fill="none" 
          stroke="#333" 
          strokeWidth="2"
          strokeLinecap="round" 
        />
      );
    }
    
    if (mouthExpression === 'grin') {
      return (
        <path 
          d="M15 40 Q32.5 55 50 40" 
          fill="none" 
          stroke="#333" 
          strokeWidth="2"
          strokeLinecap="round" 
        />
      );
    }
    
    // Default neutral mouth
    return (
      <line x1="20" y1="40" x2="45" y2="40" stroke="#333" strokeWidth="2" strokeLinecap="round" />
    );
  };

  // Don't render if not visible
  if (!isVisible) return null;

  const { width, height } = getSizeDimensions();
  const positionClasses = getPositionClasses();
  const mascotColor = getMascotColor();

  return (
    <AnimatePresence>
      <div className={`fixed ${positionClasses} z-50 flex flex-col items-center`}>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-2 shadow-lg max-w-[250px]"
          >
            <div className="relative">
              <p className="text-sm">{message}</p>
              {onDismiss && (
                <button 
                  onClick={() => {
                    setIsVisible(false);
                    if (onDismiss) onDismiss();
                  }}
                  className="absolute -top-2 -right-2 bg-gray-200 dark:bg-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </motion.div>
        )}
        
        <motion.div
          initial={{ scale: 0 }}
          animate={bounce ? { 
            y: [0, -15, 0],
            transition: { duration: 0.5 } 
          } : { scale: 1 }}
          exit={{ scale: 0 }}
          whileHover={{ scale: 1.1 }}
          className="cursor-pointer"
          onClick={() => setIsTalking(!isTalking)}
        >
          <svg width={width} height={height} viewBox="0 0 70 70">
            {/* Drop shadow for 3D effect */}
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="2" floodColor="#00000033" />
            </filter>
            
            {/* Body */}
            <motion.g filter="url(#shadow)">
              <motion.circle 
                cx="35" 
                cy="35" 
                r="30" 
                fill={mascotColor}
                animate={animated ? {
                  scale: [1, 1.05, 1],
                  transition: { 
                    repeat: Infinity, 
                    repeatType: "reverse", 
                    duration: 2 
                  }
                } : {}}
              />
            </motion.g>
            
            {/* Face */}
            {renderEyes()}
            
            {renderMouth()}
            
            {/* Rosy cheeks */}
            <circle cx="15" cy="30" r="4" fill="#FF9999" opacity="0.5" />
            <circle cx="55" cy="30" r="4" fill="#FF9999" opacity="0.5" />
            
            {/* Arm */}
            {isWaving && (
              <motion.path
                d="M15 45 Q5 40 0 30"
                fill="none"
                stroke={mascotColor}
                strokeWidth="5"
                strokeLinecap="round"
                animate={{
                  d: ["M15 45 Q5 40 0 30", "M15 45 Q5 30 0 25", "M15 45 Q5 40 0 30"],
                }}
                transition={{
                  repeat: 2,
                  duration: 0.5,
                }}
              />
            )}
            
            {/* Static arm if not waving */}
            {!isWaving && (
              <path
                d="M15 45 Q10 50 5 50"
                fill="none"
                stroke={mascotColor}
                strokeWidth="5"
                strokeLinecap="round"
              />
            )}
            
            {/* Other arm */}
            <path
              d="M55 45 Q60 50 65 50"
              fill="none"
              stroke={mascotColor}
              strokeWidth="5"
              strokeLinecap="round"
            />
            
            {/* Optional accessories based on expression */}
            {expression === 'thinking' && (
              <path
                d="M60 15 Q63 12 66 15 Q69 18 66 21"
                fill="none"
                stroke="#333"
                strokeWidth="1"
                strokeLinecap="round"
              />
            )}
          </svg>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};