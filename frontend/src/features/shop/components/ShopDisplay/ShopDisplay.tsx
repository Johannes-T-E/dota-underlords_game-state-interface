import { useMemo } from 'react';
import { HeroPortrait, SynergyIcon } from '@/components/ui';
import { EmptyState } from '@/components/shared';
import { getSynergyNameByKeyword } from '@/components/ui/SynergyDisplay/utils';
import { getTierColor } from '@/utils/tierColors';
import { getHeroTier } from '@/utils/heroHelpers';
import synergyStyles from '@/components/ui/SynergyDisplay/data/synergy-styles.json';
import synergyIconMap from '@/components/ui/SynergyDisplay/data/synergy-icon-map.json';
import type { PrivatePlayerState, PlayerState, Unit } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import { calculatePoolCounts } from '@/utils/poolCalculator';
import './ShopDisplay.css';

export interface OwnedUpgradeState {
  ownedCount: number;
  wouldUpgrade: boolean;
}

export interface ShopDisplayProps {
  privatePlayer: PrivatePlayerState | null;
  players: PlayerState[];
  privatePlayerAccountId?: number | null;
  heroesData: HeroesData | null;
  selectedUnitIds?: Set<number>;
  onUnitClick?: (unitId: number) => void;
  className?: string;
}

/**
 * Get CSS variable name for synergy color
 */
function getColorVar(synergyName: string, bright: boolean = false): string {
  const cssVar = synergyName.toLowerCase();
  const suffix = bright ? '-bright' : '';
  return `--synergy-${cssVar}-color${suffix}`;
}

/**
 * Get computed color value from CSS variable
 */
function getComputedColor(varName: string, fallback: string = '#888888'): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

/**
 * Get synergy visual data (style number, icon file, colors)
 */
function getSynergyVisualData(synergyName: string) {
  const styleNumber = (synergyStyles as Record<string, number>)[synergyName] || 1;
  const iconFile = (synergyIconMap as Record<string, string>)[synergyName] || 'beast_psd.png';
  
  const colorVar = getColorVar(synergyName);
  const brightColorVar = getColorVar(synergyName, true);
  const synergyColor = getComputedColor(colorVar);
  const brightColor = getComputedColor(brightColorVar) || synergyColor;
  
  return { styleNumber, iconFile, synergyColor, brightColor };
}

/**
 * Tier colors for drop shadow effect on hero portraits
 */
const TIER_COLORS_MAP: Record<number, { primary: string; secondary: string }> = {
  1: { primary: '#595959', secondary: '#c8c8c8' },
  2: { primary: '#3b9208', secondary: '#65f013' },
  3: { primary: '#0c6583', secondary: '#14b4eb' },
  4: { primary: '#6a1e88', secondary: '#c151ec' },
  5: { primary: '#9b6714', secondary: '#f8ad33' }
};

/**
 * Extract display name from dota_unit_name
 */
function getHeroDisplayName(unitId: number, heroesData: HeroesData | null): string {
  if (!heroesData || !heroesData.heroes) return 'Unknown';
  
  for (const [, heroData] of Object.entries(heroesData.heroes)) {
    if (heroData.id === unitId) {
      if (heroData.dota_unit_name) {
        return heroData.dota_unit_name
          .replace('npc_dota_hero_', '')
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      if (heroData.displayName && heroData.displayName.startsWith('#dac_hero_name_')) {
        return heroData.displayName.replace('#dac_hero_name_', '').replace(/_/g, ' ');
      }
    }
  }
  return 'Unknown';
}

/** Exclude underlords and contraptions when counting owned units (same as scoreboard roster/bench). */
function isUnderlord(unit: Unit) {
  return unit.unit_id > 1000;
}
function isContraption(unit: Unit) {
  return [117, 143, 127].includes(unit.unit_id);
}

/**
 * Build map of unit_id -> list of owned Unit (hero units only), for displaying owned copies with correct rank.
 */
function buildOwnedUnitsByUnitId(units: Unit[] | undefined): Map<number, Unit[]> {
  const map = new Map<number, Unit[]>();
  if (!units || units.length === 0) return map;

  const heroUnits = units.filter((u) => !isUnderlord(u) && !isContraption(u));
  for (const u of heroUnits) {
    const list = map.get(u.unit_id) ?? [];
    list.push(u);
    map.set(u.unit_id, list);
  }
  return map;
}

/**
 * Build map of unit_id -> { ownedCount, wouldUpgrade } from private player's units.
 * wouldUpgrade: one more 1-star copy would complete a 2-star (i.e. we have 2 loose 1-stars).
 */
function buildOwnedUpgradeMap(units: Unit[] | undefined): Map<number, OwnedUpgradeState> {
  const map = new Map<number, OwnedUpgradeState>();
  if (!units || units.length === 0) return map;

  const heroUnits = units.filter((u) => !isUnderlord(u) && !isContraption(u));
  const byUnitId = new Map<number, Unit[]>();
  for (const u of heroUnits) {
    const list = byUnitId.get(u.unit_id) ?? [];
    list.push(u);
    byUnitId.set(u.unit_id, list);
  }

  for (const [unitId, list] of byUnitId) {
    const ownedCount = list.length;
    const count1Star = list.filter((u) => (u.rank || 0) === 1).length;
    const wouldUpgrade = (count1Star % 3) === 2;
    map.set(unitId, { ownedCount, wouldUpgrade });
  }
  return map;
}

export const ShopDisplay = ({
  privatePlayer,
  players,
  privatePlayerAccountId = null,
  heroesData,
  selectedUnitIds = new Set<number>(),
  onUnitClick,
  className = ''
}: ShopDisplayProps) => {
  // Resolve private player by account_id (backend sends private_player_account_id)
  const privatePlayerState = useMemo(() => {
    if (privatePlayerAccountId == null) return null;
    return players.find((p) => p.account_id === privatePlayerAccountId) ?? null;
  }, [players, privatePlayerAccountId]);

  const ownedUpgradeMap = useMemo(
    () => buildOwnedUpgradeMap(privatePlayerState?.units),
    [privatePlayerState?.units]
  );

  const ownedUnitsByUnitId = useMemo(
    () => buildOwnedUnitsByUnitId(privatePlayerState?.units),
    [privatePlayerState?.units]
  );

  // Calculate pool counts for all heroes
  const poolCounts = useMemo(() => {
    return calculatePoolCounts(players, heroesData);
  }, [players, heroesData]);

  // Get shop units, ensuring we always have 5 slots
  const shopUnits = useMemo(() => {
    if (!privatePlayer || !privatePlayer.shop_units) {
      return Array(5).fill(null).map(() => ({ unit_id: -1, keywords: [] }));
    }
    
    const units = [...privatePlayer.shop_units];
    // Ensure we have exactly 5 slots
    while (units.length < 5) {
      units.push({ unit_id: -1, keywords: [] });
    }
    return units.slice(0, 5);
  }, [privatePlayer]);

  // Show empty state if no private player data
  if (!privatePlayer) {
    return (
      <div className={`shop-display ${className}`}>
        <EmptyState
          title="No Shop Data"
          message="Waiting for private player state..."
          showSpinner={false}
        />
      </div>
    );
  }

  return (
    <div className={`shop-display ${className}`}>
      <div className="shop-display__grid">
        {shopUnits.map((shopUnit, index) => {
          const unitId = shopUnit.unit_id;
          const isEmpty = unitId === -1;
          const isSelected = !isEmpty && selectedUnitIds.has(unitId);
          const isDimmed = selectedUnitIds.size > 0 && !isSelected && !isEmpty;
          
          const poolCount = !isEmpty ? poolCounts.get(unitId) : null;
          const poolText = poolCount 
            ? `${poolCount.remaining}/${poolCount.total}`
            : '';

          const heroTier = !isEmpty ? getHeroTier(unitId, heroesData) : 1;
          const tierColor = getTierColor(heroTier);
          const tierColors = TIER_COLORS_MAP[heroTier] || TIER_COLORS_MAP[1];
          const heroName = !isEmpty ? getHeroDisplayName(unitId, heroesData) : '';

          const ownedUpgrade = !isEmpty ? ownedUpgradeMap.get(unitId) : null;
          const ownedCount = ownedUpgrade?.ownedCount ?? 0;
          const wouldUpgrade = ownedUpgrade?.wouldUpgrade ?? false;
          const ownedUnits = !isEmpty ? (ownedUnitsByUnitId.get(unitId) ?? []) : [];
          const slotTitle = !isEmpty
            ? [
                ownedCount > 0 ? `You have ${ownedCount} copy${ownedCount !== 1 ? 'ies' : ''}` : null,
                wouldUpgrade ? 'Buying this will upgrade to 2-star' : null
              ]
                .filter(Boolean)
                .join('. ') || undefined
            : undefined;

          return (
            <div key={index} className="shop-display__slot-wrapper">
              <div className="shop-display__owned-row">
                {!isEmpty && ownedUnits.length > 0 && (
                  <div className="shop-display__owned" title={slotTitle}>
                    {ownedUnits.map((unit, i) => (
                      <HeroPortrait
                        key={unit.entindex ?? i}
                        unitId={unit.unit_id}
                        rank={unit.rank || 0}
                        heroesData={heroesData}
                        className="shop-display__owned-portrait"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div
                className={`shop-display__slot ${
                  isDimmed ? 'shop-display__slot--dimmed' : ''
                } ${isSelected ? 'shop-display__slot--selected' : ''} ${
                  isEmpty ? 'shop-display__slot--empty' : ''
                } ${ownedCount > 0 ? 'shop-display__slot--owned' : ''} ${wouldUpgrade ? 'shop-display__slot--upgrade' : ''}`}
                onClick={() => !isEmpty && onUnitClick?.(unitId)}
                style={{ borderColor: isEmpty ? undefined : tierColor }}
                title={slotTitle}
                aria-label={slotTitle}
              >
                {isEmpty ? (
                  <div className="shop-display__empty-slot">
                    <div className="shop-display__empty-indicator" />
                  </div>
                ) : (
                  <>
                    <div className="shop-display__name">
                      {heroName}
                    </div>
                    <HeroPortrait
                      unitId={unitId}
                      rank={0}
                      heroesData={heroesData}
                      className="shop-display__hero"
                      tierColors={tierColors}
                    />
                    {(() => {
                      const keywords = shopUnit.keywords || [];
                      if (keywords.length === 0) return null;
                      
                      return (
                        <div className="shop-display__synergies">
                          {keywords.map((keyword: number) => {
                            const synergyName = getSynergyNameByKeyword(keyword);
                            if (!synergyName) return null;
                            
                            const visual = getSynergyVisualData(synergyName);
                            
                            return (
                              <div key={keyword} className="shop-display__synergy-icon">
                                <SynergyIcon
                                  styleNumber={visual.styleNumber}
                                  iconFile={visual.iconFile}
                                  synergyName={synergyName}
                                  synergyColor={visual.synergyColor}
                                  brightColor={visual.brightColor}
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
              {poolText && (
                <div
                  className="shop-display__pool-count"
                  title={`${poolCount?.remaining} remaining out of ${poolCount?.total} total`}
                >
                  {poolText}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
