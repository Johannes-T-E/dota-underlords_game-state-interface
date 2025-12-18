import { useMemo } from 'react';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { SynergyPoolBarChart } from '@/components/charts/SynergyPoolBarChart';
import { EmptyState } from '@/components/shared';
import { useAppSelector } from '@/hooks/redux';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { calculatePoolCounts } from '@/utils/poolCalculator';
import { calculateSynergyPoolStats } from '@/utils/synergyPoolCalculator';
import './HeroPoolStatsPage.css';

export const HeroPoolStatsPage = () => {
  const { currentMatch, players } = useAppSelector((state) => state.match);
  const { heroesData } = useHeroesDataContext();

  // Calculate pool counts for all heroes
  const poolCounts = useMemo(() => {
    if (!players || !heroesData) {
      return new Map();
    }
    return calculatePoolCounts(players, heroesData);
  }, [players, heroesData]);

  // Calculate synergy pool stats
  const synergyPoolStats = useMemo(() => {
    if (!players || !heroesData || poolCounts.size === 0) {
      return [];
    }
    return calculateSynergyPoolStats(players, heroesData, poolCounts);
  }, [players, heroesData, poolCounts]);

  return (
    <AppLayout>
      <MainContentTemplate centered={false} className="hero-pool-stats-page">
        <div className="hero-pool-stats-page__container">
          <div className="hero-pool-stats-page__header">
            <h1 className="hero-pool-stats-page__title">Hero Pool Stats</h1>
          </div>
          {!currentMatch ? (
            <div className="hero-pool-stats-page__empty">
              <EmptyState
                title="No Active Match"
                message="Waiting for GSI data from Dota Underlords..."
                showSpinner
              />
            </div>
          ) : synergyPoolStats.length === 0 ? (
            <div className="hero-pool-stats-page__empty">
              <EmptyState
                title="No Pool Data Available"
                message="No hero pool statistics available for current match."
                showSpinner={false}
              />
            </div>
          ) : (
            <div className="hero-pool-stats-page__content">
              <SynergyPoolBarChart synergyPoolStats={synergyPoolStats} />
            </div>
          )}
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};

