import React from 'react';
import { Text as UIText } from '@/components/ui';
import { BaseChange } from './BaseChange';
import type { Change } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';

export interface XpPurchaseChangeProps {
  change: Change;
  playerName: string;
  timeDisplay: string;
  heroesData: HeroesData | null;
  player?: any;
}

export const XpPurchaseChange: React.FC<XpPurchaseChangeProps> = ({
  change,
  playerName,
  timeDisplay,
  heroesData
}) => {
  const icon = (
    <div className="unit-changes-widget__player-action-icon">
      <span className="unit-changes-widget__icon">⭐</span>
    </div>
  );

  const content = (
    <div className="unit-changes-widget__change-info">
      {change.gold_spent !== undefined && (
        <UIText variant="label" className="unit-changes-widget__gold-spent">
          Gold: {change.gold_spent}
        </UIText>
      )}
      {change.xp_gained !== undefined && (
        <UIText variant="label" className="unit-changes-widget__xp-gained">
          XP: +{change.xp_gained}
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

