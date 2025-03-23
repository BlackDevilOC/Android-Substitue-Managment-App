import React, { useState, useEffect } from 'react';
import { Mascot } from './Mascot';
import { motion, AnimatePresence } from 'framer-motion';
import { getData, storeData } from '../utils/asyncStorage';

interface FeatureDiscoveryProps {
  featureId: string; // Unique identifier for this feature
  title: string;
  description: string;
  mascotExpression?: 'happy' | 'thinking' | 'excited' | 'surprised';
  mascotPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  triggerOnMount?: boolean;
  forceShow?: boolean; // Show even if user has seen it before
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

/**
 * Feature discovery component with mascot
 * Shows a card with title, description and mascot to highlight new features
 */
export const FeatureDiscovery: React.FC<FeatureDiscoveryProps> = ({
  featureId,
  title,
  description,
  mascotExpression = 'excited',
  mascotPosition = 'bottom-right',
  triggerOnMount = true,
  forceShow = false,
  onDismiss,
  onAction,
  actionLabel = 'Try it',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Check if user has seen this feature before
  useEffect(() => {
    if (!triggerOnMount) return;

    const checkFeatureStatus = async () => {
      const discoveredFeatures = await getData('discovered_features') || [];
      
      // If feature is already discovered and not forced, don't show
      if (discoveredFeatures.includes(featureId) && !forceShow) {
        return;
      }
      
      // Show the feature discovery
      setIsVisible(true);
    };
    
    checkFeatureStatus();
  }, [featureId, triggerOnMount, forceShow]);

  // Mark feature as discovered
  const markFeatureDiscovered = async () => {
    const discoveredFeatures = await getData('discovered_features') || [];
    if (!discoveredFeatures.includes(featureId)) {
      await storeData('discovered_features', [...discoveredFeatures, featureId]);
    }
  };

  // Handle dismiss action
  const handleDismiss = () => {
    setIsVisible(false);
    markFeatureDiscovered();
    if (onDismiss) onDismiss();
  };

  // Handle primary action
  const handleAction = () => {
    setIsVisible(false);
    markFeatureDiscovered();
    if (onAction) onAction();
  };

  // Manual trigger function
  const showFeature = () => {
    setIsVisible(true);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleDismiss}
      />
      
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
        >
          {/* Feature card header */}
          <div className="bg-blue-500 p-4 text-white relative">
            <h2 className="text-xl font-semibold">{title}</h2>
            
            {/* Close button */}
            <button 
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-white hover:bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          
          {/* Feature card content */}
          <div className="p-4">
            <div className="flex">
              <div className="flex-1 pr-4">
                <p className="mb-4">{description}</p>
                
                {/* Action buttons */}
                <div className="flex justify-end mt-4 gap-3">
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-white"
                  >
                    Dismiss
                  </button>
                  
                  {onAction && (
                    <button
                      onClick={handleAction}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                    >
                      {actionLabel}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Mascot */}
              <div className="w-20 flex-shrink-0 flex items-center justify-center">
                <div className="transform scale-75">
                  <Mascot 
                    size="medium"
                    expression={mascotExpression}
                    animated={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/**
 * Custom hook for feature discovery
 */
export function useFeatureDiscovery(featureId: string, options: Omit<FeatureDiscoveryProps, 'featureId' | 'triggerOnMount'>) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Function to show the feature discovery
  const showFeature = () => setIsVisible(true);
  
  // Function to hide the feature discovery
  const hideFeature = () => setIsVisible(false);
  
  // Render the feature discovery component
  const renderFeatureDiscovery = () => {
    if (!isVisible) return null;
    
    return (
      <FeatureDiscovery 
        featureId={featureId}
        {...options}
        triggerOnMount={false}
        onDismiss={() => {
          hideFeature();
          if (options.onDismiss) options.onDismiss();
        }}
      />
    );
  };
  
  return { showFeature, hideFeature, renderFeatureDiscovery };
}