import { useMemo, useState } from 'react';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { EmptyState } from '@/components/shared';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { HeroFilters } from './components/HeroFilters/HeroFilters';
import { HeroGrid } from './components/HeroGrid/HeroGrid';
import { HeroTable } from './components/HeroTable/HeroTable';
import { getFilteredAndSortedHeroes, type SortOption, type ViewMode } from './utils/heroFilters';
import type { HeroData } from '@/utils/heroHelpers';
import './HeroesPage.css';

// Contraption unit IDs to exclude
const CONTRAPTION_IDS = [117, 143, 127];

export const HeroesPage = () => {
  const { heroesData, loading } = useHeroesDataContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [selectedSynergies, setSelectedSynergies] = useState<Set<number>>(new Set());
  const [selectedRank, setSelectedRank] = useState<number>(0); // 0 = ★, 1 = ★★, 2 = ★★★
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [tierFilterMode, setTierFilterMode] = useState<'AND' | 'OR'>('OR');
  const [synergyFilterMode, setSynergyFilterMode] = useState<'AND' | 'OR'>('OR');

  // Get all heroes, excluding underlords and contraptions
  const allHeroes = useMemo(() => {
    if (!heroesData || !heroesData.heroes) {
      return [];
    }
    return Object.values(heroesData.heroes).filter(hero => {
      // Exclude underlords (IDs > 1000)
      if (hero.id > 1000) {
        return false;
      }
      // Exclude contraptions
      if (CONTRAPTION_IDS.includes(hero.id)) {
        return false;
      }
      return true;
    });
  }, [heroesData]);

  // Apply filters and sorting
  const filteredHeroes = useMemo(() => {
    return getFilteredAndSortedHeroes(allHeroes, {
      searchQuery,
      selectedTiers,
      selectedSynergies,
      sortBy,
      viewMode,
      tierFilterMode,
      synergyFilterMode,
    });
  }, [allHeroes, searchQuery, selectedTiers, selectedSynergies, sortBy, viewMode, tierFilterMode, synergyFilterMode]);

  const handleTierToggle = (tier: number) => {
    setSelectedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) {
        next.delete(tier);
      } else {
        next.add(tier);
      }
      return next;
    });
  };

  const handleSynergyToggle = (keyword: number) => {
    setSelectedSynergies(prev => {
      const next = new Set(prev);
      if (next.has(keyword)) {
        next.delete(keyword);
      } else {
        next.add(keyword);
      }
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTiers(new Set([1, 2, 3, 4, 5]));
    setSelectedSynergies(new Set());
    setSelectedRank(0);
    setSortBy('name-asc');
    setTierFilterMode('OR');
    setSynergyFilterMode('OR');
  };

  return (
    <AppLayout>
      <MainContentTemplate centered={false} className="heroes-page">
        <div className="heroes-page__container">
          <div className="heroes-page__header">
            <h1 className="heroes-page__title">Heroes</h1>
            <p className="heroes-page__description">
              In a match of Underlords, players build their crew from a shared pool of heroes that consists of 30 copies of each tier 1 hero; 20 copies of each tier 2 hero; 18 copies of each tier 3 hero; 12 copies of each tier 4 hero; and 10 copies of each tier 5 hero. When a player is eliminated from a match, all units they have hired are returned to the shared pool.
            </p>
          </div>

          {loading ? (
            <div className="heroes-page__empty">
              <EmptyState
                title="Loading Heroes"
                message="Loading hero data..."
                showSpinner
              />
            </div>
          ) : !heroesData || allHeroes.length === 0 ? (
            <div className="heroes-page__empty">
              <EmptyState
                title="No Heroes Available"
                message="Hero data could not be loaded."
                showSpinner={false}
              />
            </div>
          ) : (
            <>
              <HeroFilters
                searchQuery={searchQuery}
                selectedTiers={selectedTiers}
                selectedSynergies={selectedSynergies}
                selectedRank={selectedRank}
                sortBy={sortBy}
                viewMode={viewMode}
                tierFilterMode={tierFilterMode}
                synergyFilterMode={synergyFilterMode}
                onSearchChange={setSearchQuery}
                onTierToggle={handleTierToggle}
                onSynergyToggle={handleSynergyToggle}
                onRankChange={setSelectedRank}
                onSortChange={setSortBy}
                onViewModeChange={setViewMode}
                onTierFilterModeChange={setTierFilterMode}
                onSynergyFilterModeChange={setSynergyFilterMode}
                onClearFilters={handleClearFilters}
              />

              {viewMode === 'grid' ? (
                <HeroGrid heroes={filteredHeroes} heroesData={heroesData} />
              ) : (
                <HeroTable heroes={filteredHeroes} heroesData={heroesData} selectedRank={selectedRank} />
              )}
            </>
          )}
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};

