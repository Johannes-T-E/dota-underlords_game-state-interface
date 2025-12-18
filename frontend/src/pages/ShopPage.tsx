import { useState } from 'react';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { ShopDisplay } from '@/features/shop';
import { EmptyState } from '@/components/shared';
import { useAppSelector } from '@/hooks/redux';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import './ShopPage.css';

export const ShopPage = () => {
  const { currentMatch, players, privatePlayer } = useAppSelector((state) => state.match);
  const { heroesData } = useHeroesDataContext();
  
  // Local state for unit selection
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<number>>(new Set());
  
  // Handler for unit clicks
  const handleUnitClick = (unitId: number) => {
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

  return (
    <AppLayout>
      <MainContentTemplate className="shop-page" centered={false}>
        <div className="shop-page__container">
          <div className="shop-page__header">
            <h1 className="shop-page__title">Shop</h1>
          </div>
          {!currentMatch ? (
            <div className="shop-page__empty">
              <EmptyState
                title="No Active Match"
                message="Waiting for GSI data from Dota Underlords..."
                showSpinner
              />
            </div>
          ) : (
            <div className="shop-page__content">
              <ShopDisplay
                privatePlayer={privatePlayer}
                players={players || []}
                heroesData={heroesData}
                selectedUnitIds={selectedUnitIds}
                onUnitClick={handleUnitClick}
              />
            </div>
          )}
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};

