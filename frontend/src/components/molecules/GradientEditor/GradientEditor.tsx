import { useState, useCallback } from 'react';
import { Button } from '../../atoms/Button/Button';
import { GradientBar } from '../../atoms/GradientBar/GradientBar';
import type { HealthColorConfig, ColorStop } from '../HealthDisplay/HealthDisplaySettings';
import './GradientEditor.css';

export interface GradientEditorProps {
  config: HealthColorConfig;
  onChange: (config: HealthColorConfig) => void;
  className?: string;
}

export const GradientEditor = ({
  config,
  onChange,
  className = ''
}: GradientEditorProps) => {
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);

  const handleAddStop = useCallback(() => {
    const newStop: ColorStop = {
      position: 50,
      color: '#ffff00'
    };
    onChange({
      ...config,
      colorStops: [...config.colorStops, newStop].sort((a, b) => a.position - b.position)
    });
  }, [config, onChange]);

  const handleRemoveStop = useCallback((index: number) => {
    if (config.colorStops.length <= 2) return;
    
    onChange({
      ...config,
      colorStops: config.colorStops.filter((_, i) => i !== index)
    });
    setSelectedStopIndex(null);
  }, [config, onChange]);

  const handleUpdateStop = useCallback((index: number, updates: Partial<ColorStop>) => {
    const newStops = [...config.colorStops];
    const currentStop = newStops[index];
    newStops[index] = { 
      position: updates.position !== undefined ? updates.position : currentStop.position,
      color: updates.color !== undefined ? updates.color : currentStop.color
    };
    
    onChange({
      ...config,
      colorStops: newStops.sort((a, b) => a.position - b.position)
    });
  }, [config, onChange]);

  return (
    <div className={`gradient-editor ${className}`}>
      <GradientBar config={config} />
      
      <div className="gradient-editor__controls">
        {config.colorStops.map((stop, index) => (
          <div 
            key={index} 
            className={`gradient-editor__stop ${selectedStopIndex === index ? 'gradient-editor__stop--selected' : ''}`}
            onClick={() => setSelectedStopIndex(index)}
          >
            <div className="gradient-editor__stop-header">
              <span className="gradient-editor__stop-label">Stop {index + 1}</span>
              <Button
                variant="danger"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveStop(index);
                }}
                disabled={config.colorStops.length <= 2}
              >
                Remove
              </Button>
            </div>
            <div className="gradient-editor__stop-controls">
              <label className="gradient-editor__control">
                <span>Position:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={stop.position}
                  onChange={(e) => handleUpdateStop(index, { position: parseInt(e.target.value) || 0 })}
                  className="gradient-editor__input"
                />
              </label>
              <label className="gradient-editor__control">
                <span>Color:</span>
                <div className="gradient-editor__color-control">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => handleUpdateStop(index, { color: e.target.value })}
                    className="gradient-editor__color-picker"
                  />
                  <input
                    type="text"
                    value={stop.color}
                    onChange={(e) => handleUpdateStop(index, { color: e.target.value })}
                    className="gradient-editor__input gradient-editor__input--color"
                  />
                </div>
              </label>
            </div>
          </div>
        ))}
      </div>

      <Button variant="secondary" size="small" onClick={handleAddStop}>
        Add Color Stop
      </Button>
    </div>
  );
};

