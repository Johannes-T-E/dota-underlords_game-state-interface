import { useState } from 'react';
import './HeroImage.css';

export type HeroImageSize = 'small' | 'medium' | 'large';

export interface HeroImageProps {
  dotaUnitName: string;
  alt?: string;
  size?: HeroImageSize;
  className?: string;
  onError?: () => void;
}

export const HeroImage = ({ 
  dotaUnitName, 
  alt = 'Hero', 
  size = 'medium',
  className = '',
  onError
}: HeroImageProps) => {
  const [hasError, setHasError] = useState(false);
  
  const imagePath = hasError 
    ? '/icons/hero_icons_scaled_56x56/npc_dota_hero_abaddon_png.png'
    : `/icons/hero_icons_scaled_56x56/${dotaUnitName}_png.png`;

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      onError?.();
    }
  };

  return (
    <img
      src={imagePath}
      alt={alt}
      className={`hero-image hero-image--${size} ${className}`}
      onError={handleError}
    />
  );
};

