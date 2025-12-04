import React from 'react';
import { HeroPortrait, Text as UIText } from '@/components/ui';
import { BaseChange } from './BaseChange';
import type { Change } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';

export interface UnitBenchedChangeProps {
  change: Change;
  playerName: string;
  timeDisplay: string;
  heroesData: HeroesData | null;
  player?: any;
}

export const UnitBenchedChange: React.FC<UnitBenchedChangeProps> = ({
  change,
  playerName,
  timeDisplay,
  heroesData
}) => {
  const icon = change.unit_id && change.rank !== undefined ? (
    <HeroPortrait
      unitId={change.unit_id}
      rank={change.rank}
      heroesData={heroesData}
    />
  ) : null;

  const content = (
    <div className="unit-changes-widget__change-info">
      {change.rank !== undefined && (
        <UIText variant="label" className="unit-changes-widget__unit-rank">
          Rank {change.rank}
        </UIText>
      )}
      {change.previous_position && (
        <UIText variant="label" className="unit-changes-widget__unit-position">
          Was at: ({change.previous_position.x}, {change.previous_position.y})
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

