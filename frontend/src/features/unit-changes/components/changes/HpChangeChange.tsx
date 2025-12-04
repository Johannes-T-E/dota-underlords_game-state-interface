import React from 'react';
import { Text as UIText, PhaseIcon, HealthDisplay } from '@/components/ui';
import { BaseChange } from './BaseChange';
import type { Change } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';

export interface HpChangeChangeProps {
  change: Change;
  playerName: string;
  timeDisplay: string;
  heroesData: HeroesData | null;
  player?: any;
}

export const HpChangeChange: React.FC<HpChangeChangeProps> = ({
  change,
  playerName,
  timeDisplay,
  heroesData,
  player
}) => {
  const icon = change.round_number !== undefined && change.round_phase ? (
    <div className="unit-changes-widget__round-icon">
      <UIText variant="label" weight="bold" className="unit-changes-widget__round-number">
        {change.round_number}
      </UIText>
      <PhaseIcon phase={change.round_phase} size="small" />
    </div>
  ) : null;

  const content = change.health_before !== undefined && change.health_after !== undefined && change.damage_taken !== undefined ? (
    <div className="unit-changes-widget__hp-change-info">
      <HealthDisplay health={change.health_before} />
      <HealthDisplay health={-change.damage_taken} />
      <HealthDisplay health={change.health_after} />
      {player && (player.win_streak > 0 || player.lose_streak > 0) && (
        <span className="unit-changes-widget__streak-info">
          {player.win_streak > 0 && `🔥 ${player.win_streak} win streak`}
          {player.lose_streak > 0 && `❄️ ${player.lose_streak} lose streak`}
        </span>
      )}
    </div>
  ) : undefined;

  return (
    <BaseChange
      change={change}
      playerName={playerName}
      timeDisplay={timeDisplay}
      heroesData={heroesData}
      icon={icon}
      content={content}
    />
  );
};

