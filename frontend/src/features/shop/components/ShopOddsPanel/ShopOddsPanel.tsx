import type { Unit } from '@/types';
import type { PoolCount } from '@/utils/poolCalculator';
import {
  getPoolCountsExcludingShop,
  getHeroShopProbability
} from '@/utils/poolCalculator';
import type { HeroesData } from '@/utils/heroHelpers';
import { HeroPortrait } from '@/components/ui';
import './ShopOddsPanel.css';

function formatPercent(p: number): string {
  if (Number.isNaN(p) || p <= 0) return '0%';
  if (p >= 1) return '100%';
  return `${(p * 100).toFixed(1)}%`;
}

const CONTRAPTION_IDS = [117, 143, 127];

/** Exclude underlords (unit_id > 1000) and contraptions; only heroes. */
function filterHeroesOnly(unitIds: number[]): number[] {
  return unitIds.filter(
    (id) => id <= 1000 && !CONTRAPTION_IDS.includes(id)
  );
}

/** Exclude heroes the player has at 3-star (removed from pool). */
function filterOutRank3(ownedUnitIds: number[], units: Unit[] | undefined): number[] {
  if (!units?.length) return ownedUnitIds;
  return ownedUnitIds.filter(
    (unitId) => !units.some((u) => u.unit_id === unitId && u.rank === 3)
  );
}

export interface ShopOddsPanelProps {
  /** Owned hero unit_ids (unique). */
  ownedUnitIds: number[];
  /** Player units; used to hide heroes that are 3-star (removed from pool). */
  units?: Unit[];
  level: number;
  poolCounts: Map<number, PoolCount>;
  /** Current shop units (excluded from pool for "next reroll"). */
  shopUnits: { unit_id: number }[];
  heroesData: HeroesData | null;
  className?: string;
}

/**
 * Horizontal list of owned heroes (excluding 3-star) with chance to appear on next reroll.
 */
export const ShopOddsPanel = ({
  ownedUnitIds,
  units,
  level,
  poolCounts,
  shopUnits,
  heroesData,
  className = ''
}: ShopOddsPanelProps) => {
  const poolReroll = getPoolCountsExcludingShop(poolCounts, shopUnits);
  const heroIds = filterHeroesOnly(ownedUnitIds);
  const visibleIds = filterOutRank3(heroIds, units);

  if (visibleIds.length === 0) {
    return (
      <div className={`shop-odds-panel ${className}`}>
        <h2 className="shop-odds-panel__title">Shop odds</h2>
        <div className="shop-odds-panel__empty">No heroes to show odds for.</div>
      </div>
    );
  }

  const unitIdsInShop = new Set(shopUnits.map((s) => s.unit_id).filter((id) => id !== -1));
  const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

  const items = visibleIds.map((unitId) => {
    const inShop = unitIdsInShop.has(unitId);
    const percentAtLevel = (l: number) =>
      inShop ? 0 : getHeroShopProbability(unitId, l, poolReroll, heroesData);
    const percent = percentAtLevel(level);
    const byLevel = LEVELS.map((l) => ({ level: l, percent: percentAtLevel(l) }));
    return { unitId, percent, byLevel };
  });

  const totalPercent = items.reduce((sum, { percent }) => sum + percent, 0);
  const totalByLevel = LEVELS.map((_, i) =>
    items.reduce((sum, { byLevel }) => sum + byLevel[i].percent, 0)
  );

  return (
    <div className={`shop-odds-panel ${className}`}>
      <div className="shop-odds-panel__header">
        <h2 className="shop-odds-panel__title">Shop odds</h2>
        <span className="shop-odds-panel__total" title="Sum of chances for your heroes (current level)">
          {totalPercent <= 0 ? '0%' : `${(totalPercent * 100).toFixed(1)}%`}
        </span>
      </div>
      <div className="shop-odds-panel__row">
        {items.map(({ unitId, percent }) => (
          <div key={unitId} className="shop-odds-panel__item">
            <HeroPortrait
              unitId={unitId}
              rank={0}
              heroesData={heroesData}
              className="shop-odds-panel__portrait"
            />
            <span className="shop-odds-panel__percent">{formatPercent(percent)}</span>
          </div>
        ))}
      </div>

      <h3 className="shop-odds-panel__table-title">Odds by level (next reroll)</h3>
      <div className="shop-odds-panel__table-wrap">
        <table className="shop-odds-panel__table">
          <thead>
            <tr>
              <th className="shop-odds-panel__th shop-odds-panel__th--hero">Hero</th>
              {LEVELS.map((l) => (
                <th
                  key={l}
                  className={`shop-odds-panel__th ${l === level ? 'shop-odds-panel__th--current' : ''}`}
                  title={l === level ? 'Your current level' : undefined}
                >
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(({ unitId, byLevel }) => (
              <tr key={unitId}>
                <td className="shop-odds-panel__td shop-odds-panel__td--hero">
                  <HeroPortrait
                    unitId={unitId}
                    rank={0}
                    heroesData={heroesData}
                    className="shop-odds-panel__table-portrait"
                  />
                </td>
                {byLevel.map(({ level: l, percent }) => (
                  <td
                    key={l}
                    className={`shop-odds-panel__td ${l === level ? 'shop-odds-panel__td--current' : ''}`}
                  >
                    {formatPercent(percent)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="shop-odds-panel__total-row">
              <td className="shop-odds-panel__td shop-odds-panel__td--hero">Total</td>
              {LEVELS.map((l, i) => (
                <td
                  key={l}
                  className={`shop-odds-panel__td shop-odds-panel__td--total ${l === level ? 'shop-odds-panel__td--current' : ''}`}
                >
                  {totalByLevel[i] <= 0 ? '0%' : `${(totalByLevel[i] * 100).toFixed(1)}%`}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
