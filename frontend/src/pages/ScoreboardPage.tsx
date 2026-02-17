import { useState } from 'react';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { ScoreboardTable } from '@/features/scoreboard/components/ScoreboardTable/ScoreboardTable';
import { EmptyState } from '@/components/shared';
import { useAppSelector } from '@/hooks/redux';

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
    <AppLayout>
      <MainContentTemplate centered>
        <div style={{ padding: '20px' }}>
          <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 600 }}>Scoreboard</h1>
          {!currentMatch ? (
            <EmptyState
              title="No Active Match"
              message="Waiting for GSI data from Dota Underlords..."
              showSpinner
            />
          ) : (
            <ScoreboardTable 
              players={players || []} 
              widgetId="scoreboard-isolated"
              selectedUnitIds={selectedUnitIds}
              onUnitClick={handleUnitClick}
              selectedSynergyKeyword={selectedSynergyKeyword}
              onSynergyClick={handleSynergyClick}
            />
          )}
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};


