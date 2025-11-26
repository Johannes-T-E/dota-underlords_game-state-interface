import React from 'react';
import './SynergyIcon.css';

export interface SynergyIconProps {
  styleNumber: number;        // Capsule style (1-16)
  iconFile: string;           // Icon image filename
  synergyName: string;        // For alt text
  synergyColor: string;       // Computed synergy color
  brightColor: string;        // Computed bright color for border pop
}

/**
 * Gets the image path for a capsule style
 */
function getCapsuleImagePath(styleNumber: number, type: 'base' | 'border' | 'border-pop'): string {
  const styleNum = styleNumber.toString().padStart(2, '0');
  const filename = type === 'base' 
    ? `leftcapsule${styleNum}_psd.png`
    : type === 'border'
    ? `leftcapsule_border${styleNum}_psd.png`
    : `leftcapsule_border_bottom_pop${styleNum}_psd.png`;
  
  return `/icons/synergyicons/synergy_backing_layers/${filename}`;
}

const SynergyIcon: React.FC<SynergyIconProps> = ({
  styleNumber,
  iconFile,
  synergyName,
  synergyColor,
  brightColor
}) => {
  const styleNum = styleNumber.toString().padStart(2, '0');
  const baseImagePath = getCapsuleImagePath(styleNumber, 'base');
  const borderImagePath = getCapsuleImagePath(styleNumber, 'border');
  const borderPopImagePath = getCapsuleImagePath(styleNumber, 'border-pop');
  const iconImagePath = `/icons/synergyicons/${iconFile}`;
  
  // Inline styles for color washes
  const baseColorWashStyle: React.CSSProperties = {
    maskImage: `url('/icons/synergyicons/synergy_backing_layers/leftcapsule${styleNum}_psd.png')`,
    WebkitMaskImage: `url('/icons/synergyicons/synergy_backing_layers/leftcapsule${styleNum}_psd.png')`,
    backgroundColor: synergyColor,
  };
  
  const borderPopColorWashStyle: React.CSSProperties = {
    maskImage: `url('/icons/synergyicons/synergy_backing_layers/leftcapsule_border_bottom_pop${styleNum}_psd.png')`,
    WebkitMaskImage: `url('/icons/synergyicons/synergy_backing_layers/leftcapsule_border_bottom_pop${styleNum}_psd.png')`,
    backgroundColor: brightColor,
  };
  
  return (
    <div className="synergy-icon-container">
      {/* Base capsule background */}
      <div 
        className="capsule-bg"
        style={{ backgroundImage: `url(${baseImagePath})` }}
      >
        <div className="capsule-color-wash" style={baseColorWashStyle} />
      </div>
      
      {/* Border layer */}
      <div 
        className="capsule-border"
        style={{ backgroundImage: `url(${borderImagePath})` }}
      />
      
      {/* Border pop layer */}
      <div 
        className="capsule-border-pop"
        style={{ backgroundImage: `url(${borderPopImagePath})` }}
      >
        <div className="capsule-color-wash" style={borderPopColorWashStyle} />
      </div>
      
      {/* Synergy icon */}
      <img 
        className="synergy-icon-image"
        src={iconImagePath}
        alt={`${synergyName} Synergy Icon`}
      />
    </div>
  );
};

export default SynergyIcon;

