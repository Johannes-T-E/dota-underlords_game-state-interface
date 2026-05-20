import { useState } from 'react';
import { MainContentTemplate } from '@/components/layout';
import { EmptyState, PageHeader } from '@/components/shared';
import { IconChartBar } from '@tabler/icons-react';
import { useAppSelector } from '@/hooks/redux';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { HeroPoolStatsPanel } from './components/HeroPoolStatsPanel';
import './HeroPoolStatsPage.css';

export type PoolViewMode = 'synergy' | 'tier';

export const HeroPoolStatsPage = () => {
  const { currentMatch, players } = useAppSelector((state) => state.match);
  const { heroesData } = useHeroesDataContext();
  const [viewMode, setViewMode] = useState<PoolViewMode>('synergy');

  return (
    <MainContentTemplate centered={false} className="hero-pool-stats-page">
      <div className="hero-pool-stats-page__container">
        <PageHeader
          title="Hero Pool Stats"
          icon={<IconChartBar size={18} stroke={1.8} />}
          rightContent={
            <div className="hero-pool-stats-page__view-toggle">
              <button
                type="button"
                className={`hero-pool-stats-page__view-button ${viewMode === 'synergy' ? 'hero-pool-stats-page__view-button--active' : ''}`}
                onClick={() => setViewMode('synergy')}
              >
                Synergy
              </button>
              <button
                type="button"
                className={`hero-pool-stats-page__view-button ${viewMode === 'tier' ? 'hero-pool-stats-page__view-button--active' : ''}`}
                onClick={() => setViewMode('tier')}
              >
                Tier
              </button>
            </div>
          }
        />
        {!currentMatch ? (
          <div className="hero-pool-stats-page__empty">
            <EmptyState
              title="No Active Match"
              message="Waiting for GSI data from Dota Underlords..."
              showSpinner
            />
          </div>
        ) : (
          <div className="hero-pool-stats-page__chart-section">
            <HeroPoolStatsPanel
              players={players || []}
              heroesData={heroesData}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
        )}
      </div>
    </MainContentTemplate>
  );
};
