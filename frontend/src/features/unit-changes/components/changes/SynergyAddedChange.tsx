import React from 'react';
import { Text as UIText } from '@/components/ui';
import { SynergyDisplay } from '@/components/ui/SynergyDisplay';
import { getSynergyNameByKeyword, getSynergyLevelsByKeyword } from '@/components/ui/SynergyDisplay/utils';
import { BaseChange } from './BaseChange';
import type { Change } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';

export interface SynergyAddedChangeProps {
  change: Change;
  playerName: string;
  timeDisplay: string;
  heroesData: HeroesData | null;
  player?: any;
}

export const SynergyAddedChange: React.FC<SynergyAddedChangeProps> = ({
  change,
  playerName,
  timeDisplay,
  heroesData
}) => {
  const synergyName = change.synergy_keyword ? getSynergyNameByKeyword(change.synergy_keyword) : null;
  const levels = change.synergy_keyword ? getSynergyLevelsByKeyword(change.synergy_keyword) : [];

  const icon = change.synergy_keyword ? (
    <div className="unit-changes-widget__synergy-icon">
      <SynergyDisplay
        keyword={change.synergy_keyword}
        levels={levels}
        activeUnits={change.unique_unit_count || 0}
        showPips={false}
      />
    </div>
  ) : (
    <div className="unit-changes-widget__synergy-icon">
      <span className="unit-changes-widget__icon">⚡</span>
    </div>
  );

  const content = (
    <div className="unit-changes-widget__synergy-change-info">
      {synergyName && (
        <UIText variant="label" className="unit-changes-widget__synergy-name">
          {synergyName}
        </UIText>
      )}
      {change.unique_unit_count !== undefined && levels.length > 0 && (
        <div className="unit-changes-widget__synergy-level-info">
          <UIText variant="label" className="unit-changes-widget__synergy-level">
            Level {change.unique_unit_count}
          </UIText>
          {levels.length > 0 && (
            <UIText variant="label" className="unit-changes-widget__synergy-threshold">
              ({change.unique_unit_count}/{levels[levels.length - 1]?.unitcount || '?'} units)
            </UIText>
          )}
        </div>
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

