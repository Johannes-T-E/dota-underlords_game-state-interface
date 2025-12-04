import React from 'react';

/**
 * Get asset URL from local assets folder (relative to SynergyPip component)
 */
function getAssetUrl(filename: string): string {
  return new URL(`../../assets/1_pip/${filename}`, import.meta.url).href;
}

export const PipState_A: React.FC = () => {
  const fullBar = getAssetUrl('empty_synergy_pip_full_bar_psd.png');
  const fullBarBorder = getAssetUrl('empty_synergy_pip_full_bar_border_psd.png');
  const fullBarBorderPop = getAssetUrl('empty_synergy_pip_full_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-1" src={fullBar} alt="" />
      <div className="pip-state-mask z-1 color-fill" style={{ maskImage: `url(${fullBar})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={fullBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={fullBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${fullBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${fullBarBorderPop})` }} />
    </>
  );
};

export const PipState_E: React.FC = () => {
  const fullBar = getAssetUrl('empty_synergy_pip_full_bar_psd.png');
  const fullBarBorder = getAssetUrl('empty_synergy_pip_full_bar_border_psd.png');
  const fullBarBorderPop = getAssetUrl('empty_synergy_pip_full_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-1" src={fullBar} alt="" />
      <div className="pip-state-mask z-1 color-background" style={{ maskImage: `url(${fullBar})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={fullBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={fullBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${fullBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${fullBarBorderPop})` }} />
    </>
  );
};

export const PipState_B: React.FC = () => {
  const fullBar = getAssetUrl('empty_synergy_pip_full_bar_psd.png');
  const fullBarBench = getAssetUrl('empty_synergy_pip_full_bar_bench_psd.png');
  const fullBarBorder = getAssetUrl('empty_synergy_pip_full_bar_border_psd.png');
  const fullBarBorderPop = getAssetUrl('empty_synergy_pip_full_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={fullBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${fullBar})` }} />
      <img className="pip-state-layer z-1" src={fullBarBench} alt="" />
      <div className="pip-state-mask z-1 color-fill" style={{ maskImage: `url(${fullBarBench})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={fullBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={fullBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${fullBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${fullBarBorderPop})` }} />
    </>
  );
};

