import React, { useState } from 'react';
import { Text as UIText } from '@/components/ui';
import type { Change } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import '../../UnitChangesWidget.css';

export interface BaseChangeProps {
  change: Change;
  playerName: string;
  timeDisplay: string;
  heroesData: HeroesData | null;
  player?: any;
  icon?: React.ReactNode;
  content?: React.ReactNode;
  className?: string;
}

const formatTime = (timestamp: string | number): string => {
  const timestampMs = typeof timestamp === 'string' 
    ? new Date(timestamp).getTime() 
    : timestamp;
  const date = new Date(timestampMs);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const BaseChange: React.FC<BaseChangeProps> = ({
  change,
  playerName,
  timeDisplay,
  icon,
  content,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const absoluteTime = formatTime(change.timestamp);

  return (
    <div 
      className={`unit-changes-widget__change-item unit-changes-widget__change-item--${change.type} ${className}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Icon/Portrait Section */}
      <div className="unit-changes-widget__change-icon">
        {icon}
      </div>
      
      {/* Details Section */}
      <div className="unit-changes-widget__change-details">
        <div className="unit-changes-widget__change-meta">
          <UIText variant="label" className="unit-changes-widget__change-player">
            {playerName}
          </UIText>
          <span className="unit-changes-widget__change-separator">•</span>
          <UIText 
            variant="label" 
            className="unit-changes-widget__change-time"
            title={absoluteTime}
          >
            {timeDisplay}
          </UIText>
        </div>
        <div className="unit-changes-widget__change-content">
          {change.type !== 'hp_change' && (
            <UIText variant="label" className="unit-changes-widget__change-type">
              {change.type.charAt(0).toUpperCase() + change.type.slice(1).replace(/_/g, ' ')}
            </UIText>
          )}
          <div className="unit-changes-widget__change-info">
            {content}
          </div>
          {isExpanded && (
            <div className="unit-changes-widget__change-expanded">
              <div className="unit-changes-widget__change-detail-row">
                <UIText variant="label" className="unit-changes-widget__change-detail-label">
                  Time:
                </UIText>
                <UIText variant="label" className="unit-changes-widget__change-detail-value">
                  {absoluteTime}
                </UIText>
              </div>
              {change.account_id && (
                <div className="unit-changes-widget__change-detail-row">
                  <UIText variant="label" className="unit-changes-widget__change-detail-label">
                    Player ID:
                  </UIText>
                  <UIText variant="label" className="unit-changes-widget__change-detail-value">
                    {change.account_id}
                  </UIText>
                </div>
              )}
              {change.entindex !== undefined && change.entindex !== null && (
                <div className="unit-changes-widget__change-detail-row">
                  <UIText variant="label" className="unit-changes-widget__change-detail-label">
                    Entity Index:
                  </UIText>
                  <UIText variant="label" className="unit-changes-widget__change-detail-value">
                    {change.entindex}
                  </UIText>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

