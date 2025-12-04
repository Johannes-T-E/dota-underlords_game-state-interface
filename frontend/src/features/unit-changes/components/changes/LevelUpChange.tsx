import React from 'react';
import { LevelXpIndicator, Text as UIText } from '@/components/ui';
import { BaseChange } from './BaseChange';
import type { Change } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';

export interface LevelUpChangeProps {
  change: Change;
  playerName: string;
  timeDisplay: string;
  heroesData: HeroesData | null;
  player?: any;
}

export const LevelUpChange: React.FC<LevelUpChangeProps> = ({
  change,
  playerName,
  timeDisplay,
  heroesData,
  player
}) => {
  const icon = change.level_after !== undefined && player ? (
    <LevelXpIndicator
      level={change.level_after}
      xp={player.xp}
      nextLevelXp={player.next_level_xp}
      showXpText={false}
    />
  ) : null;

  const content = (
    <div className="unit-changes-widget__change-info">
      {change.level_before !== undefined && change.level_after !== undefined && (
        <UIText variant="label" className="unit-changes-widget__level-change">
          Level {change.level_before} → {change.level_after}
        </UIText>
      )}
    </div>
  );

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

