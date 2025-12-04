import React from 'react';
import { HeroPortrait, Text as UIText } from '@/components/ui';
import { BaseChange } from './BaseChange';
import type { Change } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';

export interface UnitRepositionChangeProps {
  change: Change;
  playerName: string;
  timeDisplay: string;
  heroesData: HeroesData | null;
  player?: any;
}

export const UnitRepositionChange: React.FC<UnitRepositionChangeProps> = ({
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
      {change.previous_position && change.position ? (
        <UIText variant="label" className="unit-changes-widget__unit-position">
          ({change.previous_position.x}, {change.previous_position.y}) → ({change.position.x}, {change.position.y})
        </UIText>
      ) : change.position ? (
        <UIText variant="label" className="unit-changes-widget__unit-position">
          Position: ({change.position.x}, {change.position.y})
        </UIText>
      ) : null}
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

