import './PhaseIcon.css';

export interface PhaseIconProps {
  phase: string;
  size?: 'small' | 'medium';
  className?: string;
}

export const PhaseIcon = ({ 
  phase, 
  size = 'medium',
  className = '' 
}: PhaseIconProps) => {
  const getPhaseIcon = () => {
    const normalizedPhase = phase.toLowerCase();
    
    if (normalizedPhase.includes('combat') || normalizedPhase.includes('fight')) {
      return '⚔';
    } else if (normalizedPhase.includes('preparation') || normalizedPhase.includes('shop')) {
      return '🛒';
    }
    
    // Default for unknown phases
    return '○';
  };

  return (
    <span 
      className={`phase-icon phase-icon--${size} ${className}`}
      title={phase}
      aria-label={phase}
    >
      {getPhaseIcon()}
    </span>
  );
};

