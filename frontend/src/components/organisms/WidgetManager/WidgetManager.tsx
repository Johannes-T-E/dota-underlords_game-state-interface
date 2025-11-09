import React, { useMemo } from 'react';
import { Button, Text } from '../../atoms';
import { useAppSelector, useAppDispatch } from '../../../hooks/redux';
import { addWidgetInstance, removeWidgetInstance, toggleWidgetVisibility, type WidgetType } from '../../../store/dashboardSlice';
import './WidgetManager.css';

export interface WidgetManagerProps {
  collapsed?: boolean;
  className?: string;
}

interface WidgetTypeConfig {
  type: WidgetType;
  label: string;
  icon: string;
  allowMultiple: boolean;
}

const WIDGET_TYPES: WidgetTypeConfig[] = [
  { type: 'scoreboard', label: 'Scoreboard', icon: '📊', allowMultiple: true },
  { type: 'allPlayerBoards', label: 'All Player Boards', icon: '👥', allowMultiple: true },
  { type: 'unitChanges', label: 'Unit Changes', icon: '🔄', allowMultiple: true },
  { type: 'playerBoard', label: 'Player Board', icon: '👤', allowMultiple: false },
];

export const WidgetManager = ({ collapsed = false, className = '' }: WidgetManagerProps) => {
  const dispatch = useAppDispatch();
  const { widgetInstances } = useAppSelector((state) => state.dashboard);
  const { boardData } = useAppSelector((state) => state.board);

  // Group instances by type
  const instancesByType = useMemo(() => {
    const grouped: Record<WidgetType, typeof widgetInstances[string][]> = {
      scoreboard: [],
      allPlayerBoards: [],
      unitChanges: [],
      playerBoard: [],
    };

    Object.values(widgetInstances).forEach((instance) => {
      grouped[instance.type].push(instance);
    });

    return grouped;
  }, [widgetInstances]);

  const handleAddInstance = (type: WidgetType) => {
    dispatch(addWidgetInstance({ type }));
  };

  const handleRemoveInstance = (id: string) => {
    dispatch(removeWidgetInstance(id));
  };

  const handleToggleVisibility = (id: string) => {
    dispatch(toggleWidgetVisibility(id));
  };

  const getInstanceLabel = (instance: typeof widgetInstances[string]) => {
    if (instance.type === 'playerBoard' && instance.playerId) {
      return `Player ${instance.playerId}`;
    }
    const config = WIDGET_TYPES.find((wt) => wt.type === instance.type);
    return `${config?.label || instance.type} ${instance.instanceNumber}`;
  };

  if (collapsed) {
    return (
      <div className={`widget-manager widget-manager--collapsed ${className}`}>
        <div className="widget-manager__icon" title="Widgets">📦</div>
      </div>
    );
  }

  return (
    <div className={`widget-manager ${className}`}>
      <div className="widget-manager__header">
        <Text variant="label" weight="bold" className="widget-manager__title">
          Widgets
        </Text>
      </div>
      <div className="widget-manager__content">
        {WIDGET_TYPES.map((widgetType) => {
          const instances = instancesByType[widgetType.type];
          const hasVisibleInstances = instances.some((inst) => inst.visible);

          return (
            <div key={widgetType.type} className="widget-manager__widget-type">
              <div className="widget-manager__widget-type-header">
                <span className="widget-manager__widget-icon">{widgetType.icon}</span>
                <Text variant="label" className="widget-manager__widget-label">
                  {widgetType.label}
                </Text>
                {widgetType.allowMultiple && (
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleAddInstance(widgetType.type)}
                    className="widget-manager__add-btn"
                    title={`Add ${widgetType.label}`}
                  >
                    +
                  </Button>
                )}
              </div>
              <div className="widget-manager__instances">
                {instances.map((instance) => (
                  <div key={instance.id} className="widget-manager__instance">
                    <Button
                      variant={instance.visible ? 'primary' : 'secondary'}
                      size="small"
                      onClick={() => handleToggleVisibility(instance.id)}
                      className="widget-manager__toggle-btn"
                    >
                      {getInstanceLabel(instance)}
                    </Button>
                    {widgetType.allowMultiple && instances.length > 1 && (
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => handleRemoveInstance(instance.id)}
                        className="widget-manager__remove-btn"
                        title="Remove"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

