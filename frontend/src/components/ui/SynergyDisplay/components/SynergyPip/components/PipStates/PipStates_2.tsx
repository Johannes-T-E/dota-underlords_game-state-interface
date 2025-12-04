import React from 'react';

/**
 * Get asset URL from local assets folder (relative to SynergyPip component)
 */
function getAssetUrl(filename: string): string {
  return new URL(`../../assets/2_pips/${filename}`, import.meta.url).href;
}

export const PipState_AA: React.FC = () => {
  const halfBar = getAssetUrl('empty_synergy_pip_half_bar_psd.png');
  const halfBarBorder = getAssetUrl('empty_synergy_pip_half_bar_border_psd.png');
  const halfBarBorderPop = getAssetUrl('empty_synergy_pip_half_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={halfBar} alt="" />
      <div className="pip-state-mask z-0 color-fill" style={{ maskImage: `url(${halfBar})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={halfBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={halfBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${halfBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${halfBarBorderPop})` }} />
    </>
  );
};

export const PipState_EE: React.FC = () => {
  const halfBar = getAssetUrl('empty_synergy_pip_half_bar_psd.png');
  const halfBarBorder = getAssetUrl('empty_synergy_pip_half_bar_border_psd.png');
  const halfBarBorderPop = getAssetUrl('empty_synergy_pip_half_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={halfBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${halfBar})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={halfBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={halfBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${halfBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${halfBarBorderPop})` }} />
    </>
  );
};

export const PipState_BB: React.FC = () => {
  const halfBar = getAssetUrl('empty_synergy_pip_half_bar_psd.png');
  const halfBarBench = getAssetUrl('empty_synergy_pip_half_bar_bench_psd.png');
  const halfBarBorder = getAssetUrl('empty_synergy_pip_half_bar_border_psd.png');
  const halfBarBorderPop = getAssetUrl('empty_synergy_pip_half_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={halfBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${halfBar})` }} />
      <img className="pip-state-layer z-1" src={halfBarBench} alt="" />
      <div className="pip-state-mask z-1 color-fill" style={{ maskImage: `url(${halfBarBench})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={halfBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={halfBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${halfBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${halfBarBorderPop})` }} />
    </>
  );
};

export const PipState_AE: React.FC = () => {
  const halfBar = getAssetUrl('empty_synergy_pip_half_bar_psd.png');
  const halfBarPartial = getAssetUrl('empty_synergy_pip_half_bar_partial_psd.png');
  const halfBarBorder = getAssetUrl('empty_synergy_pip_half_bar_border_psd.png');
  const halfBarBorderPop = getAssetUrl('empty_synergy_pip_half_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={halfBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${halfBar})` }} />
      <img className="pip-state-layer z-1" src={halfBar} alt="" />
      <div className="pip-state-mask z-1 color-background" style={{ maskImage: `url(${halfBar})` }} />
      <img className="pip-state-layer z-2" src={halfBarPartial} alt="" />
      <div className="pip-state-mask z-2 color-fill" style={{ maskImage: `url(${halfBarPartial})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={halfBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={halfBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${halfBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${halfBarBorderPop})` }} />
    </>
  );
};

export const PipState_AB: React.FC = () => {
  const halfBar = getAssetUrl('empty_synergy_pip_half_bar_psd.png');
  const halfBarBench = getAssetUrl('empty_synergy_pip_half_bar_bench_psd.png');
  const halfBarPartial = getAssetUrl('empty_synergy_pip_half_bar_partial_psd.png');
  const halfBarBorder = getAssetUrl('empty_synergy_pip_half_bar_border_psd.png');
  const halfBarBorderPop = getAssetUrl('empty_synergy_pip_half_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={halfBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${halfBar})` }} />
      <img className="pip-state-layer z-1" src={halfBarBench} alt="" />
      <div className="pip-state-mask z-1 color-fill" style={{ maskImage: `url(${halfBarBench})` }} />
      <img className="pip-state-layer z-2" src={halfBarPartial} alt="" />
      <div className="pip-state-mask z-2 color-fill" style={{ maskImage: `url(${halfBarPartial})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={halfBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={halfBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${halfBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${halfBarBorderPop})` }} />
    </>
  );
};

export const PipState_BE: React.FC = () => {
  const halfBar = getAssetUrl('empty_synergy_pip_half_bar_psd.png');
  const halfBarBottomPip = getAssetUrl('empty_synergy_pip_half_bar_bottom_pip_psd.png');
  const halfBarPartialBench = getAssetUrl('empty_synergy_pip_half_bar_partial_bench_psd.png');
  const halfBarBorder = getAssetUrl('empty_synergy_pip_half_bar_border_psd.png');
  const halfBarBorderPop = getAssetUrl('empty_synergy_pip_half_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={halfBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${halfBar})` }} />
      <img className="pip-state-layer z-1" src={halfBarBottomPip} alt="" />
      <div className="pip-state-mask z-1 color-background" style={{ maskImage: `url(${halfBarBottomPip})` }} />
      <img className="pip-state-layer z-2" src={halfBarPartialBench} alt="" />
      <div className="pip-state-mask z-2 color-fill" style={{ maskImage: `url(${halfBarPartialBench})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={halfBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={halfBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${halfBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${halfBarBorderPop})` }} />
    </>
  );
};

