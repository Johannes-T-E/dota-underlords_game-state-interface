import { useState } from 'react';
import { MainContentTemplate } from '@/components/layout';
import { EmptyState, PageHeader } from '@/components/shared';
import { IconScoreboard } from '@tabler/icons-react';
import { ScoreboardTable } from '@/features/scoreboard/components/ScoreboardTable/ScoreboardTable';
import { SCOREBOARD_WIDGET_IDS } from '@/features/scoreboard/constants';
import { useAppSelector } from '@/hooks/redux';
import './ScoreboardPage.css';

export const ScoreboardPage = () => {
  const { currentMatch, players } = useAppSelector((state) => state.match);
  
  // Local state for unit selection
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<number>>(new Set());
  
  // Local state for synergy selection
  const [selectedSynergyKeyword, setSelectedSynergyKeyword] = useState<number | null>(null);
  
  // Handler for unit clicks
  const handleUnitClick = (unitId: number) => {
    // Clear synergy selection when clicking a unit
    setSelectedSynergyKeyword(null);
    setSelectedUnitIds(prev => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };
  
  // Handler for synergy clicks
  const handleSynergyClick = (keyword: number | null) => {
    // Clear unit selection when clicking a synergy
    setSelectedUnitIds(new Set());
    // Toggle synergy selection: if same keyword clicked, deselect; otherwise select
    setSelectedSynergyKeyword(prev => prev === keyword ? null : keyword);
  };

  return (
      <MainContentTemplate centered={false} className="scoreboard-page">
        <div className="scoreboard-page__container">
          <PageHeader title="Scoreboard" icon={<IconScoreboard size={18} stroke={1.8} />} />
          <div className="scoreboard-page__content">
          {!currentMatch ? (
            <EmptyState
              title="No Active Match"
              message="Waiting for GSI data from Dota Underlords..."
              showSpinner
            />
          ) : (
            <ScoreboardTable 
              players={players || []} 
              widgetId={SCOREBOARD_WIDGET_IDS.isolated}
              selectedUnitIds={selectedUnitIds}
              onUnitClick={handleUnitClick}
              selectedSynergyKeyword={selectedSynergyKeyword}
              onSynergyClick={handleSynergyClick}
            />
          )}
          </div>
        </div>
      </MainContentTemplate>
  );
};


