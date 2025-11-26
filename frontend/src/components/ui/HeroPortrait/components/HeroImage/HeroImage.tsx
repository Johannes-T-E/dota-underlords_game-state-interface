import { useState } from 'react';
import { getHeroIconPath } from '@/utils/heroHelpers';
import './HeroImage.css';

export type HeroImageSize = 'small' | 'medium' | 'large';

export interface HeroImageProps {
  dotaUnitName: string;
  alt?: string;
  size?: HeroImageSize;
  className?: string;
  tierGlowClass?: string;
  tierGlowConfig?: {
    enableBorder: boolean;
    enableDropShadow: boolean;
    borderOpacity: number;
    dropShadowOpacity: number;
  };
  tierColors?: {
    primary: string;
    secondary: string;
  };
  onError?: () => void;
  unitId?: number; // Add unitId prop for contraption detection
  heroesData?: any; // Add heroesData prop for contraption detection
}

export const HeroImage = ({ 
  dotaUnitName, 
  alt = 'Hero', 
  size = 'medium',
  className = '',
  tierGlowClass = '',
  tierGlowConfig,
  tierColors,
  onError,
  unitId,
  heroesData
}: HeroImageProps) => {
  const [hasError, setHasError] = useState(false);
  
  // Use the helper function to get the correct image path
  const imagePath = hasError 
    ? '/icons/hero_icons_scaled_56x56/npc_dota_hero_abaddon_png.png'
    : (unitId && heroesData ? getHeroIconPath(unitId, heroesData) : `/icons/hero_icons_scaled_56x56/${dotaUnitName}_png.png`);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      onError?.();
    }
  };

  // Build dynamic CSS classes based on tier glow config
  const getTierGlowClasses = () => {
    if (!tierGlowClass || !tierGlowConfig) return tierGlowClass;
    
    const classes = [tierGlowClass];
    
    if (!tierGlowConfig.enableBorder) {
      classes.push('hero-image--no-border');
    }
    
    if (!tierGlowConfig.enableDropShadow) {
      classes.push('hero-image--no-dropshadow');
    }
    
    return classes.join(' ');
  };

  // Build dynamic styles for opacity
  const getTierGlowStyles = () => {
    if (!tierGlowClass || !tierGlowConfig || !tierColors) return {};
    
    const styles: React.CSSProperties & { [key: string]: any } = {};
    
    if (tierGlowConfig.enableBorder) {
      // Convert hex to rgba with opacity
      const borderColor = hexToRgba(tierColors.secondary, tierGlowConfig.borderOpacity);
      styles.border = `1px solid ${borderColor}`;
    }
    
    if (tierGlowConfig.enableDropShadow) {
      // Convert hex to rgba with opacity for both shadows
      const primaryShadow = hexToRgba(tierColors.primary, tierGlowConfig.dropShadowOpacity);
      const secondaryShadow = hexToRgba(tierColors.secondary, tierGlowConfig.dropShadowOpacity);
      styles.filter = `drop-shadow(0 0 3px ${primaryShadow}) drop-shadow(0 0 6px ${secondaryShadow})`;
    }
    
    return styles;
  };

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <img
      src={imagePath}
      alt={alt}
      className={`hero-image hero-image--${size} ${className} ${getTierGlowClasses()}`}
      style={getTierGlowStyles()}
      onError={handleError}
    />
  );
};

