import React, { useMemo, useEffect } from 'react';
import './SynergyIcon.css';
import './synergy-colors.css';
import keywordMappings from './synergy-keyword-mappings.json';
import synergyStyles from './synergy-styles.json';
import synergyIconMap from './synergy-icon-map.json';

export interface SynergyIconProps {
  keyword: number;
}

/**
 * Converts a synergy name to the format used in CSS variables
 * e.g., "SpiritBrother" -> "spiritbrother", "Mage" -> "mage"
 */
function synergyNameToCssVar(synergyName: string): string {
  return synergyName.toLowerCase();
}

/**
 * Gets the CSS variable name for a synergy's color
 */
function getColorVar(synergyName: string, bright: boolean = false): string {
  const cssVar = synergyNameToCssVar(synergyName);
  const suffix = bright ? '-bright' : '';
  return `--synergy-${cssVar}-color${suffix}`;
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
  
  // Images are in public/icons/synergyicons/synergy_backing_layers/
  return `/icons/synergyicons/synergy_backing_layers/${filename}`;
}

/**
 * Gets the icon image path
 */
function getIconImagePath(iconFile: string): string {
  return `/icons/synergyicons/${iconFile}`;
}

const SynergyIcon: React.FC<SynergyIconProps> = ({ keyword }) => {
  const iconData = useMemo(() => {
    // Convert keyword to string for lookup
    const keywordStr = keyword.toString();
    
    // Get synergy name from keyword mapping
    const synergyName = (keywordMappings.keyword_mappings as Record<string, string>)[keywordStr];
    
    if (!synergyName) {
      // Fallback to default (Assassin)
      console.warn(`No synergy found for keyword ${keyword}, using default`);
      return {
        synergyName: 'Assassin',
        styleNumber: 16,
        iconFile: 'assassin_psd.png',
        colorVar: getColorVar('Assassin'),
        brightColorVar: getColorVar('Assassin', true),
      };
    }
    
    // Get style number (fallback to 1 if not found)
    const styleNumber = (synergyStyles as Record<string, number>)[synergyName] || 1;
    
    // Get icon file (fallback to beast if not found)
    const iconFile = (synergyIconMap as Record<string, string>)[synergyName] || 'beast_psd.png';
    
    // Get color variables
    const colorVar = getColorVar(synergyName);
    const brightColorVar = getColorVar(synergyName, true);
    
    return {
      synergyName,
      styleNumber,
      iconFile,
      colorVar,
      brightColorVar,
    };
  }, [keyword]);
  
  const { styleNumber, iconFile, colorVar, brightColorVar } = iconData;
  
  // Generate image paths
  const baseImagePath = getCapsuleImagePath(styleNumber, 'base');
  const borderImagePath = getCapsuleImagePath(styleNumber, 'border');
  const borderPopImagePath = getCapsuleImagePath(styleNumber, 'border-pop');
  const iconImagePath = getIconImagePath(iconFile);
  
  // Generate unique ID for this icon instance to scope the dynamic styles
  const iconId = useMemo(() => `synergy-icon-${keyword}-${styleNumber}`, [keyword, styleNumber]);
  
  // Inject dynamic styles for color wash layers
  useEffect(() => {
    const styleId = `dynamic-synergy-styles-${iconId}`;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // Get computed color values
    const root = document.documentElement;
    const computedColor = getComputedStyle(root).getPropertyValue(colorVar).trim();
    const computedBrightColor = getComputedStyle(root).getPropertyValue(brightColorVar).trim() || computedColor;
    
    styleElement.textContent = `
      .synergy-icon-wrapper#${iconId} .synergy-bg::after {
        mask-image: url(${baseImagePath}) !important;
        -webkit-mask-image: url(${baseImagePath}) !important;
        background-color: ${computedColor} !important;
      }
      .synergy-icon-wrapper#${iconId} .synergy-bg-border-pop::after {
        mask-image: url(${borderPopImagePath}) !important;
        -webkit-mask-image: url(${borderPopImagePath}) !important;
        background-color: ${computedBrightColor} !important;
      }
    `;
    
    return () => {
      // Cleanup: remove style element when component unmounts
      const element = document.getElementById(styleId);
      if (element) {
        element.remove();
      }
    };
  }, [iconId, baseImagePath, borderPopImagePath, colorVar, brightColorVar]);
  
  return (
    <div className="synergy-icon-wrapper" id={iconId} data-style={styleNumber}>
      {/* Base capsule background */}
      <div 
        className="synergy-bg"
        style={{ backgroundImage: `url(${baseImagePath})` }}
      />
      
      {/* Border layer */}
      <div 
        className="synergy-bg-border"
        style={{ backgroundImage: `url(${borderImagePath})` }}
      />
      
      {/* Border pop layer */}
      <div 
        className="synergy-bg-border-pop"
        style={{ backgroundImage: `url(${borderPopImagePath})` }}
      />
      
      {/* Synergy icon */}
      <img 
        className="synergy-icon"
        src={iconImagePath}
        alt={`${iconData.synergyName} Synergy Icon`}
      />
    </div>
  );
};

export { SynergyIcon };

