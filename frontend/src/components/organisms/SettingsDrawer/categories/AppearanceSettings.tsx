import { useState } from 'react';
import { ToggleSwitch, SliderInput, PresetButton, GradientBar, Text } from '../../../atoms';
import { SettingsSection, SettingsGroup, SettingsRow, GradientEditor } from '../../../molecules';
import { HealthDisplay } from '../../../molecules/HealthDisplay/HealthDisplay';
import { useHealthSettings, useHeroPortraitSettings, useUnitAnimationSettings } from '../../../../hooks/useSettings';
import { Button } from '../../../atoms/Button/Button';
import type { HealthColorConfig } from '../../../molecules/HealthDisplay/HealthDisplaySettings';

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

const TYPOGRAPHY_PRESETS = {
  default: {
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    fontSize: '32px',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textShadow: '0 0 3px #000'
  },
  minimalist: {
    fontFamily: 'Arial, sans-serif',
    fontSize: '24px',
    fontWeight: '500',
    fontStyle: 'normal',
    textShadow: 'none'
  },
  cinematic: {
    fontFamily: 'Georgia, serif',
    fontSize: '36px',
    fontWeight: 'bold',
    fontStyle: 'italic',
    textShadow: '0 4px 8px rgba(0,0,0,0.8)'
  }
};

export const AppearanceSettings = () => {
  const { settings: healthSettings, updateSettings: updateHealthSettings, resetSettings: resetHealthSettings } = useHealthSettings();
  const { settings: heroSettings, updateSettings: updateHeroSettings, updateTierGlowConfig } = useHeroPortraitSettings();
  const { settings: animationSettings, updateSettings: updateAnimationSettings, resetSettings: resetAnimationSettings } = useUnitAnimationSettings();
  
  const [gradientPreset, setGradientPreset] = useState<string>('custom');
  const [typographyPreset, setTypographyPreset] = useState<string>('custom');

  // Health Display Handlers
  const handleGradientPresetChange = (preset: string) => {
    setGradientPreset(preset);
    if (preset !== 'custom') {
      updateHealthSettings({ colorConfig: GRADIENT_PRESETS[preset] });
    }
  };

  const handleTypographyPresetChange = (preset: string) => {
    setTypographyPreset(preset);
    if (preset !== 'custom') {
      updateHealthSettings({
        styling: {
          ...healthSettings.styling,
          ...TYPOGRAPHY_PRESETS[preset as keyof typeof TYPOGRAPHY_PRESETS]
        }
      });
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

      {/* Health Display Section */}
      <SettingsSection 
        title="Health Display" 
        description="Customize how health values are shown throughout the app"
        defaultOpen={true}
      >
        {/* Display Options */}
        <SettingsGroup variant="card" title="Display Options">
          <SettingsRow label="Show Heart Icon" description="Display a heart icon next to health values">
            <ToggleSwitch
              checked={healthSettings.showIcon}
              onChange={(checked) => updateHealthSettings({ showIcon: checked })}
            />
          </SettingsRow>
          <SettingsRow label="Show Health Number" description="Display the numeric health value">
            <ToggleSwitch
              checked={healthSettings.showValue}
              onChange={(checked) => updateHealthSettings({ showValue: checked })}
            />
          </SettingsRow>
          <SettingsRow label="Color Gradient" description="Use color transitions based on health value">
            <ToggleSwitch
              checked={healthSettings.useColorTransition}
              onChange={(checked) => updateHealthSettings({ useColorTransition: checked })}
            />
          </SettingsRow>
        </SettingsGroup>

        {/* Color & Gradient */}
        {healthSettings.useColorTransition && (
          <SettingsGroup variant="card" title="Color Gradient">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
              <PresetButton
                label="Custom"
                selected={gradientPreset === 'custom'}
                onClick={() => setGradientPreset('custom')}
              />
            </div>

            {gradientPreset === 'custom' && healthSettings.colorConfig && (
              <GradientEditor
                config={healthSettings.colorConfig}
                onChange={(config) => updateHealthSettings({ colorConfig: config })}
              />
            )}

            {gradientPreset !== 'custom' && healthSettings.colorConfig && (
              <GradientBar config={healthSettings.colorConfig} />
            )}
          </SettingsGroup>
        )}

        {/* Typography */}
        <SettingsGroup variant="card" title="Typography">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <PresetButton
              label="Default"
              selected={typographyPreset === 'default'}
              onClick={() => handleTypographyPresetChange('default')}
            />
            <PresetButton
              label="Minimalist"
              selected={typographyPreset === 'minimalist'}
              onClick={() => handleTypographyPresetChange('minimalist')}
            />
            <PresetButton
              label="Cinematic"
              selected={typographyPreset === 'cinematic'}
              onClick={() => handleTypographyPresetChange('cinematic')}
            />
            <PresetButton
              label="Custom"
              selected={typographyPreset === 'custom'}
              onClick={() => setTypographyPreset('custom')}
            />
          </div>

          {typographyPreset === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SettingsRow label="Font Size" layout="vertical">
                <SliderInput
                  value={parseInt(healthSettings.styling?.fontSize || '32')}
                  onChange={(value) => updateHealthSettings({
                    styling: { ...healthSettings.styling, fontSize: `${value}px` }
                  })}
                  min={16}
                  max={64}
                  unit="px"
                  leftLabel="Small"
                  rightLabel="Large"
                />
              </SettingsRow>
            </div>
          )}
        </SettingsGroup>

        {/* Animation */}
        <SettingsGroup variant="card" title="Animation">
          <SettingsRow label="Animate Health Changes" description="Play animation when health value changes">
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

        {/* Preview */}
        <SettingsGroup variant="card" title="Preview">
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'space-around',
            padding: '16px',
            background: 'var(--primary-color)',
            borderRadius: '6px'
          }}>
            <HealthDisplay health={100} settings={healthSettings} />
            <HealthDisplay health={75} settings={healthSettings} />
            <HealthDisplay health={50} settings={healthSettings} />
            <HealthDisplay health={25} settings={healthSettings} />
            <HealthDisplay health={0} settings={healthSettings} />
          </div>
        </SettingsGroup>

        <Button variant="secondary" onClick={resetHealthSettings}>
          Reset Health Display Settings
        </Button>
      </SettingsSection>

      {/* Hero Portraits Section */}
      <SettingsSection 
        title="Hero Portraits" 
        description="Visual enhancements for hero images"
        defaultOpen={true}
      >
        <SettingsGroup variant="card" title="Tier Glow Effects">
          <SettingsRow 
            label="Enable Tier Glows" 
            description="Show colored outlines based on hero tier (1-5)"
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
      </SettingsSection>

      {/* Unit Animation Section */}
      <SettingsSection 
        title="Unit Animations" 
        description="Control how units move and appear on the board"
        defaultOpen={true}
      >
        <SettingsGroup variant="card" title="Movement Animation">
          <SettingsRow 
            label="Enable Position Animation" 
            description="Animate units when they move between positions"
          >
            <ToggleSwitch
              checked={animationSettings?.enablePositionAnimation || true}
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
                  max={1000}
                  step={50}
                  unit="ms"
                  leftLabel="Slow"
                  rightLabel="Fast"
                />
              </SettingsRow>

              <SettingsRow 
                label="Show Movement Trail" 
                description="Display a visual trail behind moving units"
              >
                <ToggleSwitch
                  checked={animationSettings?.enableMovementTrail || true}
                  onChange={(checked) => updateAnimationSettings({ enableMovementTrail: checked })}
                />
              </SettingsRow>

              {animationSettings?.enableMovementTrail && (
                <>
                  <SettingsRow label="Trail Length" layout="vertical">
                    <SliderInput
                      value={animationSettings?.trailLength || 3}
                      onChange={(value) => updateAnimationSettings({ trailLength: value })}
                      min={1}
                      max={5}
                      step={1}
                      leftLabel="Short"
                      rightLabel="Long"
                    />
                  </SettingsRow>

                  <SettingsRow label="Trail Color" layout="vertical">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={animationSettings?.trailColor || '#ffffff'}
                        onChange={(e) => updateAnimationSettings({ trailColor: e.target.value })}
                        style={{ width: '40px', height: '32px', border: 'none', borderRadius: '4px' }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
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
                    />
                  </SettingsRow>

        <SettingsRow label="Trail Thickness" layout="vertical">
          <SliderInput
            value={animationSettings?.trailThickness || 2}
            onChange={(value) => updateAnimationSettings({ trailThickness: value })}
            min={1}
            max={5}
            step={1}
            leftLabel="Thin"
            rightLabel="Thick"
          />
        </SettingsRow>

        <SettingsRow label="Use Tier Color" layout="horizontal">
          <ToggleSwitch
            checked={animationSettings?.useTierColor || false}
            onChange={(checked) => updateAnimationSettings({ useTierColor: checked })}
          />
          <Text color="secondary">
            Use hero tier color for trail instead of custom color
          </Text>
        </SettingsRow>
      </>
    )}
            </>
          )}
        </SettingsGroup>

        <SettingsGroup variant="card" title="New Unit Effects">
          <SettingsRow 
            label="Fade In New Units" 
            description="Animate units when they first appear on the board"
          >
            <ToggleSwitch
              checked={animationSettings?.enableNewUnitFade || true}
              onChange={(checked) => updateAnimationSettings({ enableNewUnitFade: checked })}
            />
          </SettingsRow>
        </SettingsGroup>

        <Button variant="secondary" onClick={resetAnimationSettings}>
          Reset Animation Settings
        </Button>
      </SettingsSection>
    </div>
  );
};

