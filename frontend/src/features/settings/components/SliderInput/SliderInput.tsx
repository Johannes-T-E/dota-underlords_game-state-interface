import { useState, useEffect } from 'react';
import './SliderInput.css';

export interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  leftLabel?: string;
  rightLabel?: string;
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SliderInput = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = '',
  leftLabel,
  rightLabel,
  showValue = true,
  disabled = false,
  className = ''
}: SliderInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div className={`slider-input ${disabled ? 'slider-input--disabled' : ''} ${className}`}>
      {label && <label className="slider-input__label">{label}</label>}
      
      <div className="slider-input__container">
        {leftLabel && <span className="slider-input__edge-label">{leftLabel}</span>}
        
        <div className="slider-input__track-wrapper">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={handleChange}
            disabled={disabled}
            className="slider-input__slider"
            style={{
              background: `linear-gradient(to right, #5865f2 0%, #5865f2 ${percentage}%, #4e4e4e ${percentage}%, #4e4e4e 100%)`
            }}
          />
        </div>
        
        {rightLabel && <span className="slider-input__edge-label">{rightLabel}</span>}
        
        {showValue && (
          <span className="slider-input__value">
            {localValue}{unit}
          </span>
        )}
      </div>
    </div>
  );
};

