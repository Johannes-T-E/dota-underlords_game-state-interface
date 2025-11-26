import { memo, useMemo } from 'react';
import { 
  PlayerNameDisplay, 
  StatDisplay, 
  StreakBadge, 
  RecordDisplay, 
  HeroPortrait,
  LevelXpIndicator,
  HealthDisplay,
  NetWorthDisplay,
  GoldDisplay,
  SynergiesCell
} from '@/components/ui';
import { getSynergyNameByKeyword } from '@/components/ui/SynergyDisplay/utils';
import { useItemsData } from '@/hooks/useItemsData';
import type { PlayerState, ScoreboardColumnConfig, Unit } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import { getHeroTier } from '@/utils/heroHelpers';
import './ScoreboardPlayerRow.css';

export interface ScoreboardPlayerRowProps {
  player: PlayerState;
  rank: number;
  heroesData: HeroesData | null;
  visibleColumns?: ScoreboardColumnConfig;
  columnOrder?: string[];
  className?: string;
  selectedUnitIds?: Set<number>;
  onUnitClick?: (unitId: number) => void;
  selectedSynergyKeyword?: number | null;
  onSynergyClick?: (keyword: number | null) => void;
  showSynergyPips?: boolean;
}

/**
 * Check if a unit has a specific synergy keyword
 */
function unitHasSynergyKeyword(unit: Unit, keyword: number): boolean {
  return unit.keywords?.includes(keyword) ?? false;
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
 * Get synergy color from keyword
 */
function getSynergyColor(keyword: number): { primary: string; secondary: string } | undefined {
  const synergyName = getSynergyNameByKeyword(keyword);
  if (!synergyName) return undefined;
  
  const cssVar = synergyName.toLowerCase();
  const colorVar = `--synergy-${cssVar}-color`;
  const brightColorVar = `--synergy-${cssVar}-color-bright`;
  
  const primary = getComputedColor(colorVar);
  const secondary = getComputedColor(brightColorVar) || primary;
  
  return { primary, secondary };
}

export const ScoreboardPlayerRow = memo(({ 
  player, 
  rank, 
  heroesData,
  visibleColumns,
  columnOrder,
  className = '',
  selectedUnitIds = new Set<number>(),
  onUnitClick,
  selectedSynergyKeyword = null,
  onSynergyClick,
  showSynergyPips = false
}: ScoreboardPlayerRowProps) => {
  const { itemsData } = useItemsData();
  const defaultVisible: ScoreboardColumnConfig = {
    place: true,
    player: false,
    playerName: true,
    level: true,
    gold: true,
    streak: true,
    health: true,
    record: true,
    networth: true,
    roster: true,
    underlord: true,
    contraptions: true,
    bench: true,
    synergies: true
  };
  
  const config = visibleColumns || defaultVisible;
  
  // Use provided columnOrder or default order
  const DEFAULT_COLUMN_ORDER = ['place', 'playerName', 'level', 'gold', 'streak', 'health', 'record', 'networth', 'synergies', 'roster', 'underlord', 'contraptions', 'bench'];
  const currentOrder = columnOrder || DEFAULT_COLUMN_ORDER;
  
  // Filter visible columns in the specified order
  const visibleOrderedColumns = currentOrder.filter(columnKey => 
    config[columnKey as keyof ScoreboardColumnConfig] === true
  );
  
  const units = player.units || [];
  
  // Helper functions for unit categorization
  const isUnderlord = (unit: Unit) => unit.unit_id > 1000;
  const isContraption = (unit: Unit) => [117, 143, 127].includes(unit.unit_id);
  
  // Categorize units
  const underlordUnits = units.filter(unit => isUnderlord(unit));
  const contraptionUnits = units.filter(unit => isContraption(unit));
  const rosterUnits = units
    .filter(unit => unit.position && unit.position.y >= 0 && !isUnderlord(unit) && !isContraption(unit))
    .sort((a, b) => {
      // Sort by rank first (descending: 3-star → 2-star → 1-star)
      const rankA = a.rank || 0;
      const rankB = b.rank || 0;
      
      if (rankA !== rankB) {
        return rankB - rankA; // Higher rank first
      }
      
      // If same rank, sort by tier descending (tier 5 → tier 4 → tier 3 → tier 2 → tier 1)
      const tierA = getHeroTier(a.unit_id, heroesData);
      const tierB = getHeroTier(b.unit_id, heroesData);
      
      if (tierB !== tierA) {
        return tierB - tierA; // Higher tier first within same rank
      }
      
      // If same tier, sort by hero ID (ascending: lower ID first)
      return a.unit_id - b.unit_id;
    });
  const benchUnits = units
    .filter(unit => unit.position && unit.position.y === -1 && !isUnderlord(unit) && !isContraption(unit))
    .sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0)); // Sort by x-position ascending (0 → 7)
  
  // Get synergy color if a synergy is selected
  const synergyColors = useMemo(() => {
    if (!selectedSynergyKeyword) return null;
    return getSynergyColor(selectedSynergyKeyword);
  }, [selectedSynergyKeyword]);

  const renderCell = (columnKey: string) => {
    switch (columnKey) {
      case 'place':
        return (
          <div key={columnKey} className="scoreboard-player-row__place">
            <div className="scoreboard-player-row__rank">{rank}</div>
          </div>
        );
      
      case 'player':
        return (
          <div key={columnKey} className="scoreboard-player-row__player">
            <div className="scoreboard-player-row__name-container">
              <PlayerNameDisplay
                personaName={player.persona_name}
                botPersonaName={player.bot_persona_name}
                className="scoreboard-player-row__name"
                matchCount={player.match_count}
              />
              <div className="scoreboard-player-row__stats">
                <StatDisplay type="level" value={player.level || 0} size="small" />
                <StatDisplay type="gold" value={player.gold || 0} size="small" />
                <StreakBadge 
                  winStreak={player.win_streak} 
                  loseStreak={player.lose_streak} 
                />
              </div>
            </div>
          </div>
        );
      
      case 'playerName':
        return (
          <div key={columnKey} className="scoreboard-player-row__player-name">
            <PlayerNameDisplay
              personaName={player.persona_name}
              botPersonaName={player.bot_persona_name}
              className="scoreboard-player-row__name"
              matchCount={player.match_count}
            />
          </div>
        );
      
      case 'level':
        return (
          <div key={columnKey} className="scoreboard-player-row__level">
            <LevelXpIndicator 
              level={player.level || 0} 
              xp={player.xp || 0} 
              nextLevelXp={player.next_level_xp || 1} 
              showXpText={false}
            />
          </div>
        );
      
      case 'gold':
        return (
          <div key={columnKey} className="scoreboard-player-row__gold">
            <GoldDisplay gold={player.gold} />
          </div>
        );
      
      case 'streak':
        return (
          <div key={columnKey} className="scoreboard-player-row__streak">
            <StreakBadge 
              winStreak={player.win_streak} 
              loseStreak={player.lose_streak} 
            />
          </div>
        );
      
      case 'health':
        return (
          <div key={columnKey} className="scoreboard-player-row__health">
            <HealthDisplay health={player.health} />
          </div>
        );
      
      case 'record':
        return (
          <div key={columnKey} className="scoreboard-player-row__record">
            <RecordDisplay wins={player.wins} losses={player.losses} />
          </div>
        );
      
      case 'networth':
        return (
          <div key={columnKey} className="scoreboard-player-row__networth">
            <NetWorthDisplay netWorth={player.net_worth} />
          </div>
        );
      
      case 'roster':
        return (
          <div key={columnKey} className="scoreboard-player-row__roster">
            {rosterUnits.map((unit, idx) => {
              const isSelected = selectedUnitIds.has(unit.unit_id);
              const isDimmedByUnit = selectedUnitIds.size > 0 && !isSelected;
              
              // Check synergy selection
              const hasSelectedSynergy = selectedSynergyKeyword !== null 
                ? unitHasSynergyKeyword(unit, selectedSynergyKeyword)
                : false;
              const isDimmedBySynergy = selectedSynergyKeyword !== null && !hasSelectedSynergy;
              
              const isDimmed = isDimmedByUnit || isDimmedBySynergy;
              
              // Use synergy colors if unit has selected synergy, otherwise use tier colors (default)
              const tierColors = hasSelectedSynergy && synergyColors ? synergyColors : undefined;
              
              return (
                <div 
                  key={idx} 
                  className={`scoreboard-player-row__unit ${isDimmed ? 'scoreboard-player-row__unit--dimmed' : ''} ${isSelected ? 'scoreboard-player-row__unit--selected' : ''}`}
                  onClick={() => onUnitClick?.(unit.unit_id)}
                  style={{ cursor: 'pointer' }}
                >
                  <HeroPortrait 
                    unitId={unit.unit_id}
                    rank={unit.rank || 0}
                    heroesData={heroesData}
                    tierColors={tierColors}
                    entindex={unit.entindex}
                    itemSlots={player.item_slots}
                    itemsData={itemsData}
                  />
                </div>
              );
            })}
          </div>
        );
      
      case 'underlord':
        return (
          <div key={columnKey} className="scoreboard-player-row__underlord">
            {underlordUnits.map((unit, idx) => (
              <div key={idx} className="scoreboard-player-row__unit">
                <HeroPortrait 
                  unitId={unit.unit_id}
                  rank={unit.rank || 0}
                  heroesData={heroesData}
                  entindex={unit.entindex}
                  itemSlots={player.item_slots}
                  itemsData={itemsData}
                />
              </div>
            ))}
          </div>
        );
      
      case 'contraptions':
        return (
          <div key={columnKey} className="scoreboard-player-row__contraptions">
            {contraptionUnits.map((unit, idx) => (
              <div key={idx} className="scoreboard-player-row__unit">
                <HeroPortrait 
                  unitId={unit.unit_id}
                  rank={unit.rank || 0}
                  heroesData={heroesData}
                  entindex={unit.entindex}
                  itemSlots={player.item_slots}
                  itemsData={itemsData}
                />
              </div>
            ))}
          </div>
        );
      
      case 'bench':
        return (
          <div key={columnKey} className="scoreboard-player-row__bench">
            {benchUnits.map((unit, idx) => {
              const isSelected = selectedUnitIds.has(unit.unit_id);
              const isDimmedByUnit = selectedUnitIds.size > 0 && !isSelected;
              
              // Check synergy selection
              const hasSelectedSynergy = selectedSynergyKeyword !== null 
                ? unitHasSynergyKeyword(unit, selectedSynergyKeyword)
                : false;
              const isDimmedBySynergy = selectedSynergyKeyword !== null && !hasSelectedSynergy;
              
              const isDimmed = isDimmedByUnit || isDimmedBySynergy;
              
              // Use synergy colors if unit has selected synergy, otherwise use tier colors (default)
              const tierColors = hasSelectedSynergy && synergyColors ? synergyColors : undefined;
              
              return (
                <div 
                  key={idx} 
                  className={`scoreboard-player-row__unit scoreboard-player-row__unit--bench ${isDimmed ? 'scoreboard-player-row__unit--dimmed' : ''} ${isSelected ? 'scoreboard-player-row__unit--selected' : ''}`}
                  onClick={() => onUnitClick?.(unit.unit_id)}
                  style={{ cursor: 'pointer' }}
                >
                  <HeroPortrait 
                    unitId={unit.unit_id}
                    rank={unit.rank || 0}
                    heroesData={heroesData}
                    tierColors={tierColors}
                    entindex={unit.entindex}
                    itemSlots={player.item_slots}
                    itemsData={itemsData}
                  />
                </div>
              );
            })}
          </div>
        );
      
      case 'synergies':
        return (
          <div key={columnKey} className="scoreboard-player-row__synergies">
            <SynergiesCell
              synergies={player.synergies || []}
              showPips={showSynergyPips}
              onlyActive={true}
              selectedSynergyKeyword={selectedSynergyKeyword}
              onSynergyClick={onSynergyClick}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      className={`scoreboard-player-row ${className}`}
      id={`player-${player.account_id}`}
    >
      {visibleOrderedColumns.map(renderCell)}
    </div>
  );
});

ScoreboardPlayerRow.displayName = 'ScoreboardPlayerRow';

