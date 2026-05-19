import { useMemo, useState } from 'react';
import { HealthDisplay, Button } from '@/components/ui';
import { ToggleSwitch } from '../../ToggleSwitch/ToggleSwitch';
import { SliderInput } from '../../SliderInput/SliderInput';
import { PresetButton } from '../../PresetButton/PresetButton';
import { SettingsTopicPanel } from '../../SettingsTopicPanel/SettingsTopicPanel';
import { SettingsGroup } from '../../SettingsGroup/SettingsGroup';
import { SettingsRow } from '../../SettingsRow/SettingsRow';
import { GradientEditor } from '../../GradientEditor/GradientEditor';
import { HeroPortrait } from '@/components/ui/HeroPortrait/HeroPortrait';
import { UnitAnimationBoardPreview } from '../../UnitAnimationBoardPreview/UnitAnimationBoardPreview';
import { useHealthSettings, useHeroPortraitSettings, useUnitAnimationSettings } from '@/hooks/useSettings';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import type { HealthColorConfig } from '@/components/ui/HealthDisplay/HealthDisplaySettings';
import './SettingsCategories.css';

// Preset configurations
const GRADIENT_PRESETS: { [key: string]: HealthColorConfig } = {
  classic: {
    colorStops: [
      { position: 0, color: '#cc4d1b' },
      { position: 100, color: '#a2ff92' }
    ],
    interpolation: { type: 'linear' }
  },
  cold: {
    colorStops: [
      { position: 0, color: '#1e3a8a' },
      { position: 100, color: '#67e8f9' }
    ],
    interpolation: { type: 'linear' }
  },
  warm: {
    colorStops: [
      { position: 0, color: '#c2410c' },
      { position: 100, color: '#fde047' }
    ],
    interpolation: { type: 'linear' }
  },
  monochrome: {
    colorStops: [
      { position: 0, color: '#404040' },
      { position: 100, color: '#f5f5f5' }
    ],
    interpolation: { type: 'linear' }
  }
};

export const AppearanceSettings = () => {
  const { settings: healthSettings, updateSettings: updateHealthSettings, resetSettings: resetHealthSettings } = useHealthSettings();
  const { settings: heroSettings, updateSettings: updateHeroSettings, updateTierGlowConfig } = useHeroPortraitSettings();
  const { settings: animationSettings, updateSettings: updateAnimationSettings, resetSettings: resetAnimationSettings } = useUnitAnimationSettings();
  const { heroesData } = useHeroesDataContext();
  
  const [gradientPreset, setGradientPreset] = useState<string>('classic');
  const [showCustomGradient, setShowCustomGradient] = useState(false);

  const previewHeroUnitIds = useMemo(() => {
    if (!heroesData?.heroes) {
      return [6, 18, 93];
    }

    const entries = Object.values(heroesData.heroes);
    const perTier = new Map<number, number>();

    for (const hero of entries) {
      const tier = Math.min(Math.max(hero.draftTier ?? 1, 1), 5);
      if (!perTier.has(tier)) {
        perTier.set(tier, hero.id);
      }
      if (perTier.size === 5) {
        break;
      }
    }

    return [1, 2, 3, 4, 5]
      .map((tier) => perTier.get(tier))
      .filter((id): id is number => typeof id === 'number');
  }, [heroesData]);

  // Health Display Handlers
  const handleGradientPresetChange = (preset: string) => {
    setGradientPreset(preset);
    if (preset !== 'custom') {
      setShowCustomGradient(false);
      updateHealthSettings({ colorConfig: GRADIENT_PRESETS[preset] });
    } else {
      setShowCustomGradient(true);
    }
  };

  const handleColorGradientToggle = (enabled: boolean) => {
    updateHealthSettings({ useColorTransition: enabled });
    if (enabled && !healthSettings.colorConfig) {
      updateHealthSettings({
        useColorTransition: true,
        colorConfig: GRADIENT_PRESETS.classic,
      });
      setGradientPreset('classic');
    }
    if (!enabled) {
      setShowCustomGradient(false);
    }
  };

  const handleAnimationSpeedChange = (value: number) => {
    // Inverse: faster = lower duration (200ms to 2000ms)
    const duration = 2200 - (value * 20);
    updateHealthSettings({
      styling: {
        ...healthSettings.styling,
        animationDuration: duration
      }
    });
  };

  const getAnimationSpeed = () => {
    const duration = healthSettings.styling?.animationDuration || 600;
    return (2200 - duration) / 20;
  };

  // Hero Portrait Handlers
  const handleTierGlowPresetChange = (preset: string) => {
    const presets = {
      subtle: { enableBorder: true, enableDropShadow: false, borderOpacity: 0.5, dropShadowOpacity: 0 },
      balanced: { enableBorder: true, enableDropShadow: true, borderOpacity: 0.8, dropShadowOpacity: 0.5 },
      dramatic: { enableBorder: true, enableDropShadow: true, borderOpacity: 1.0, dropShadowOpacity: 1.0 }
    };
    
    updateTierGlowConfig(presets[preset as keyof typeof presets]);
  };

  return (
    <div className="settings-category">
      <div className="settings-category__header">
        <h2 className="settings-category__title">Appearance</h2>
        <p className="settings-category__description">
          Customize visual elements, colors, and display styles
        </p>
      </div>

      <SettingsTopicPanel
        id="settings-health"
        className="settings-topic-panel--preview-wide"
        title="Health display"
        description="How health values are shown throughout the app"
        preview={
          <>
            <HealthDisplay health={100} settings={healthSettings} />
            <HealthDisplay health={65} settings={healthSettings} />
            <HealthDisplay health={30} settings={healthSettings} />
          </>
        }
      >
        <SettingsGroup variant="transparent">
          <SettingsRow label="Show heart icon" description="Display a heart icon next to health values">
            <ToggleSwitch
              checked={healthSettings.showIcon}
              onChange={(checked) => updateHealthSettings({ showIcon: checked })}
            />
          </SettingsRow>
          <SettingsRow label="Show health number" description="Display the numeric health value">
            <ToggleSwitch
              checked={healthSettings.showValue}
              onChange={(checked) => updateHealthSettings({ showValue: checked })}
            />
          </SettingsRow>
          <SettingsRow label="Use color gradient" description="Color by health amount">
            <ToggleSwitch
              checked={healthSettings.useColorTransition}
              onChange={handleColorGradientToggle}
            />
          </SettingsRow>
        </SettingsGroup>

        {healthSettings.useColorTransition && (
          <SettingsGroup variant="transparent" title="Color style">
            <div className="settings-preset-row">
              <PresetButton
                label="Classic"
                selected={gradientPreset === 'classic'}
                onClick={() => handleGradientPresetChange('classic')}
              />
              <PresetButton
                label="Cold"
                selected={gradientPreset === 'cold'}
                onClick={() => handleGradientPresetChange('cold')}
              />
              <PresetButton
                label="Warm"
                selected={gradientPreset === 'warm'}
                onClick={() => handleGradientPresetChange('warm')}
              />
              <PresetButton
                label="Mono"
                selected={gradientPreset === 'monochrome'}
                onClick={() => handleGradientPresetChange('monochrome')}
              />
            </div>
            {!showCustomGradient ? (
              <Button variant="ghost" size="small" onClick={() => setShowCustomGradient(true)}>
                Customize colors…
              </Button>
            ) : (
              <div className="settings-custom-gradient">
                {healthSettings.colorConfig && (
                  <GradientEditor
                    config={healthSettings.colorConfig}
                    onChange={(config) => updateHealthSettings({ colorConfig: config })}
                  />
                )}
                <Button variant="ghost" size="small" onClick={() => setShowCustomGradient(false)}>
                  Use presets only
                </Button>
              </div>
            )}
          </SettingsGroup>
        )}

        <SettingsGroup variant="transparent" title="Animation">
          <SettingsRow label="Animate health changes" description="When health value changes">
            <ToggleSwitch
              checked={healthSettings.animateOnChange}
              onChange={(checked) => updateHealthSettings({ animateOnChange: checked })}
            />
          </SettingsRow>

          {healthSettings.animateOnChange && (
            <>
              <SettingsRow label="Animation Speed" layout="vertical">
                <SliderInput
                  value={getAnimationSpeed()}
                  onChange={handleAnimationSpeedChange}
                  min={0}
                  max={100}
                  leftLabel="Slow"
                  rightLabel="Fast"
                  showValue={false}
                />
              </SettingsRow>
              <SettingsRow label="Animation Intensity" layout="vertical">
                <SliderInput
                  value={healthSettings.styling?.pulseScale || 1.2}
                  onChange={(value) => updateHealthSettings({
                    styling: { ...healthSettings.styling, pulseScale: value }
                  })}
                  min={1.0}
                  max={2.0}
                  step={0.1}
                  leftLabel="Subtle"
                  rightLabel="Dramatic"
                />
              </SettingsRow>
            </>
          )}
        </SettingsGroup>

        <Button variant="secondary" size="small" onClick={resetHealthSettings}>
          Reset health display
        </Button>
      </SettingsTopicPanel>

      <SettingsTopicPanel
        id="settings-heroes"
        className="settings-topic-panel--preview-wide"
        title="Hero portraits"
        description="Visual enhancements for hero images"
        preview={
          <div className="settings-example-portrait-row">
            {previewHeroUnitIds.map((unitId) => (
              <HeroPortrait key={unitId} unitId={unitId} rank={1} heroesData={heroesData} />
            ))}
          </div>
        }
      >
        <SettingsGroup variant="transparent">
          <SettingsRow 
            label="Enable tier glows" 
            description="Colored outlines based on hero tier (1–5)"
          >
            <ToggleSwitch
              checked={heroSettings?.enableTierGlow || false}
              onChange={(checked) => updateHeroSettings({ enableTierGlow: checked })}
            />
          </SettingsRow>

          {heroSettings?.enableTierGlow && (
            <>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                <PresetButton
                  label="Subtle"
                  onClick={() => handleTierGlowPresetChange('subtle')}
                />
                <PresetButton
                  label="Balanced"
                  onClick={() => handleTierGlowPresetChange('balanced')}
                />
                <PresetButton
                  label="Dramatic"
                  onClick={() => handleTierGlowPresetChange('dramatic')}
                />
              </div>

              <SettingsRow label="Border Effect">
                <ToggleSwitch
                  checked={heroSettings?.tierGlowConfig?.enableBorder || false}
                  onChange={(checked) => updateTierGlowConfig({ enableBorder: checked })}
                />
              </SettingsRow>

              {heroSettings?.tierGlowConfig?.enableBorder && (
                <SettingsRow label="Border Opacity" layout="vertical">
                  <SliderInput
                    value={heroSettings?.tierGlowConfig?.borderOpacity || 1}
                    onChange={(value) => updateTierGlowConfig({ borderOpacity: value })}
                    min={0}
                    max={1}
                    step={0.1}
                    leftLabel="Transparent"
                    rightLabel="Solid"
                  />
                </SettingsRow>
              )}

              <SettingsRow label="Drop Shadow Effect">
                <ToggleSwitch
                  checked={heroSettings?.tierGlowConfig?.enableDropShadow || false}
                  onChange={(checked) => updateTierGlowConfig({ enableDropShadow: checked })}
                />
              </SettingsRow>

              {heroSettings?.tierGlowConfig?.enableDropShadow && (
                <SettingsRow label="Shadow Opacity" layout="vertical">
                  <SliderInput
                    value={heroSettings?.tierGlowConfig?.dropShadowOpacity || 0.8}
                    onChange={(value) => updateTierGlowConfig({ dropShadowOpacity: value })}
                    min={0}
                    max={1}
                    step={0.1}
                    leftLabel="Subtle"
                    rightLabel="Strong"
                  />
                </SettingsRow>
              )}
            </>
          )}
        </SettingsGroup>
      </SettingsTopicPanel>

      <SettingsTopicPanel
        id="settings-animations"
        className="settings-topic-panel--preview-board"
        title="Unit animations"
        description="How units move and appear on the board"
        sidePreview={<UnitAnimationBoardPreview heroesData={heroesData} />}
      >
        <SettingsGroup variant="transparent" title="Movement">
          <SettingsRow 
            label="Animate position changes" 
            description="Animate units when they move between positions"
          >
            <ToggleSwitch
              checked={animationSettings?.enablePositionAnimation ?? true}
              onChange={(checked) => updateAnimationSettings({ enablePositionAnimation: checked })}
            />
          </SettingsRow>

          {animationSettings?.enablePositionAnimation && (
            <>
              <SettingsRow label="Animation Speed" layout="vertical">
                <SliderInput
                  value={animationSettings?.animationDuration || 300}
                  onChange={(value) => updateAnimationSettings({ animationDuration: value })}
                  min={100}
                  max={5000}
                  step={50}
                  unit="ms"
                  leftLabel="Fast"
                  rightLabel="Slow"
                  commitOnRelease
                />
              </SettingsRow>

              <SettingsRow 
                label="Show Movement Trail" 
                description="Display a visual trail behind moving units"
              >
                <ToggleSwitch
                  checked={animationSettings?.enableMovementTrail ?? true}
                  onChange={(checked) => updateAnimationSettings({ enableMovementTrail: checked })}
                />
              </SettingsRow>

              {animationSettings?.enableMovementTrail && (
                <>
                  <SettingsRow
                    label="Trail color"
                    description={
                      animationSettings?.useTierColor
                        ? 'Disabled while tier color is enabled'
                        : undefined
                    }
                    layout="vertical"
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={animationSettings?.trailColor || '#ffffff'}
                        disabled={animationSettings?.useTierColor}
                        onChange={(e) => updateAnimationSettings({ trailColor: e.target.value })}
                        style={{ width: '40px', height: '32px', border: 'none', borderRadius: '4px' }}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {animationSettings?.trailColor || '#ffffff'}
                      </span>
                    </div>
                  </SettingsRow>

                  <SettingsRow label="Trail Opacity" layout="vertical">
                    <SliderInput
                      value={Math.round((animationSettings?.trailOpacity || 0.6) * 100)}
                      onChange={(value) => updateAnimationSettings({ trailOpacity: value / 100 })}
                      min={10}
                      max={100}
                      step={5}
                      unit="%"
                      leftLabel="Faint"
                      rightLabel="Bright"
                      commitOnRelease
                    />
                  </SettingsRow>

                  <SettingsRow label="Trail thickness" layout="vertical">
                    <SliderInput
                      value={animationSettings?.trailThickness ?? 2}
                      onChange={(value) =>
                        updateAnimationSettings({ trailThickness: Math.round(value) })
                      }
                      min={1}
                      max={10}
                      step={1}
                      leftLabel="Thin"
                      rightLabel="Thick"
                      commitOnRelease
                    />
                  </SettingsRow>

                  <SettingsRow label="Use tier color">
                    <ToggleSwitch
                      checked={animationSettings?.useTierColor ?? false}
                      onChange={(checked) => updateAnimationSettings({ useTierColor: checked })}
                    />
                  </SettingsRow>
                </>
              )}
            </>
          )}

          <SettingsRow
            label="Fade in new units"
            description="Animate units when they first appear on the board"
          >
            <ToggleSwitch
              checked={animationSettings?.enableNewUnitFade ?? true}
              onChange={(checked) => updateAnimationSettings({ enableNewUnitFade: checked })}
            />
          </SettingsRow>
        </SettingsGroup>

        <Button variant="secondary" onClick={resetAnimationSettings}>
          Reset Animation Settings
        </Button>
      </SettingsTopicPanel>
    </div>
  );
};

