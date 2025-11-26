import React from 'react';
import './SynergyPip.css';

export type PipState = 'active' | 'bench' | 'empty';

export interface SynergyPipProps {
  segmentNumber: number;      // 1, 2, or 3
  pipsPerBar: number;         // 1, 2, or 3
  pipStates: PipState[];      // State of each pip in this bar
  synergyColor: string;       // Computed synergy color
  bgColor?: string;           // Background color for empty pips
}

/**
 * Get pip image name based on bar type and which pips are filled
 */
function getPipImage(pipsPerBar: number, pipStates: PipState[], type: 'active' | 'bench'): string | null {
  const barType = pipsPerBar === 1 ? 'full_bar' : pipsPerBar === 2 ? 'half_bar' : 'third_bar';
  const isBench = type === 'bench';
  const suffix = isBench ? '_bench' : '';
  
  const filled = pipStates.filter(s => s === type).length;
  if (filled === 0) return null;
  
  const filledIndices = pipStates.map((s, i) => s === type ? i : -1).filter(i => i >= 0);
  
  if (pipsPerBar === 1) {
    return `empty_synergy_pip_${barType}${suffix}_psd.png`;
  }
  
  if (pipsPerBar === 2) {
    if (filled === 2) return `empty_synergy_pip_${barType}${suffix}_psd.png`;
    return filledIndices[0] === 0 
      ? `empty_synergy_pip_${barType}_partial${suffix}_psd.png`
      : `empty_synergy_pip_${barType}_bottom_pip${suffix.replace('_bench', '')}_psd.png`;
  }
  
  // Third bar (3 pips)
  if (filled === 3) return `empty_synergy_pip_${barType}${suffix}_psd.png`;
  if (filled === 2) {
    if (filledIndices.includes(0) && filledIndices.includes(1)) {
      return `empty_synergy_pip_${barType}_partial_2${suffix}_psd.png`;
    }
    return null; // Composite mask needed
  }
  if (filledIndices[0] === 0) return `empty_synergy_pip_${barType}_partial_1${suffix}_psd.png`;
  if (filledIndices[0] === 1) return `empty_synergy_pip_${barType}_middle_pip${suffix.replace('_bench', '')}_psd.png`;
  return `empty_synergy_pip_${barType}_bottom_pip${suffix.replace('_bench', '')}_psd.png`;
}

/**
 * Get mask images for bench pips
 */
function getBenchMasks(pipsPerBar: number, benchIndices: number[]): string {
  if (pipsPerBar === 1) {
    return "url('/icons/synergyicons/empty_synergy_pip_full_bar_psd.png')";
  }
  
  if (pipsPerBar === 2) {
    // For 2-pip, masks are applied per element, not here
    return '';
  }
  
  // 3-pip: composite mask
  return benchIndices.map(idx => {
    if (idx === 0) return "url('/icons/synergyicons/empty_synergy_pip_third_bar_partial_1_psd.png')";
    if (idx === 1) return "url('/icons/synergyicons/empty_synergy_pip_third_bar_middle_pip_psd.png')";
    return "url('/icons/synergyicons/empty_synergy_pip_third_bar_bottom_pip_psd.png')";
  }).join(', ');
}

const SynergyPip: React.FC<SynergyPipProps> = ({
  segmentNumber,
  pipsPerBar,
  pipStates,
  synergyColor,
  bgColor = '#1a1a1a'
}) => {
  const barType = pipsPerBar === 1 ? 'full_bar' : pipsPerBar === 2 ? 'half_bar' : 'third_bar';
  const emptyImg = `empty_synergy_pip_${barType}_psd.png`;
  
  // Get active fill image
  const activeImage = getPipImage(pipsPerBar, pipStates, 'active');
  
  // Get bench indices
  const benchIndices = pipStates.map((s, i) => s === 'bench' ? i : -1).filter(i => i >= 0);
  
  // Dynamic styles for masks and colors
  const emptyMaskStyle: React.CSSProperties = {
    maskImage: `url('/icons/synergyicons/${emptyImg}')`,
    WebkitMaskImage: `url('/icons/synergyicons/${emptyImg}')`,
    backgroundColor: bgColor,
  };
  
  const activeMaskStyle: React.CSSProperties = activeImage ? {
    maskImage: `url('/icons/synergyicons/${activeImage}')`,
    WebkitMaskImage: `url('/icons/synergyicons/${activeImage}')`,
    backgroundColor: synergyColor,
  } : {};
  
  // Render bench elements based on pipsPerBar
  const renderBenchElements = () => {
    if (benchIndices.length === 0) return null;
    
    if (pipsPerBar === 2) {
      // 2-pip bars: create individual element per pip
      return benchIndices.map(pipIdx => {
        const maskImg = pipIdx === 0 
          ? 'empty_synergy_pip_half_bar_partial_psd.png' 
          : 'empty_synergy_pip_half_bar_bottom_pip_psd.png';
        
        const benchStyle: React.CSSProperties = {
          backgroundImage: `url('/icons/synergyicons/empty_synergy_pip_half_bar_bench_psd.png')`,
          maskImage: `url('/icons/synergyicons/${maskImg}')`,
          WebkitMaskImage: `url('/icons/synergyicons/${maskImg}')`,
        };
        
        const benchAfterStyle: React.CSSProperties = {
          maskImage: `url('/icons/synergyicons/${maskImg}')`,
          WebkitMaskImage: `url('/icons/synergyicons/${maskImg}')`,
          backgroundColor: synergyColor,
        };
        
        return (
          <div 
            key={`bench-${pipIdx}`}
            className={`pip-segment pip-segment-bench bench-pip-${pipIdx}`}
            style={benchStyle}
          >
            <div className="pip-color-wash" style={benchAfterStyle} />
          </div>
        );
      });
    } else {
      // 1-pip and 3-pip bars: single element with masking
      const benchBgImg = pipsPerBar === 1 
        ? 'empty_synergy_pip_full_bar_bench_psd.png'
        : 'empty_synergy_pip_third_bar_partial_2_bench_psd.png';
      
      const masks = getBenchMasks(pipsPerBar, benchIndices);
      
      const benchStyle: React.CSSProperties = {
        backgroundImage: `url('/icons/synergyicons/${benchBgImg}')`,
        maskImage: masks,
        WebkitMaskImage: masks,
        maskComposite: pipsPerBar === 3 ? 'add' : undefined,
        WebkitMaskComposite: pipsPerBar === 3 ? 'source-over' : undefined,
      } as React.CSSProperties;
      
      const benchAfterStyle: React.CSSProperties = {
        maskImage: masks,
        WebkitMaskImage: masks,
        backgroundColor: synergyColor,
        maskComposite: pipsPerBar === 3 ? 'add' : undefined,
        WebkitMaskComposite: pipsPerBar === 3 ? 'source-over' : undefined,
      } as React.CSSProperties;
      
      return (
        <div 
          className="pip-segment pip-segment-bench"
          style={benchStyle}
        >
          <div className="pip-color-wash" style={benchAfterStyle} />
        </div>
      );
    }
  };
  
  return (
    <div className={`synergy-pip segment${segmentNumber}`}>
      {/* Empty background layer */}
      <div 
        className="pip-segment pip-segment-bg"
        style={{ backgroundImage: `url('/icons/synergyicons/${emptyImg}')` }}
      >
        <div className="pip-color-wash" style={emptyMaskStyle} />
      </div>
      
      {/* Active fill layer */}
      {activeImage && (
        <div 
          className="pip-segment pip-segment-fill"
          style={{ backgroundImage: `url('/icons/synergyicons/${activeImage}')` }}
        >
          <div className="pip-color-wash" style={activeMaskStyle} />
        </div>
      )}
      
      {/* Bench fill layer(s) */}
      {renderBenchElements()}
    </div>
  );
};

export default SynergyPip;

