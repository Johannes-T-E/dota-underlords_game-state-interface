import { useState, useRef, useEffect } from 'react';
import { Button, ColumnToggle } from '@/components/ui';
import type { ScoreboardColumnConfig } from '@/types';
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

  // Ensure config has all required properties to prevent controlled/uncontrolled input issues
  const safeConfig: ScoreboardColumnConfig = {
    place: config.place ?? true,
    player: config.player ?? false,
    playerName: config.playerName ?? true,
    level: config.level ?? true,
    gold: config.gold ?? true,
    streak: config.streak ?? true,
    health: config.health ?? true,
    record: config.record ?? true,
    networth: config.networth ?? true,
    roster: config.roster ?? true,
    underlord: config.underlord ?? true,
    contraptions: config.contraptions ?? true,
    bench: config.bench ?? true,
    columnOrder: config.columnOrder
  };

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
    onChange({ ...safeConfig, [key]: value });
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
      underlord: true,
      contraptions: true,
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
            enabled={safeConfig.place}
            onChange={(enabled) => updateConfig('place', enabled)}
          />
          <ColumnToggle
            label="Player (Compact)"
            enabled={safeConfig.player}
            onChange={(enabled) => updateConfig('player', enabled)}
          />
          <ColumnToggle
            label="Player Name"
            enabled={safeConfig.playerName}
            onChange={(enabled) => updateConfig('playerName', enabled)}
          />
          <ColumnToggle
            label="Level"
            enabled={safeConfig.level}
            onChange={(enabled) => updateConfig('level', enabled)}
          />
          <ColumnToggle
            label="Gold"
            enabled={safeConfig.gold}
            onChange={(enabled) => updateConfig('gold', enabled)}
          />
          <ColumnToggle
            label="Streak"
            enabled={safeConfig.streak}
            onChange={(enabled) => updateConfig('streak', enabled)}
          />
          <ColumnToggle
            label="Health"
            enabled={safeConfig.health}
            onChange={(enabled) => updateConfig('health', enabled)}
          />
          <ColumnToggle
            label="Record"
            enabled={safeConfig.record}
            onChange={(enabled) => updateConfig('record', enabled)}
          />
          <ColumnToggle
            label="Net Worth"
            enabled={safeConfig.networth}
            onChange={(enabled) => updateConfig('networth', enabled)}
          />
          <ColumnToggle
            label="Roster"
            enabled={safeConfig.roster}
            onChange={(enabled) => updateConfig('roster', enabled)}
          />
          <ColumnToggle
            label="Underlord"
            enabled={safeConfig.underlord}
            onChange={(enabled) => updateConfig('underlord', enabled)}
          />
          <ColumnToggle
            label="Contraptions"
            enabled={safeConfig.contraptions}
            onChange={(enabled) => updateConfig('contraptions', enabled)}
          />
          <ColumnToggle
            label="Bench"
            enabled={safeConfig.bench}
            onChange={(enabled) => updateConfig('bench', enabled)}
          />
        </div>
      )}
    </div>
  );
};

