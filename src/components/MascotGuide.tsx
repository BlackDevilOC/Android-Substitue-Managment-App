import React, { useState, useEffect } from 'react';
import { Mascot } from './Mascot';
import { motion, AnimatePresence } from 'framer-motion';
import { getData, storeData } from '../utils/asyncStorage';

export interface GuideStep {
  id: string;
  message: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  expression?: 'happy' | 'thinking' | 'excited' | 'surprised';
  highlightSelector?: string; // CSS selector for element to highlight
  action?: 'click' | 'input' | 'hover' | null;
  delay?: number; // Delay before showing this step (ms)
}

interface MascotGuideProps {
  tourId: string; // Unique identifier for this tour
  steps: GuideStep[];
  onComplete?: () => void;
  skipLabel?: string;
  nextLabel?: string;
  forceShow?: boolean; // Set to true to show even if user has seen it before
}

/**
 * Guided tour component using the Mascot
 */
export const MascotGuide: React.FC<MascotGuideProps> = ({
  tourId,
  steps,
  onComplete,
  skipLabel = 'Skip',
  nextLabel = 'Next',
  forceShow = false,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);

  // Load previous tour state and check if we should show the tour
  useEffect(() => {
    const checkTourState = async () => {
      const completedTours = await getData('completed_tours') || [];
      
      // If tour is already completed and not forced, don't show
      if (completedTours.includes(tourId) && !forceShow) {
        return;
      }
      
      // Start tour
      setCurrentStepIndex(0);
      setIsVisible(true);
    };
    
    checkTourState();
  }, [tourId, forceShow]);

  // Mark tour as completed
  const markTourCompleted = async () => {
    const completedTours = await getData('completed_tours') || [];
    if (!completedTours.includes(tourId)) {
      await storeData('completed_tours', [...completedTours, tourId]);
    }
  };

  // Skip the tour
  const skipTour = () => {
    setIsVisible(false);
    setCurrentStepIndex(null);
    markTourCompleted();
    if (onComplete) onComplete();
  };

  // Go to next step
  const nextStep = () => {
    if (currentStepIndex === null) return;
    
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // End of tour
      setIsVisible(false);
      setCurrentStepIndex(null);
      markTourCompleted();
      if (onComplete) onComplete();
    }
  };

  // Update highlighted element when step changes
  useEffect(() => {
    if (currentStepIndex === null || !isVisible) {
      setHighlightedElement(null);
      return;
    }
    
    const currentStep = steps[currentStepIndex];
    
    // If there's a selector, find the element to highlight
    if (currentStep.highlightSelector) {
      const element = document.querySelector(currentStep.highlightSelector);
      setHighlightedElement(element);
    } else {
      setHighlightedElement(null);
    }
    
    // Apply delay if specified
    if (currentStep.delay) {
      const timer = setTimeout(() => {
        // This just ensures the animation runs
        setIsVisible(false);
        setTimeout(() => setIsVisible(true), 10);
      }, currentStep.delay);
      
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, steps, isVisible]);

  // Don't render if not visible or no current step
  if (!isVisible || currentStepIndex === null) return null;

  const currentStep = steps[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30 pointer-events-auto" />
      
      {/* Highlight cutout for selected element */}
      {highlightedElement && (
        <HighlightCutout element={highlightedElement} />
      )}
      
      {/* Controls */}
      <div className="absolute bottom-4 left-4 flex gap-2 pointer-events-auto">
        <button 
          onClick={skipTour}
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-3 py-1 rounded-md text-sm"
        >
          {skipLabel}
        </button>
        <button 
          onClick={nextStep}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
        >
          {nextLabel}
        </button>
      </div>
      
      {/* Mascot with current step message */}
      <div className="pointer-events-auto">
        <Mascot 
          message={currentStep.message}
          position={currentStep.position}
          expression={currentStep.expression}
          onDismiss={nextStep}
          size="medium"
        />
      </div>
    </div>
  );
};

// Component to create a cutout highlight effect for a specific element
const HighlightCutout: React.FC<{ element: Element }> = ({ element }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  
  useEffect(() => {
    if (!element) return;
    
    // Get the element's bounding rect
    const boundingRect = element.getBoundingClientRect();
    setRect(boundingRect);
    
    // Set up resize observer to update when element size changes
    const resizeObserver = new ResizeObserver(() => {
      const newRect = element.getBoundingClientRect();
      setRect(newRect);
    });
    
    resizeObserver.observe(element);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [element]);
  
  if (!rect) return null;
  
  // Add some padding to the highlight
  const padding = 5;
  const highlightRect = {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute"
      style={{
        top: highlightRect.top,
        left: highlightRect.left,
        width: highlightRect.width,
        height: highlightRect.height,
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
        borderRadius: '4px',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div 
        className="absolute inset-0 border-2 border-blue-500 rounded-md"
        style={{ boxShadow: '0 0 10px rgba(59, 130, 246, 0.7)' }}
      />
    </motion.div>
  );
};

/**
 * Custom hook to display a mascot guide
 */
export function useMascotGuide(tourId: string, steps: GuideStep[], forceShow = false) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Function to show the guide
  const showGuide = () => setIsVisible(true);
  
  // Function to hide the guide
  const hideGuide = () => setIsVisible(false);
  
  // Render the guide component
  const renderGuide = () => {
    if (!isVisible) return null;
    
    return (
      <MascotGuide 
        tourId={tourId}
        steps={steps}
        onComplete={hideGuide}
        forceShow={forceShow}
      />
    );
  };
  
  return { showGuide, hideGuide, renderGuide };
}