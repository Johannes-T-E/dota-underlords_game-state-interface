import React, { useMemo, memo } from 'react';
import './SynergyIcon.css';

export interface SynergyIconProps {
  styleNumber: number;        // Capsule style (1-16)
  iconFile: string;           // Icon image filename
  synergyName: string;        // For alt text
  synergyColor: string;       // Computed synergy color
  brightColor: string;        // Computed bright color for border pop
  isActive?: boolean;         // Whether the synergy is active (default: true)
  inactiveColor?: string;     // Color to use when inactive (default: #1a1a1a)
}

/**
 * Get asset URL from local assets folder
 */
function getAssetUrl(filename: string): string {
  return new URL(`./assets/${filename}`, import.meta.url).href;
}

/**
 * SynergyIcon - Optimized component for synergy capsule display
 * 
 * Features:
 * - Memoized image paths and styles
 * - React.memo for preventing unnecessary re-renders
 * - CSS custom properties for dynamic colors
 */
const SynergyIcon: React.FC<SynergyIconProps> = memo(({
  styleNumber,
  iconFile,
  synergyName,
  synergyColor,
  brightColor,
  isActive = true,
  inactiveColor = '#1a1a1a'
}) => {
  // Memoize style number string
  const styleNum = useMemo(() => 
    styleNumber.toString().padStart(2, '0'), 
    [styleNumber]
  );

  // Memoize image paths using local assets
  const imagePaths = useMemo(() => ({
    base: getAssetUrl(`leftcapsule${styleNum}_psd.png`),
    border: getAssetUrl(`leftcapsule_border${styleNum}_psd.png`),
    borderPop: getAssetUrl(`leftcapsule_border_bottom_pop${styleNum}_psd.png`),
    icon: getAssetUrl(iconFile)
  }), [styleNum, iconFile]);

  // Determine colors based on active state
  const effectiveSynergyColor = isActive ? synergyColor : inactiveColor;
  const effectiveBrightColor = isActive ? brightColor : inactiveColor;

  // Memoize inline styles
  const baseColorWashStyle = useMemo<React.CSSProperties>(() => ({
    maskImage: `url('${imagePaths.base}')`,
    WebkitMaskImage: `url('${imagePaths.base}')`,
    backgroundColor: effectiveSynergyColor,
  }), [imagePaths.base, effectiveSynergyColor]);

  const borderPopColorWashStyle = useMemo<React.CSSProperties>(() => ({
    maskImage: `url('${imagePaths.borderPop}')`,
    WebkitMaskImage: `url('${imagePaths.borderPop}')`,
    backgroundColor: effectiveBrightColor,
  }), [imagePaths.borderPop, effectiveBrightColor]);

  // Memoize background image styles
  const baseStyle = useMemo<React.CSSProperties>(() => ({
    backgroundImage: `url(${imagePaths.base})`
  }), [imagePaths.base]);

  const borderStyle = useMemo<React.CSSProperties>(() => ({
    backgroundImage: `url(${imagePaths.border})`
  }), [imagePaths.border]);

  const borderPopStyle = useMemo<React.CSSProperties>(() => ({
    backgroundImage: `url(${imagePaths.borderPop})`
  }), [imagePaths.borderPop]);

  return (
    <div className="synergy-icon-container">
      {/* Base capsule background */}
      <div className="capsule-bg" style={baseStyle}>
        <div className="capsule-color-wash" style={baseColorWashStyle} />
      </div>
      
      {/* Border layer */}
      <div className="capsule-border" style={borderStyle} />
      
      {/* Border pop layer */}
      <div className="capsule-border-pop" style={borderPopStyle}>
        <div className="capsule-color-wash" style={borderPopColorWashStyle} />
      </div>
      
      {/* Synergy icon */}
      <img 
        className="synergy-icon-image"
        src={imagePaths.icon}
        alt={`${synergyName} Synergy Icon`}
      />
    </div>
  );
});

SynergyIcon.displayName = 'SynergyIcon';

export default SynergyIcon;
