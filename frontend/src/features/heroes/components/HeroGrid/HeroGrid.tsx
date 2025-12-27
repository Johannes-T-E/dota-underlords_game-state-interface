import { useMemo } from 'react';
import { HeroCard } from '../HeroCard/HeroCard';
import { EmptyState } from '@/components/shared';
import type { HeroData } from '@/utils/heroHelpers';
import type { HeroesData } from '@/utils/heroHelpers';
import './HeroGrid.css';

export interface HeroGridProps {
  heroes: HeroData[];
  heroesData: HeroesData | null;
  className?: string;
}

export const HeroGrid = ({ heroes, heroesData, className = '' }: HeroGridProps) => {
  if (heroes.length === 0) {
    return (
      <div className={`hero-grid hero-grid--empty ${className}`}>
        <EmptyState
          title="No Heroes Found"
          message="No heroes match the current filters. Try adjusting your search or filters."
          showSpinner={false}
        />
      </div>
    );
  }

  return (
    <div className={`hero-grid ${className}`}>
      {heroes.map(hero => (
        <HeroCard
          key={hero.id}
          hero={hero}
          heroesData={heroesData}
        />
      ))}
    </div>
  );
};

