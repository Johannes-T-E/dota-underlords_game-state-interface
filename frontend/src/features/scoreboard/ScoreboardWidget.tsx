import React from 'react';
import { Widget } from '../../components/widgets/Widget';
import { ScoreboardContainer } from './ScoreboardContainer';
import { ScoreboardSettings } from '../../components/organisms/ScoreboardSettings/ScoreboardSettings';
import { useScoreboardSettings } from '../../hooks/useSettings';

export interface ScoreboardWidgetProps {
  columnSpan?: number;
  style?: React.CSSProperties;
  storageKey?: string;
  dragId?: string;
  onHeaderDragStart?: (e: React.DragEvent, id: string) => void;
}

export const ScoreboardWidget = ({ columnSpan, style, storageKey, dragId, onHeaderDragStart }: ScoreboardWidgetProps) => {
  const { settings, updateColumns } = useScoreboardSettings();

  return (
    <Widget
      title="Scoreboard"
      className="scoreboard-widget"
      columnSpan={columnSpan}
      style={style}
      storageKey={storageKey}
      dragId={dragId}
      onHeaderDragStart={onHeaderDragStart}
      headerRight={
        <ScoreboardSettings
          config={settings.columns}
          onChange={updateColumns}
        />
      }
    >
      <ScoreboardContainer />
    </Widget>
  );
};


