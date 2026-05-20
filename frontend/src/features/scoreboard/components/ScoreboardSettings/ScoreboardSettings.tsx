import { useState, useRef, useEffect } from 'react';
import { IconSettings } from '@tabler/icons-react';
import { Button, ColumnToggle } from '@/components/ui';
import {
  DEFAULT_SCOREBOARD_COLUMN_ORDER,
  SCOREBOARD_COLUMN_TOGGLES,
} from '@/features/scoreboard/scoreboardColumns';
import type { ScoreboardColumnConfig } from '@/types';
import './ScoreboardSettings.css';

export interface ScoreboardSettingsProps {
  config: ScoreboardColumnConfig;
  onChange: (config: ScoreboardColumnConfig) => void;
  showSynergyPips?: boolean;
  onShowSynergyPipsChange?: (show: boolean) => void;
  showPlayerRankText?: boolean;
  onShowPlayerRankTextChange?: (show: boolean) => void;
  className?: string;
}

export const ScoreboardSettings = ({ 
  config, 
  onChange,
  showSynergyPips = false,
  onShowSynergyPipsChange,
  showPlayerRankText = false,
  onShowPlayerRankTextChange,
  className = '' 
}: ScoreboardSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure config has all required properties to prevent controlled/uncontrolled input issues
  const safeConfig: ScoreboardColumnConfig = {
    place: config.place ?? true,
    player: config.player ?? false,
    playerRank: config.playerRank ?? true,
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
    synergies: config.synergies ?? true,
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
      playerRank: true,
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
      synergies: true,
      columnOrder: [...DEFAULT_SCOREBOARD_COLUMN_ORDER],
    };
    onChange(defaultConfig);
  };

  return (
    <div className={`scoreboard-settings ${className}`} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="small"
        className="scoreboard-settings__trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Column settings"
        aria-label="Column settings"
        aria-expanded={isOpen}
      >
        <IconSettings size={18} stroke={1.8} aria-hidden />
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
          {SCOREBOARD_COLUMN_TOGGLES.map(({ key, label }) => (
            <ColumnToggle
              key={key}
              label={label}
              enabled={safeConfig[key] ?? false}
              onChange={(enabled) => updateConfig(key, enabled)}
            />
          ))}
          {(safeConfig.playerRank && onShowPlayerRankTextChange) ||
          (safeConfig.synergies && onShowSynergyPipsChange) ? (
            <>
              <hr style={{ margin: '0.5rem 0', borderColor: 'var(--border-color)' }} />
              {safeConfig.playerRank && onShowPlayerRankTextChange && (
                <ColumnToggle
                  label="Show Rank Text"
                  enabled={showPlayerRankText}
                  onChange={onShowPlayerRankTextChange}
                />
              )}
              {safeConfig.synergies && onShowSynergyPipsChange && (
                <ColumnToggle
                  label="Show Synergy Pips"
                  enabled={showSynergyPips}
                  onChange={onShowSynergyPipsChange}
                />
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

