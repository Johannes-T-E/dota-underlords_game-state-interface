import React from 'react';

/**
 * Get asset URL from local assets folder (relative to SynergyPip component)
 */
function getAssetUrl(filename: string): string {
  return new URL(`../../assets/3_pips/${filename}`, import.meta.url).href;
}

export const PipState_AAA: React.FC = () => {
  const thirdBar = getAssetUrl('empty_synergy_pip_third_bar_psd.png');
  const thirdBarBorder = getAssetUrl('empty_synergy_pip_third_bar_border_psd.png');
  const thirdBarBorderPop = getAssetUrl('empty_synergy_pip_third_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={thirdBar} alt="" />
      <div className="pip-state-mask z-0 color-fill" style={{ maskImage: `url(${thirdBar})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={thirdBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={thirdBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorderPop})` }} />
    </>
  );
};

export const PipState_EEE: React.FC = () => {
  const thirdBar = getAssetUrl('empty_synergy_pip_third_bar_psd.png');
  const thirdBarBorder = getAssetUrl('empty_synergy_pip_third_bar_border_psd.png');
  const thirdBarBorderPop = getAssetUrl('empty_synergy_pip_third_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={thirdBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${thirdBar})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={thirdBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={thirdBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorderPop})` }} />
    </>
  );
};

export const PipState_BBB: React.FC = () => {
  const thirdBar = getAssetUrl('empty_synergy_pip_third_bar_psd.png');
  const thirdBarBench = getAssetUrl('empty_synergy_pip_third_bar_bench_psd.png');
  const thirdBarBorder = getAssetUrl('empty_synergy_pip_third_bar_border_psd.png');
  const thirdBarBorderPop = getAssetUrl('empty_synergy_pip_third_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={thirdBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${thirdBar})` }} />
      <img className="pip-state-layer z-1" src={thirdBarBench} alt="" />
      <div className="pip-state-mask z-1 color-fill" style={{ maskImage: `url(${thirdBarBench})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={thirdBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={thirdBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorderPop})` }} />
    </>
  );
};

export const PipState_ABE: React.FC = () => {
  const thirdBar = getAssetUrl('empty_synergy_pip_third_bar_psd.png');
  const thirdBarBench = getAssetUrl('empty_synergy_pip_third_bar_bench_psd.png');
  const thirdBarPartial1 = getAssetUrl('empty_synergy_pip_third_bar_partial_1_psd.png');
  const thirdBarBottomPip = getAssetUrl('empty_synergy_pip_third_bar_bottom_pip_psd.png');
  const thirdBarBorder = getAssetUrl('empty_synergy_pip_third_bar_border_psd.png');
  const thirdBarBorderPop = getAssetUrl('empty_synergy_pip_third_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={thirdBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${thirdBar})` }} />
      <img className="pip-state-layer z-1" src={thirdBarBench} alt="" />
      <div className="pip-state-mask z-1 color-fill" style={{ maskImage: `url(${thirdBarBench})` }} />
      <img className="pip-state-layer z-2" src={thirdBarPartial1} alt="" />
      <div className="pip-state-mask z-2 color-fill" style={{ maskImage: `url(${thirdBarPartial1})` }} />
      <img className="pip-state-layer z-3" src={thirdBarBottomPip} alt="" />
      <div className="pip-state-mask z-3 color-background" style={{ maskImage: `url(${thirdBarBottomPip})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={thirdBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={thirdBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorderPop})` }} />
    </>
  );
};

export const PipState_AEE: React.FC = () => {
  const thirdBar = getAssetUrl('empty_synergy_pip_third_bar_psd.png');
  const thirdBarPartial1 = getAssetUrl('empty_synergy_pip_third_bar_partial_1_psd.png');
  const thirdBarBorder = getAssetUrl('empty_synergy_pip_third_bar_border_psd.png');
  const thirdBarBorderPop = getAssetUrl('empty_synergy_pip_third_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={thirdBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${thirdBar})` }} />
      <img className="pip-state-layer z-1" src={thirdBar} alt="" />
      <div className="pip-state-mask z-1 color-background" style={{ maskImage: `url(${thirdBar})` }} />
      <img className="pip-state-layer z-2" src={thirdBarPartial1} alt="" />
      <div className="pip-state-mask z-2 color-fill" style={{ maskImage: `url(${thirdBarPartial1})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={thirdBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={thirdBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorderPop})` }} />
    </>
  );
};

export const PipState_AAE: React.FC = () => {
  const thirdBar = getAssetUrl('empty_synergy_pip_third_bar_psd.png');
  const thirdBarBottomPip = getAssetUrl('empty_synergy_pip_third_bar_bottom_pip_psd.png');
  const thirdBarPartial2 = getAssetUrl('empty_synergy_pip_third_bar_partial_2_psd.png');
  const thirdBarBorder = getAssetUrl('empty_synergy_pip_third_bar_border_psd.png');
  const thirdBarBorderPop = getAssetUrl('empty_synergy_pip_third_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={thirdBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${thirdBar})` }} />
      <img className="pip-state-layer z-1" src={thirdBarBottomPip} alt="" />
      <div className="pip-state-mask z-1 color-background" style={{ maskImage: `url(${thirdBarBottomPip})` }} />
      <img className="pip-state-layer z-2" src={thirdBarPartial2} alt="" />
      <div className="pip-state-mask z-2 color-fill" style={{ maskImage: `url(${thirdBarPartial2})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={thirdBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={thirdBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorderPop})` }} />
    </>
  );
};

export const PipState_ABB: React.FC = () => {
  const thirdBar = getAssetUrl('empty_synergy_pip_third_bar_psd.png');
  const thirdBarBench = getAssetUrl('empty_synergy_pip_third_bar_bench_psd.png');
  const thirdBarPartial1 = getAssetUrl('empty_synergy_pip_third_bar_partial_1_psd.png');
  const thirdBarBorder = getAssetUrl('empty_synergy_pip_third_bar_border_psd.png');
  const thirdBarBorderPop = getAssetUrl('empty_synergy_pip_third_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={thirdBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${thirdBar})` }} />
      <img className="pip-state-layer z-1" src={thirdBarBench} alt="" />
      <div className="pip-state-mask z-1 color-fill" style={{ maskImage: `url(${thirdBarBench})` }} />
      <img className="pip-state-layer z-2" src={thirdBarPartial1} alt="" />
      <div className="pip-state-mask z-2 color-fill" style={{ maskImage: `url(${thirdBarPartial1})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={thirdBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={thirdBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorderPop})` }} />
    </>
  );
};

export const PipState_AAB: React.FC = () => {
  const thirdBar = getAssetUrl('empty_synergy_pip_third_bar_psd.png');
  const thirdBarBench = getAssetUrl('empty_synergy_pip_third_bar_bench_psd.png');
  const thirdBarPartial2 = getAssetUrl('empty_synergy_pip_third_bar_partial_2_psd.png');
  const thirdBarBorder = getAssetUrl('empty_synergy_pip_third_bar_border_psd.png');
  const thirdBarBorderPop = getAssetUrl('empty_synergy_pip_third_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={thirdBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${thirdBar})` }} />
      <img className="pip-state-layer z-1" src={thirdBarBench} alt="" />
      <div className="pip-state-mask z-1 color-fill" style={{ maskImage: `url(${thirdBarBench})` }} />
      <img className="pip-state-layer z-2" src={thirdBarPartial2} alt="" />
      <div className="pip-state-mask z-2 color-fill" style={{ maskImage: `url(${thirdBarPartial2})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={thirdBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={thirdBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorderPop})` }} />
    </>
  );
};

export const PipState_BEE: React.FC = () => {
  const thirdBar = getAssetUrl('empty_synergy_pip_third_bar_psd.png');
  const thirdBarPartial1Bench = getAssetUrl('empty_synergy_pip_third_bar_partial_1_bench_psd.png');
  const thirdBarBorder = getAssetUrl('empty_synergy_pip_third_bar_border_psd.png');
  const thirdBarBorderPop = getAssetUrl('empty_synergy_pip_third_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={thirdBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${thirdBar})` }} />
      <img className="pip-state-layer z-1" src={thirdBar} alt="" />
      <div className="pip-state-mask z-1 color-background" style={{ maskImage: `url(${thirdBar})` }} />
      <img className="pip-state-layer z-2" src={thirdBarPartial1Bench} alt="" />
      <div className="pip-state-mask z-2 color-fill" style={{ maskImage: `url(${thirdBarPartial1Bench})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={thirdBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={thirdBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorderPop})` }} />
    </>
  );
};

export const PipState_BBE: React.FC = () => {
  const thirdBar = getAssetUrl('empty_synergy_pip_third_bar_psd.png');
  const thirdBarBottomPip = getAssetUrl('empty_synergy_pip_third_bar_bottom_pip_psd.png');
  const thirdBarPartial2Bench = getAssetUrl('empty_synergy_pip_third_bar_partial_2_bench_psd.png');
  const thirdBarBorder = getAssetUrl('empty_synergy_pip_third_bar_border_psd.png');
  const thirdBarBorderPop = getAssetUrl('empty_synergy_pip_third_bar_border_pop_psd.png');
  
  return (
    <>
      <img className="pip-state-layer z-0" src={thirdBar} alt="" />
      <div className="pip-state-mask z-0 color-background" style={{ maskImage: `url(${thirdBar})` }} />
      <img className="pip-state-layer z-1" src={thirdBarBottomPip} alt="" />
      <div className="pip-state-mask z-1 color-background" style={{ maskImage: `url(${thirdBarBottomPip})` }} />
      <img className="pip-state-layer z-2" src={thirdBarPartial2Bench} alt="" />
      <div className="pip-state-mask z-2 color-fill" style={{ maskImage: `url(${thirdBarPartial2Bench})` }} />
      <img className="pip-state-layer z-100 opacity-1" src={thirdBarBorder} alt="" />
      <img className="pip-state-layer z-100 opacity-80" src={thirdBarBorderPop} alt="" />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorder})` }} />
      <div className="pip-state-mask z-101 color-border" style={{ maskImage: `url(${thirdBarBorderPop})` }} />
    </>
  );
};
