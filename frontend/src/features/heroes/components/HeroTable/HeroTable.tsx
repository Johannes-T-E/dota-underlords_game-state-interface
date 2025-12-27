import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cardsPerTier } from '@/utils/poolCalculator';
import { getSynergyNameByKeyword, getSynergyVisualData } from '@/components/ui/SynergyDisplay/utils';
import { SynergyIcon } from '@/components/ui/SynergyDisplay/components';
import { HeroPortrait, AbilityDisplay } from '@/components/ui';
import { useAbilitiesData } from '../../hooks/useAbilitiesData';
import { EmptyState } from '@/components/shared';
import type { HeroData } from '@/utils/heroHelpers';
import type { HeroesData } from '@/utils/heroHelpers';
import './HeroTable.css';
import '@/components/ui/SynergyDisplay/synergy-colors.css';

export interface HeroTableProps {
  heroes: HeroData[];
  heroesData: HeroesData | null;
  selectedRank?: number; // 0 = ★, 1 = ★★, 2 = ★★★
  className?: string;
}

type SortColumn = 'name' | 'health' | 'mana' | 'damage' | 'dps' | 'attackRate' | 'moveSpeed' | 'attackRange' | 'magicResist' | 'armor' | 'pool';
type SortDirection = 'asc' | 'desc';

// Get tier colors for HeroPortrait tier border
const getTierColors = (tier: number) => {
  const tierColors = {
    1: { primary: '#595959', secondary: '#c8c8c8' },
    2: { primary: '#3b9208', secondary: '#65f013' },
    3: { primary: '#0c6583', secondary: '#14b4eb' },
    4: { primary: '#6a1e88', secondary: '#c151ec' },
    5: { primary: '#9b6714', secondary: '#f8ad33' }
  };
  return tierColors[tier as keyof typeof tierColors] || tierColors[1];
};

export const HeroTable = ({ heroes, heroesData, selectedRank = 0, className = '' }: HeroTableProps) => {
  const navigate = useNavigate();
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { abilitiesData, abilityDescriptions } = useAbilitiesData();

  const sortedHeroes = useMemo(() => {
    const sorted = [...heroes];
    const rankIndex = Math.min(Math.max(selectedRank, 0), 2); // Ensure rank is 0, 1, or 2
    
    sorted.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortColumn) {
        case 'name':
          aValue = a.displayName || a.dota_unit_name || '';
          bValue = b.displayName || b.dota_unit_name || '';
          break;
        case 'health':
          aValue = a.health?.[rankIndex] || 0;
          bValue = b.health?.[rankIndex] || 0;
          break;
        case 'mana':
          aValue = a.maxmana || 0;
          bValue = b.maxmana || 0;
          break;
        case 'damage':
          aValue = ((a.damageMin?.[rankIndex] || 0) + (a.damageMax?.[rankIndex] || 0)) / 2;
          bValue = ((b.damageMin?.[rankIndex] || 0) + (b.damageMax?.[rankIndex] || 0)) / 2;
          break;
        case 'dps': {
          const aAttackRate = Array.isArray(a.attackRate) ? a.attackRate[rankIndex] : (a.attackRate || 1);
          const bAttackRate = Array.isArray(b.attackRate) ? b.attackRate[rankIndex] : (b.attackRate || 1);
          const aAvgDamage = ((a.damageMin?.[rankIndex] || 0) + (a.damageMax?.[rankIndex] || 0)) / 2;
          const bAvgDamage = ((b.damageMin?.[rankIndex] || 0) + (b.damageMax?.[rankIndex] || 0)) / 2;
          aValue = (1 / aAttackRate) * aAvgDamage;
          bValue = (1 / bAttackRate) * bAvgDamage;
          break;
        }
        case 'attackRate': {
          const aAttackRate = Array.isArray(a.attackRate) ? a.attackRate[rankIndex] : (a.attackRate || 1);
          const bAttackRate = Array.isArray(b.attackRate) ? b.attackRate[rankIndex] : (b.attackRate || 1);
          aValue = aAttackRate ? (1 / aAttackRate) : 0;
          bValue = bAttackRate ? (1 / bAttackRate) : 0;
          break;
        }
        case 'moveSpeed':
          aValue = Array.isArray(a.movespeed) ? a.movespeed[rankIndex] : (a.movespeed || 0);
          bValue = Array.isArray(b.movespeed) ? b.movespeed[rankIndex] : (b.movespeed || 0);
          break;
        case 'attackRange':
          aValue = Array.isArray(a.attackRange) ? a.attackRange[rankIndex] : (a.attackRange || 0);
          bValue = Array.isArray(b.attackRange) ? b.attackRange[rankIndex] : (b.attackRange || 0);
          break;
        case 'magicResist':
          aValue = Array.isArray(a.magicResist) ? (a.magicResist[rankIndex] ?? 0) : (a.magicResist || 0);
          bValue = Array.isArray(b.magicResist) ? (b.magicResist[rankIndex] ?? 0) : (b.magicResist || 0);
          break;
        case 'armor':
          aValue = Array.isArray(a.armor) ? (a.armor[rankIndex] ?? 0) : (a.armor || 0);
          bValue = Array.isArray(b.armor) ? (b.armor[rankIndex] ?? 0) : (b.armor || 0);
          break;
        case 'pool':
          aValue = cardsPerTier[String(a.draftTier) as keyof typeof cardsPerTier] || 0;
          bValue = cardsPerTier[String(b.draftTier) as keyof typeof cardsPerTier] || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return sorted;
  }, [heroes, sortColumn, sortDirection, selectedRank]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (heroId: number) => {
    navigate(`/heroes/${heroId}`);
  };

  if (sortedHeroes.length === 0) {
    return (
      <div className={`hero-table hero-table--empty ${className}`}>
        <EmptyState
          title="No Heroes Found"
          message="No heroes match the current filters. Try adjusting your search or filters."
          showSpinner={false}
        />
      </div>
    );
  }

  return (
    <div className={`hero-table ${className}`}>
      <table className="hero-table__table">
        <thead>
          <tr>
            <th 
              className="hero-table__header hero-table__header--sortable hero-table__header--portrait-name"
              onClick={() => handleSort('name')}
            >
              Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="hero-table__header hero-table__header--sortable"
              onClick={() => handleSort('health')}
            >
              Health {sortColumn === 'health' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="hero-table__header hero-table__header--sortable"
              onClick={() => handleSort('mana')}
            >
              Mana {sortColumn === 'mana' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="hero-table__header hero-table__header--sortable"
              onClick={() => handleSort('damage')}
            >
              Damage {sortColumn === 'damage' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="hero-table__header hero-table__header--sortable"
              onClick={() => handleSort('dps')}
            >
              DPS {sortColumn === 'dps' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="hero-table__header hero-table__header--sortable"
              onClick={() => handleSort('attackRate')}
            >
              Attack Rate {sortColumn === 'attackRate' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="hero-table__header hero-table__header--sortable"
              onClick={() => handleSort('moveSpeed')}
            >
              Move Speed {sortColumn === 'moveSpeed' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="hero-table__header hero-table__header--sortable"
              onClick={() => handleSort('attackRange')}
            >
              Attack Range {sortColumn === 'attackRange' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="hero-table__header hero-table__header--sortable"
              onClick={() => handleSort('magicResist')}
            >
              Magic Resist {sortColumn === 'magicResist' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="hero-table__header hero-table__header--sortable"
              onClick={() => handleSort('armor')}
            >
              Armor {sortColumn === 'armor' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="hero-table__header hero-table__header--sortable"
              onClick={() => handleSort('pool')}
            >
              Pool {sortColumn === 'pool' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="hero-table__header">Alliances</th>
            <th className="hero-table__header">Abilities</th>
          </tr>
        </thead>
        <tbody>
          {sortedHeroes.map(hero => {
            const heroName = hero.displayName?.replace('#dac_hero_name_', '').replace(/_/g, ' ') ||
              hero.dota_unit_name?.replace('npc_dota_hero_', '').replace(/_/g, ' ') ||
              'Unknown';
            const synergies = (hero.keywords || [])
              .map(keyword => {
                const synergyName = getSynergyNameByKeyword(keyword);
                if (!synergyName) return null;
                const visual = getSynergyVisualData(synergyName);
                return { keyword, synergyName, ...visual };
              })
              .filter((s): s is NonNullable<typeof s> => s !== null);
            const poolSize = cardsPerTier[String(hero.draftTier) as keyof typeof cardsPerTier] || 0;
            const rankIndex = Math.min(Math.max(selectedRank, 0), 2); // Ensure rank is 0, 1, or 2
            const health = hero.health?.[rankIndex] || 0;
            const mana = hero.maxmana || 0;
            const avgDamage = ((hero.damageMin?.[rankIndex] || 0) + (hero.damageMax?.[rankIndex] || 0)) / 2;
            // Handle attackRate as array or single value
            const attackRate = Array.isArray(hero.attackRate) ? hero.attackRate[rankIndex] : (hero.attackRate || 1);
            const attacksPerSecond = 1 / attackRate;
            const dps = attacksPerSecond * avgDamage;
            // Handle movespeed, attackRange, magicResist, and armor as arrays or single values
            const moveSpeed = Array.isArray(hero.movespeed) ? hero.movespeed[rankIndex] : (hero.movespeed || 0);
            const attackRange = Array.isArray(hero.attackRange) ? hero.attackRange[rankIndex] : (hero.attackRange || 0);
            const magicResist = Array.isArray(hero.magicResist) ? hero.magicResist[rankIndex] : (hero.magicResist || 0);
            const armor = Array.isArray(hero.armor) ? hero.armor[rankIndex] : (hero.armor || 0);
            // Combine regular abilities and extra_abilities
            const allAbilities = [
              ...(hero.abilities || []),
              ...(hero.extra_abilities || []),
            ];
            const tierColors = getTierColors(hero.draftTier || 1);

            return (
              <tr
                key={hero.id}
                className="hero-table__row"
                onClick={() => handleRowClick(hero.id)}
              >
                <td className="hero-table__cell hero-table__cell--portrait-name">
                  <div className="hero-table__portrait-name-wrapper">
                    <HeroPortrait
                      unitId={hero.id}
                      rank={0}
                      heroesData={heroesData}
                      tierColors={tierColors}
                      className="hero-table__portrait"
                    />
                    <span className="hero-table__name">{heroName}</span>
                  </div>
                </td>
                <td className="hero-table__cell">{health}</td>
                <td className="hero-table__cell">{mana}</td>
                <td className="hero-table__cell">{avgDamage.toFixed(0)}</td>
                <td className="hero-table__cell">{dps.toFixed(1)}</td>
                <td className="hero-table__cell">{attacksPerSecond.toFixed(2)}</td>
                <td className="hero-table__cell">{moveSpeed}</td>
                <td className="hero-table__cell">{attackRange}</td>
                <td className="hero-table__cell">{magicResist}</td>
                <td className="hero-table__cell">{armor}</td>
                <td className="hero-table__cell">{poolSize}</td>
                <td className="hero-table__cell hero-table__cell--synergies">
                  <div className="hero-table__synergies">
                    {synergies.map(({ keyword, synergyName, styleNumber, iconFile, synergyColor, brightColor }) => (
                      <div
                        key={keyword}
                        className="hero-table__synergy-icon"
                        title={synergyName}
                      >
                        <SynergyIcon
                          styleNumber={styleNumber}
                          iconFile={iconFile}
                          synergyName={synergyName}
                          synergyColor={synergyColor}
                          brightColor={brightColor}
                        />
                      </div>
                    ))}
                  </div>
                </td>
                <td className="hero-table__cell hero-table__cell--abilities">
                  <AbilityDisplay
                    abilityNames={allAbilities}
                    abilitiesData={abilitiesData}
                    abilityDescriptions={abilityDescriptions}
                    size="large"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

