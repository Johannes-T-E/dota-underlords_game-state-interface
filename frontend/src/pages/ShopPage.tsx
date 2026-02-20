import { useState, useEffect, useMemo } from 'react';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { ShopDisplay, ShopHistoryList, ShopOddsPanel } from '@/features/shop';
import { EmptyState } from '@/components/shared';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { setShopHistory } from '@/store/matchSlice';
import { apiService } from '@/services/api';
import { calculatePoolCounts, getHeroesOwnedByPlayer } from '@/utils/poolCalculator';
import './ShopPage.css';

export const ShopPage = () => {
  const dispatch = useAppDispatch();
  const { currentMatch, players, privatePlayer, privatePlayerAccountId, shopHistory } = useAppSelector((state) => state.match);
  const { heroesData } = useHeroesDataContext();

  // Fetch full shop history from backend when we have a current match (e.g. after refresh or mid-game join)
  useEffect(() => {
    if (!currentMatch?.match_id) return;
    apiService
      .fetchShopHistory(currentMatch.match_id)
      .then((history) => {
        dispatch(setShopHistory(history));
      })
      .catch((err) => {
        console.error('Failed to fetch shop history:', err);
      });
  }, [currentMatch?.match_id, dispatch]);

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

  const privatePlayerState = useMemo(() => {
    if (privatePlayerAccountId == null) return null;
    return (players || []).find((p) => p.account_id === privatePlayerAccountId) ?? null;
  }, [players, privatePlayerAccountId]);

  const level = privatePlayerState?.level ?? 1;
  const poolCounts = useMemo(
    () => calculatePoolCounts(players || [], heroesData),
    [players, heroesData]
  );
  const ownedUnitIds = useMemo(
    () => getHeroesOwnedByPlayer(privatePlayerState?.units),
    [privatePlayerState?.units]
  );

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
              <div className="shop-page__shop-column">
                <ShopDisplay
                  privatePlayer={privatePlayer}
                  players={players || []}
                  privatePlayerAccountId={privatePlayerAccountId ?? undefined}
                  heroesData={heroesData}
                  selectedUnitIds={selectedUnitIds}
                  onUnitClick={handleUnitClick}
                />
                <ShopOddsPanel
                  ownedUnitIds={ownedUnitIds}
                  units={privatePlayerState?.units}
                  level={level}
                  poolCounts={poolCounts}
                  shopUnits={privatePlayer?.shop_units ?? []}
                  heroesData={heroesData}
                  className="shop-page__odds"
                />
              </div>
              <div className="shop-page__history-column">
                <ShopHistoryList
                  shopHistory={shopHistory}
                  heroesData={heroesData}
                  selectedUnitIds={selectedUnitIds}
                  onUnitClick={handleUnitClick}
                  currentGenerationId={privatePlayer?.shop_generation_id ?? null}
                  currentShopUnits={privatePlayer?.shop_units ?? []}
                  className="shop-page__history"
                />
              </div>
            </div>
          )}
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};

