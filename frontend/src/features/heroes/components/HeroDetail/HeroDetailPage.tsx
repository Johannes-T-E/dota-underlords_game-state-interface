import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { EmptyState } from '@/components/shared';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { getHeroIconPath, getHeroTier } from '@/utils/heroHelpers';
import { cardsPerTier } from '@/utils/poolCalculator';
import { getSynergyNameByKeyword } from '@/components/ui/SynergyDisplay/utils';
import { SynergyIcon } from '@/components/ui/SynergyDisplay/components';
import { useAbilitiesData } from '../../hooks/useAbilitiesData';
import synergyStyles from '@/components/ui/SynergyDisplay/data/synergy-styles.json';
import synergyIconMap from '@/components/ui/SynergyDisplay/data/synergy-icon-map.json';
import './HeroDetailPage.css';
import '@/components/ui/SynergyDisplay/synergy-colors.css';

// Contraption unit IDs to exclude
const CONTRAPTION_IDS = [117, 143, 127];

function getSynergyVisualData(synergyName: string) {
  const styleNumber = (synergyStyles as Record<string, number>)[synergyName] || 1;
  const iconFile = (synergyIconMap as Record<string, string>)[synergyName] || 'beast_psd.png';
  
  const getComputedColor = (varName: string, fallback: string = '#888888'): string => {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return value || fallback;
  };
  
  const getColorVar = (synergyName: string, bright: boolean = false): string => {
    const baseName = synergyName.toLowerCase().replace(/\s+/g, '-');
    return `--synergy-${baseName}${bright ? '-bright' : ''}-color`;
  };
  
  const colorVar = getColorVar(synergyName);
  const brightColorVar = getColorVar(synergyName, true);
  
  const synergyColor = getComputedColor(colorVar);
  const brightColor = getComputedColor(brightColorVar) || synergyColor;
  
  return { styleNumber, iconFile, synergyColor, brightColor };
}

function formatAbilityDescription(description: string, abilityData: any): string {
  if (!description || !abilityData) return description;
  
  // Replace placeholders like {s:damage_absorb} with actual values
  let formatted = description;
  const matches = formatted.match(/\{s:(\w+)\}/g);
  
  if (matches) {
    matches.forEach(match => {
      const key = match.replace('{s:', '').replace('}', '');
      const value = abilityData[key];
      
      if (value !== undefined) {
        if (Array.isArray(value)) {
          // For arrays, show all values (e.g., [100, 300, 600] -> "100/300/600")
          formatted = formatted.replace(match, value.join('/'));
        } else {
          formatted = formatted.replace(match, String(value));
        }
      }
    });
  }
  
  // Replace <br> with line breaks
  formatted = formatted.replace(/<br>/gi, '\n');
  formatted = formatted.replace(/<br\/>/gi, '\n');
  
  return formatted;
}

export const HeroDetailPage = () => {
  const { heroId } = useParams<{ heroId: string }>();
  const navigate = useNavigate();
  const { heroesData, loading: heroesLoading } = useHeroesDataContext();
  const { abilitiesData, abilityDescriptions, loading: abilitiesLoading } = useAbilitiesData();

  // Get all heroes for navigation
  const allHeroes = useMemo(() => {
    if (!heroesData || !heroesData.heroes) {
      return [];
    }
    return Object.values(heroesData.heroes).filter(hero => {
      if (hero.id > 1000) return false;
      if (CONTRAPTION_IDS.includes(hero.id)) return false;
      return true;
    }).sort((a, b) => a.id - b.id);
  }, [heroesData]);

  // Find current hero
  const hero = useMemo(() => {
    if (!heroesData || !heroesData.heroes || !heroId) {
      return null;
    }
    
    const heroIdNum = Number(heroId);
    return Object.values(heroesData.heroes).find(h => h.id === heroIdNum) || null;
  }, [heroesData, heroId]);

  // Get hero index for navigation
  const heroIndex = useMemo(() => {
    if (!hero) return -1;
    return allHeroes.findIndex(h => h.id === hero.id);
  }, [hero, allHeroes]);

  const previousHero = heroIndex > 0 ? allHeroes[heroIndex - 1] : null;
  const nextHero = heroIndex >= 0 && heroIndex < allHeroes.length - 1 ? allHeroes[heroIndex + 1] : null;

  const heroName = useMemo(() => {
    if (!hero) return 'Unknown Hero';
    if (hero.displayName && hero.displayName.startsWith('#dac_hero_name_')) {
      return hero.displayName.replace('#dac_hero_name_', '').replace(/_/g, ' ');
    }
    if (hero.dota_unit_name) {
      return hero.dota_unit_name.replace('npc_dota_hero_', '').replace(/_/g, ' ');
    }
    return 'Unknown Hero';
  }, [hero]);

  const synergies = useMemo(() => {
    if (!hero || !hero.keywords) return [];
    return hero.keywords
      .map(keyword => {
        const synergyName = getSynergyNameByKeyword(keyword);
        if (!synergyName) return null;
        const visual = getSynergyVisualData(synergyName);
        return { keyword, synergyName, ...visual };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [hero]);

  // Get ability icon path
  const getAbilityIconPath = (abilityName: string): string => {
    // 3star abilities use a generic icon
    if (abilityName.includes('3star')) {
      return '/icons/spellicons/3star_png.png';
    }
    return `/icons/spellicons/${abilityName}_png.png`;
  };

  // Get ability data
  const abilities = useMemo(() => {
    if (!hero || !abilitiesData || !abilityDescriptions) return [];
    
    const abilityList: Array<{
      name: string;
      description: string;
      lore?: string;
      data: any;
      iconPath: string;
      abilityName: string;
    }> = [];

    // Helper function to process an ability
    const processAbility = (abilityName: string) => {
      // Try to find ability data, prioritizing set_balance over set_base
      let abilityData: any = null;
      
      // First, try set_balance (prioritized)
      if (abilitiesData.set_balance?.[abilityName]) {
        abilityData = abilitiesData.set_balance[abilityName];
      }
      // Then try set_base
      else if (abilitiesData.set_base?.[abilityName]) {
        abilityData = abilitiesData.set_base[abilityName];
      }
      // Finally, try any other sets
      else {
        const allSets = Object.keys(abilitiesData);
        for (const setKey of allSets) {
          if (setKey !== 'set_balance' && setKey !== 'set_base') {
            if (abilitiesData[setKey]?.[abilityName]) {
              abilityData = abilitiesData[setKey][abilityName];
              break;
            }
          }
        }
      }

      // Get ability descriptions
      const tokens = abilityDescriptions.lang?.Tokens || {};
      const abilityKey = `dac_ability_${abilityName}`;
      const name = tokens[abilityKey] || abilityName.replace(/_/g, ' ');
      // Try both _Description and _description (JSON has inconsistent casing)
      const description = tokens[`${abilityKey}_Description`] || tokens[`${abilityKey}_description`] || '';
      const lore = tokens[`${abilityKey}_Lore`] || '';

      // If ability data not found, still show the ability with basic info
      if (!abilityData) {
        console.warn(`Ability data not found for: ${abilityName}`);
        abilityList.push({
          name,
          description: description || '',
          lore,
          data: {},
          iconPath: getAbilityIconPath(abilityName),
          abilityName,
        });
        return;
      }

      abilityList.push({
        name,
        description: formatAbilityDescription(description, abilityData),
        lore,
        data: abilityData,
        iconPath: getAbilityIconPath(abilityName),
        abilityName,
      });
    };

    // Process regular abilities
    if (hero.abilities && hero.abilities.length > 0) {
      hero.abilities.forEach(processAbility);
    }

    // Process extra_abilities
    if (hero.extra_abilities && hero.extra_abilities.length > 0) {
      hero.extra_abilities.forEach(processAbility);
    }

    return abilityList;
  }, [hero, abilitiesData, abilityDescriptions]);

  const poolSize = useMemo(() => {
    if (!hero) return 0;
    return cardsPerTier[String(hero.draftTier) as keyof typeof cardsPerTier] || 0;
  }, [hero]);

  if (heroesLoading || abilitiesLoading) {
    return (
      <AppLayout>
        <MainContentTemplate centered={false} className="hero-detail-page">
          <div className="hero-detail-page__empty">
            <EmptyState
              title="Loading Hero"
              message="Loading hero data..."
              showSpinner
            />
          </div>
        </MainContentTemplate>
      </AppLayout>
    );
  }

  if (!hero) {
    return (
      <AppLayout>
        <MainContentTemplate centered={false} className="hero-detail-page">
          <div className="hero-detail-page__empty">
            <EmptyState
              title="Hero Not Found"
              message="The requested hero could not be found."
              showSpinner={false}
            />
          </div>
        </MainContentTemplate>
      </AppLayout>
    );
  }

  const heroIconPath = getHeroIconPath(hero.id, heroesData);

  return (
    <AppLayout>
      <MainContentTemplate centered={false} className="hero-detail-page">
        <div className="hero-detail-page__container">
          <div className="hero-detail-page__header">
            <button
              className="hero-detail-page__back-button"
              onClick={() => navigate('/heroes')}
            >
              ← Back to Heroes
            </button>
            <div className="hero-detail-page__navigation">
              {previousHero && (
                <button
                  className="hero-detail-page__nav-button"
                  onClick={() => navigate(`/heroes/${previousHero.id}`)}
                >
                  ← Previous
                </button>
              )}
              {nextHero && (
                <button
                  className="hero-detail-page__nav-button"
                  onClick={() => navigate(`/heroes/${nextHero.id}`)}
                >
                  Next →
                </button>
              )}
            </div>
          </div>

          <div className="hero-detail-page__content">
            <div className="hero-detail-page__main">
              <div className="hero-detail-page__portrait-section">
                <img
                  src={heroIconPath}
                  alt={heroName}
                  className="hero-detail-page__portrait"
                />
                <div className="hero-detail-page__tier-badge">
                  Tier {hero.draftTier}
                </div>
              </div>

              <div className="hero-detail-page__info">
                <h1 className="hero-detail-page__name">{heroName}</h1>
                
                {synergies.length > 0 && (
                  <div className="hero-detail-page__synergies">
                    {synergies.map(({ keyword, synergyName, styleNumber, iconFile, synergyColor, brightColor }) => (
                      <div
                        key={keyword}
                        className="hero-detail-page__synergy-icon"
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
                )}

                <div className="hero-detail-page__pool-info">
                  <strong>Pool Size:</strong> {poolSize} copies
                </div>
              </div>
            </div>

            <div className="hero-detail-page__stats-abilities-wrapper">
              <div className="hero-detail-page__stats-section">
                <h2 className="hero-detail-page__section-title">Stats</h2>
                <div className="hero-detail-page__stats-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Stat</th>
                        <th>★</th>
                        <th>★★</th>
                        <th>★★★</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Health</strong></td>
                        <td>{hero.health?.[0] || 0}</td>
                        <td>{hero.health?.[1] || 0}</td>
                        <td>{hero.health?.[2] || 0}</td>
                      </tr>
                      <tr>
                        <td><strong>Damage</strong></td>
                        <td>
                          {hero.damageMin?.[0] || 0} - {hero.damageMax?.[0] || 0}
                        </td>
                        <td>
                          {hero.damageMin?.[1] || 0} - {hero.damageMax?.[1] || 0}
                        </td>
                        <td>
                          {hero.damageMin?.[2] || 0} - {hero.damageMax?.[2] || 0}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>DPS</strong></td>
                        <td>
                          {(() => {
                            const attackRate = Array.isArray(hero.attackRate) ? hero.attackRate[0] : hero.attackRate;
                            return attackRate && hero.damageMin?.[0] && hero.damageMax?.[0]
                              ? ((1 / attackRate) * ((hero.damageMin[0] + hero.damageMax[0]) / 2)).toFixed(1)
                              : '0.0';
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const attackRate = Array.isArray(hero.attackRate) ? hero.attackRate[1] : hero.attackRate;
                            return attackRate && hero.damageMin?.[1] && hero.damageMax?.[1]
                              ? ((1 / attackRate) * ((hero.damageMin[1] + hero.damageMax[1]) / 2)).toFixed(1)
                              : '0.0';
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const attackRate = Array.isArray(hero.attackRate) ? hero.attackRate[2] : hero.attackRate;
                            return attackRate && hero.damageMin?.[2] && hero.damageMax?.[2]
                              ? ((1 / attackRate) * ((hero.damageMin[2] + hero.damageMax[2]) / 2)).toFixed(1)
                              : '0.0';
                          })()}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Armor</strong></td>
                        <td>
                          {Array.isArray(hero.armor) ? hero.armor[0] : hero.armor || 0}
                        </td>
                        <td>
                          {Array.isArray(hero.armor) ? hero.armor[1] : hero.armor || 0}
                        </td>
                        <td>
                          {Array.isArray(hero.armor) ? hero.armor[2] : hero.armor || 0}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Magic Resist</strong></td>
                        <td>
                          {Array.isArray(hero.magicResist) ? hero.magicResist[0] : hero.magicResist || 0}
                        </td>
                        <td>
                          {Array.isArray(hero.magicResist) ? hero.magicResist[1] : hero.magicResist || 0}
                        </td>
                        <td>
                          {Array.isArray(hero.magicResist) ? hero.magicResist[2] : hero.magicResist || 0}
                        </td>
                      </tr>
                    <tr>
                      <td><strong>Attack Rate</strong></td>
                      <td>
                        {(() => {
                          const attackRate = Array.isArray(hero.attackRate) ? hero.attackRate[0] : hero.attackRate;
                          return attackRate ? (1 / attackRate).toFixed(2) : '0.00';
                        })()}
                      </td>
                      <td>
                        {(() => {
                          const attackRate = Array.isArray(hero.attackRate) ? hero.attackRate[1] : hero.attackRate;
                          return attackRate ? (1 / attackRate).toFixed(2) : '0.00';
                        })()}
                      </td>
                      <td>
                        {(() => {
                          const attackRate = Array.isArray(hero.attackRate) ? hero.attackRate[2] : hero.attackRate;
                          return attackRate ? (1 / attackRate).toFixed(2) : '0.00';
                        })()}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Move Speed</strong></td>
                      <td>{Array.isArray(hero.movespeed) ? hero.movespeed[0] : (hero.movespeed || 0)}</td>
                      <td>{Array.isArray(hero.movespeed) ? hero.movespeed[1] : (hero.movespeed || 0)}</td>
                      <td>{Array.isArray(hero.movespeed) ? hero.movespeed[2] : (hero.movespeed || 0)}</td>
                    </tr>
                    <tr>
                      <td><strong>Attack Range</strong></td>
                      <td>{Array.isArray(hero.attackRange) ? hero.attackRange[0] : (hero.attackRange || 0)}</td>
                      <td>{Array.isArray(hero.attackRange) ? hero.attackRange[1] : (hero.attackRange || 0)}</td>
                      <td>{Array.isArray(hero.attackRange) ? hero.attackRange[2] : (hero.attackRange || 0)}</td>
                    </tr>
                    <tr>
                      <td><strong>Mana</strong></td>
                      <td>{hero.maxmana || 0}</td>
                      <td>{hero.maxmana || 0}</td>
                      <td>{hero.maxmana || 0}</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {abilities.length > 0 && (
                <div className="hero-detail-page__abilities-section">
                <h2 className="hero-detail-page__section-title">Abilities</h2>
                {abilities.map((ability, index) => (
                  <div key={index} className="hero-detail-page__ability">
                    <div className="hero-detail-page__ability-header">
                      <img
                        src={ability.iconPath}
                        alt={ability.name}
                        className="hero-detail-page__ability-icon"
                        onError={(e) => {
                          // Hide icon if it doesn't exist
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <h3 className="hero-detail-page__ability-name">{ability.name}</h3>
                    </div>
                    {ability.data.cooldown !== undefined && (
                      <div className="hero-detail-page__ability-stat">
                        <strong>Cooldown:</strong>{' '}
                        {Array.isArray(ability.data.cooldown)
                          ? ability.data.cooldown.join(' / ')
                          : ability.data.cooldown}{' '}
                        seconds
                      </div>
                    )}
                    {ability.data.manaCost !== undefined && (
                      <div className="hero-detail-page__ability-stat">
                        <strong>Mana Cost:</strong> {ability.data.manaCost}
                      </div>
                    )}
                    {ability.description && (
                      <div className="hero-detail-page__ability-description">
                        {ability.description.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    )}
                    {ability.lore && (
                      <div className="hero-detail-page__ability-lore">
                        <em>{ability.lore}</em>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};

