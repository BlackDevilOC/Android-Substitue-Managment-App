import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Mascot } from './Mascot';
import { MascotGuide, GuideStep } from './MascotGuide';
import { FeatureDiscovery } from './FeatureDiscovery';
import { getData } from '../utils/asyncStorage';

// Action types for reducer
type MascotAction = 
  | { type: 'SHOW_MASCOT'; payload: { message?: string; expression?: 'happy' | 'thinking' | 'excited' | 'surprised'; position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; autoHide?: boolean; hideAfter?: number; } }
  | { type: 'HIDE_MASCOT' }
  | { type: 'SHOW_GUIDE'; payload: { tourId: string; steps: GuideStep[]; forceShow?: boolean } }
  | { type: 'HIDE_GUIDE' }
  | { type: 'SHOW_FEATURE'; payload: { featureId: string; title: string; description: string; onAction?: () => void; actionLabel?: string; mascotExpression?: 'happy' | 'thinking' | 'excited' | 'surprised'; } }
  | { type: 'HIDE_FEATURE' }
  | { type: 'CHECK_FIRST_VISIT' };

// State interface
interface MascotState {
  isMascotVisible: boolean;
  mascotMessage?: string;
  mascotExpression: 'happy' | 'thinking' | 'excited' | 'surprised';
  mascotPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  mascotAutoHide: boolean;
  mascotHideAfter: number;
  
  isGuideVisible: boolean;
  guideTourId?: string;
  guideSteps: GuideStep[];
  guideForceShow: boolean;
  
  isFeatureVisible: boolean;
  featureId?: string;
  featureTitle: string;
  featureDescription: string;
  featureAction?: () => void;
  featureActionLabel?: string;
  featureMascotExpression: 'happy' | 'thinking' | 'excited' | 'surprised';
  
  isFirstVisit: boolean;
}

// Initial state
const initialState: MascotState = {
  isMascotVisible: false,
  mascotExpression: 'happy',
  mascotPosition: 'bottom-right',
  mascotAutoHide: false,
  mascotHideAfter: 5000,
  
  isGuideVisible: false,
  guideSteps: [],
  guideForceShow: false,
  
  isFeatureVisible: false,
  featureTitle: '',
  featureDescription: '',
  featureMascotExpression: 'excited',
  
  isFirstVisit: false
};

// Reducer function
function mascotReducer(state: MascotState, action: MascotAction): MascotState {
  switch (action.type) {
    case 'SHOW_MASCOT':
      return {
        ...state,
        isMascotVisible: true,
        mascotMessage: action.payload.message,
        mascotExpression: action.payload.expression || state.mascotExpression,
        mascotPosition: action.payload.position || state.mascotPosition,
        mascotAutoHide: action.payload.autoHide !== undefined ? action.payload.autoHide : state.mascotAutoHide,
        mascotHideAfter: action.payload.hideAfter || state.mascotHideAfter
      };
      
    case 'HIDE_MASCOT':
      return {
        ...state,
        isMascotVisible: false
      };
      
    case 'SHOW_GUIDE':
      return {
        ...state,
        isGuideVisible: true,
        guideTourId: action.payload.tourId,
        guideSteps: action.payload.steps,
        guideForceShow: action.payload.forceShow || false
      };
      
    case 'HIDE_GUIDE':
      return {
        ...state,
        isGuideVisible: false
      };
      
    case 'SHOW_FEATURE':
      return {
        ...state,
        isFeatureVisible: true,
        featureId: action.payload.featureId,
        featureTitle: action.payload.title,
        featureDescription: action.payload.description,
        featureAction: action.payload.onAction,
        featureActionLabel: action.payload.actionLabel,
        featureMascotExpression: action.payload.mascotExpression || state.featureMascotExpression
      };
      
    case 'HIDE_FEATURE':
      return {
        ...state,
        isFeatureVisible: false
      };
      
    case 'CHECK_FIRST_VISIT':
      return {
        ...state,
        isFirstVisit: true
      };
      
    default:
      return state;
  }
}

// Context
interface MascotContextType {
  state: MascotState;
  showMascot: (options: { message?: string; expression?: 'happy' | 'thinking' | 'excited' | 'surprised'; position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; autoHide?: boolean; hideAfter?: number; }) => void;
  hideMascot: () => void;
  showGuide: (tourId: string, steps: GuideStep[], forceShow?: boolean) => void;
  hideGuide: () => void;
  showFeature: (featureId: string, options: { title: string; description: string; onAction?: () => void; actionLabel?: string; mascotExpression?: 'happy' | 'thinking' | 'excited' | 'surprised'; }) => void;
  hideFeature: () => void;
  isFirstVisit: boolean;
}

const MascotContext = createContext<MascotContextType | undefined>(undefined);

// Provider component
interface MascotProviderProps {
  children: ReactNode;
}

export const MascotProvider: React.FC<MascotProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(mascotReducer, initialState);
  
  // Check if it's the first visit when component mounts
  useEffect(() => {
    const checkFirstVisit = async () => {
      const hasVisitedBefore = await getData('has_visited_before');
      if (!hasVisitedBefore) {
        dispatch({ type: 'CHECK_FIRST_VISIT' });
      }
    };
    
    checkFirstVisit();
  }, []);
  
  // Context value
  const value: MascotContextType = {
    state,
    showMascot: (options) => dispatch({ type: 'SHOW_MASCOT', payload: options }),
    hideMascot: () => dispatch({ type: 'HIDE_MASCOT' }),
    showGuide: (tourId, steps, forceShow) => dispatch({ type: 'SHOW_GUIDE', payload: { tourId, steps, forceShow } }),
    hideGuide: () => dispatch({ type: 'HIDE_GUIDE' }),
    showFeature: (featureId, options) => dispatch({ type: 'SHOW_FEATURE', payload: { featureId, ...options } }),
    hideFeature: () => dispatch({ type: 'HIDE_FEATURE' }),
    isFirstVisit: state.isFirstVisit
  };
  
  return (
    <MascotContext.Provider value={value}>
      {children}
      
      {/* Mascot Component */}
      {state.isMascotVisible && (
        <Mascot
          message={state.mascotMessage}
          expression={state.mascotExpression}
          position={state.mascotPosition}
          animated={true}
          autoHide={state.mascotAutoHide}
          hideAfter={state.mascotHideAfter}
          onDismiss={() => dispatch({ type: 'HIDE_MASCOT' })}
        />
      )}
      
      {/* Guide Component */}
      {state.isGuideVisible && state.guideTourId && (
        <MascotGuide
          tourId={state.guideTourId}
          steps={state.guideSteps}
          onComplete={() => dispatch({ type: 'HIDE_GUIDE' })}
          forceShow={state.guideForceShow}
        />
      )}
      
      {/* Feature Discovery Component */}
      {state.isFeatureVisible && state.featureId && (
        <FeatureDiscovery
          featureId={state.featureId}
          title={state.featureTitle}
          description={state.featureDescription}
          onAction={state.featureAction}
          actionLabel={state.featureActionLabel}
          mascotExpression={state.featureMascotExpression}
          onDismiss={() => dispatch({ type: 'HIDE_FEATURE' })}
          triggerOnMount={false}
        />
      )}
    </MascotContext.Provider>
  );
};

// Custom hook to use mascot
export function useMascot() {
  const context = useContext(MascotContext);
  
  if (context === undefined) {
    throw new Error('useMascot must be used within a MascotProvider');
  }
  
  return context;
}