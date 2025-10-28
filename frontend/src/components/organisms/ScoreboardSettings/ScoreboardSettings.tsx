import { useState, useRef, useEffect } from 'react';
import { Button } from '../../atoms';
import { ColumnToggle } from '../../molecules';
import type { ScoreboardColumnConfig } from '../../../types';
import './ScoreboardSettings.css';

export interface ScoreboardSettingsProps {
  config: ScoreboardColumnConfig;
  onChange: (config: ScoreboardColumnConfig) => void;
  className?: string;
}

export const ScoreboardSettings = ({ 
  config, 
  onChange,
  className = '' 
}: ScoreboardSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const updateConfig = (key: keyof ScoreboardColumnConfig, value: boolean) => {
    onChange({ [key]: value });
  };

  const handleReset = () => {
    const defaultConfig: ScoreboardColumnConfig = {
      place: true,
      player: false,
      playerName: true,
      level: true,
      gold: true,
      streak: true,
      health: true,
      record: true,
      networth: true,
      roster: true,
      bench: true,
      columnOrder: undefined
    };
    onChange(defaultConfig);
  };

  return (
    <div className={`scoreboard-settings ${className}`} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="small"
        onClick={() => setIsOpen(!isOpen)}
        title="Column settings"
      >
        ⚙
      </Button>

      {isOpen && (
        <div className="scoreboard-settings__dropdown">
          <Button 
            onClick={handleReset} 
            variant="secondary" 
            size="small"
            className="scoreboard-settings__reset-btn"
          >
            Reset to Default
          </Button>
          <hr style={{ margin: '0.5rem 0', borderColor: 'var(--border-color)' }} />
          <ColumnToggle
            label="Place"
            enabled={config.place}
            onChange={(enabled) => updateConfig('place', enabled)}
          />
          <ColumnToggle
            label="Player (Compact)"
            enabled={config.player}
            onChange={(enabled) => updateConfig('player', enabled)}
          />
          <ColumnToggle
            label="Player Name"
            enabled={config.playerName}
            onChange={(enabled) => updateConfig('playerName', enabled)}
          />
          <ColumnToggle
            label="Level"
            enabled={config.level}
            onChange={(enabled) => updateConfig('level', enabled)}
          />
          <ColumnToggle
            label="Gold"
            enabled={config.gold}
            onChange={(enabled) => updateConfig('gold', enabled)}
          />
          <ColumnToggle
            label="Streak"
            enabled={config.streak}
            onChange={(enabled) => updateConfig('streak', enabled)}
          />
          <ColumnToggle
            label="Health"
            enabled={config.health}
            onChange={(enabled) => updateConfig('health', enabled)}
          />
          <ColumnToggle
            label="Record"
            enabled={config.record}
            onChange={(enabled) => updateConfig('record', enabled)}
          />
          <ColumnToggle
            label="Net Worth"
            enabled={config.networth}
            onChange={(enabled) => updateConfig('networth', enabled)}
          />
          <ColumnToggle
            label="Roster"
            enabled={config.roster}
            onChange={(enabled) => updateConfig('roster', enabled)}
          />
          <ColumnToggle
            label="Bench"
            enabled={config.bench}
            onChange={(enabled) => updateConfig('bench', enabled)}
          />
        </div>
      )}
    </div>
  );
};

