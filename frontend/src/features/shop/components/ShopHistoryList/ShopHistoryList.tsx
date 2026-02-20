import type { ShopHistoryEntry, ShopUnit } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import { getHeroIconPath } from '@/utils/heroHelpers';
import './ShopHistoryList.css';

export interface ShopHistoryListProps {
  shopHistory: ShopHistoryEntry[];
  heroesData: HeroesData | null;
  /** When set, hero icons support selection and dimming (same as shop). */
  selectedUnitIds?: Set<number>;
  onUnitClick?: (unitId: number) => void;
  /** Current shop generation + units from live GSI; used to compute purchased slots in real time for the current row. */
  currentGenerationId?: number | null;
  currentShopUnits?: ShopUnit[];
  className?: string;
}

/**
 * Scrollable list of historical shops (one row per shop_generation_id).
 * Newest generation at top. Each row shows "Generation N" and 5 compact hero icons.
 */
/** Pad shop units to 5 slots with empty placeholders. */
function padShopUnits(units: ShopUnit[]): ShopUnit[] {
  const padded = [...units];
  while (padded.length < 5) {
    padded.push({ unit_id: -1, keywords: [] });
  }
  return padded.slice(0, 5);
}

/** Compute purchased slot indices by comparing full shop (at generation start) with current shop (after buys). */
function computePurchasedIndices(fullShop: ShopUnit[], currentShop: ShopUnit[]): number[] {
  const full = padShopUnits(fullShop);
  const current = padShopUnits(currentShop);
  const indices: number[] = [];
  for (let i = 0; i < 5; i++) {
    const hadUnit = full[i].unit_id !== -1;
    const nowEmpty = current[i].unit_id === -1;
    if (hadUnit && nowEmpty) indices.push(i);
  }
  return indices;
}

export const ShopHistoryList = ({
  shopHistory,
  heroesData,
  selectedUnitIds,
  onUnitClick,
  currentGenerationId = null,
  currentShopUnits = [],
  className = ''
}: ShopHistoryListProps) => {
  if (shopHistory.length === 0) {
    return (
      <div className={`shop-history-list ${className}`}>
        <h2 className="shop-history-list__title">Shop history</h2>
        <div className="shop-history-list__empty">No shop history yet.</div>
      </div>
    );
  }

  // Display newest first (reverse chronological)
  const ordered = [...shopHistory].reverse();

  return (
    <div className={`shop-history-list ${className}`}>
      <h2 className="shop-history-list__title">Shop history</h2>
      <div className="shop-history-list__scroll">
        {ordered.map((entry) => {
          const units = entry.shopUnits ?? [];
          const slots = padShopUnits(units);
          const isCurrentGeneration = currentGenerationId != null && entry.generationId === currentGenerationId;
          const purchasedIndices = isCurrentGeneration
            ? computePurchasedIndices(units, currentShopUnits)
            : (entry.purchasedSlotIndices ?? []);
          const purchasedSet = new Set(purchasedIndices);

          return (
            <div key={entry.generationId} className="shop-history-list__row">
              <span className="shop-history-list__label">Generation {entry.generationId}</span>
              <div className="shop-history-list__slots">
                {slots.map((slot, i) => {
                  const unitId = slot.unit_id;
                  const isEmpty = unitId === -1;
                  const isPurchased = purchasedSet.has(i);
                  const isSelected = !isEmpty && selectedUnitIds?.has(unitId);
                  const isDimmed = !isEmpty && (selectedUnitIds?.size ?? 0) > 0 && !isSelected;
                  const iconPath = !isEmpty ? getHeroIconPath(unitId, heroesData) : null;
                  const slotClasses = [
                    'shop-history-list__slot',
                    isEmpty && 'shop-history-list__slot--empty',
                    isPurchased && 'shop-history-list__slot--bought',
                    isSelected && 'shop-history-list__slot--selected',
                    isDimmed && 'shop-history-list__slot--dimmed'
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div
                      key={`${entry.generationId}-${i}`}
                      className={slotClasses}
                      title={isPurchased ? 'Bought' : !isEmpty ? undefined : 'Empty slot'}
                      onClick={() => !isEmpty && onUnitClick?.(unitId)}
                      onKeyDown={(e) => {
                        if (!isEmpty && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          onUnitClick?.(unitId);
                        }
                      }}
                      role={!isEmpty ? 'button' : undefined}
                      tabIndex={!isEmpty ? 0 : undefined}
                    >
                      {iconPath ? (
                        <img
                          src={iconPath}
                          alt={isEmpty ? 'Empty' : `Unit ${unitId}`}
                          className="shop-history-list__icon"
                        />
                      ) : (
                        <div className="shop-history-list__empty-slot" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
