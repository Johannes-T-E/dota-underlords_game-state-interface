import React from 'react';
import { HeroPortrait, Text as UIText } from '@/components/ui';
import { BaseChange } from './BaseChange';
import type { Change } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';

export interface UnitUpgradedChangeProps {
  change: Change;
  playerName: string;
  timeDisplay: string;
  heroesData: HeroesData | null;
  player?: any;
}

export const UnitUpgradedChange: React.FC<UnitUpgradedChangeProps> = ({
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
      {change.previous_rank !== undefined && change.rank !== undefined && (
        <UIText variant="label" className="unit-changes-widget__unit-rank-change">
          Rank {change.previous_rank} → {change.rank}
        </UIText>
      )}
      {change.previous_entindex !== undefined && change.entindex !== undefined && change.previous_entindex !== change.entindex && (
        <UIText variant="label" className="unit-changes-widget__unit-entindex">
          Entity: {change.previous_entindex} → {change.entindex}
        </UIText>
      )}
      {change.position && (
        <UIText variant="label" className="unit-changes-widget__unit-position">
          Position: ({change.position.x}, {change.position.y})
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

