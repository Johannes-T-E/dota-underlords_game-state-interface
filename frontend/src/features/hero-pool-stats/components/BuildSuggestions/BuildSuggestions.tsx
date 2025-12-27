import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadBuilds } from '@/services/buildStorage';
import { calculateBuildSuggestions } from '../../utils/buildSuggestionCalculator';
import { calculateBuildSynergies } from '@/utils/buildHelpers';
import { isSynergyActive } from '@/components/ui/SynergyDisplay/utils';
import { getSynergyNameByKeyword } from '@/components/ui/SynergyDisplay/utils';
import { SynergyIcon } from '@/components/ui/SynergyDisplay/components';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { EmptyState } from '@/components/shared';
import { getHeroIconPath } from '@/utils/heroHelpers';
import type { Build, PlayerState, PrivatePlayerState } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import type { PoolCount } from '@/utils/poolCalculator';
import synergyStyles from '@/components/ui/SynergyDisplay/data/synergy-styles.json';
import synergyIconMap from '@/components/ui/SynergyDisplay/data/synergy-icon-map.json';
import './BuildSuggestions.css';
import '@/components/ui/SynergyDisplay/synergy-colors.css';

interface BuildSuggestionsProps {
  players: PlayerState[];
  privatePlayer: PrivatePlayerState | null;
  poolCounts: Map<number, PoolCount>;
  heroesData: HeroesData | null;
}

// Helper: Get visual data for a synergy
function getSynergyVisualData(synergyName: string) {
  const styleNumber = (synergyStyles as Record<string, number>)[synergyName] || 1;
  const iconFile = (synergyIconMap as Record<string, string>)[synergyName] || 'beast_psd.png';
  
  const getColorVar = (name: string, bright: boolean = false): string => {
    const cssVar = name.toLowerCase();
    const suffix = bright ? '-bright' : '';
    return `--synergy-${cssVar}-color${suffix}`;
  };
  
  const getComputedColor = (varName: string, fallback: string = '#888888'): string => {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return value || fallback;
  };
  
  const colorVar = getColorVar(synergyName);
  const brightColorVar = getColorVar(synergyName, true);
  
  return {
    styleNumber,
    iconFile,
    synergyColor: getComputedColor(colorVar),
    brightColor: getComputedColor(brightColorVar) || getComputedColor(colorVar),
  };
}

// Get availability color class
function getAvailabilityClass(availability: number): string {
  if (availability >= 0.6) return 'build-suggestion__hero--high';
  if (availability >= 0.3) return 'build-suggestion__hero--medium';
  return 'build-suggestion__hero--low';
}

// Get competition color class
function getCompetitionClass(competition: number): string {
  if (competition === 0) return 'build-suggestion__hero-competition--none';
  if (competition === 1) return 'build-suggestion__hero-competition--low';
  if (competition === 2) return 'build-suggestion__hero-competition--medium';
  return 'build-suggestion__hero-competition--high';
}

export const BuildSuggestions = ({
  players,
  privatePlayer,
  poolCounts,
  heroesData,
}: BuildSuggestionsProps) => {
  const navigate = useNavigate();
  const { heroesData: contextHeroesData } = useHeroesDataContext();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);

  // Use context heroesData if prop is not provided
  const effectiveHeroesData = heroesData || contextHeroesData;

  // Load builds on mount
  useEffect(() => {
    const loadBuildsData = async () => {
      try {
        setLoading(true);
        const loadedBuilds = await loadBuilds();
        setBuilds(loadedBuilds);
      } catch (error) {
        console.error('Failed to load builds:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBuildsData();
  }, []);

  // Calculate suggestions
  const suggestions = useMemo(() => {
    if (loading || builds.length === 0 || !effectiveHeroesData || poolCounts.size === 0) {
      return [];
    }
    return calculateBuildSuggestions(
      builds,
      players,
      privatePlayer,
      poolCounts,
      effectiveHeroesData
    );
  }, [builds, players, privatePlayer, poolCounts, effectiveHeroesData, loading]);

  // Get top 5 suggestions (more compact)
  const topSuggestions = useMemo(() => {
    return suggestions.slice(0, 5);
  }, [suggestions]);

  const handleBuildClick = (build: Build) => {
    // Navigate to build creator with the build
    navigate('/build-creator', { state: { loadBuild: build } });
  };

  if (loading) {
    return (
      <div className="build-suggestions">
        <div className="build-suggestions__header">
          <h2 className="build-suggestions__title">Build Suggestions</h2>
        </div>
        <div className="build-suggestions__loading">
          <EmptyState
            title="Loading Builds"
            message="Analyzing saved builds..."
            showSpinner
          />
        </div>
      </div>
    );
  }

  if (builds.length === 0) {
    return (
      <div className="build-suggestions">
        <div className="build-suggestions__header">
          <h2 className="build-suggestions__title">Build Suggestions</h2>
        </div>
        <div className="build-suggestions__empty">
          <EmptyState
            title="No Saved Builds"
            message="Create builds in the Build Creator to get suggestions based on hero pool availability."
            showSpinner={false}
          />
        </div>
      </div>
    );
  }

  if (topSuggestions.length === 0) {
    return (
      <div className="build-suggestions">
        <div className="build-suggestions__header">
          <h2 className="build-suggestions__title">Build Suggestions</h2>
        </div>
        <div className="build-suggestions__empty">
          <EmptyState
            title="No Suggestions Available"
            message="Unable to calculate build suggestions. Ensure there is an active match with pool data."
            showSpinner={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="build-suggestions">
      <div className="build-suggestions__header">
        <h2 className="build-suggestions__title">Build Suggestions</h2>
        <p className="build-suggestions__subtitle">
          Top builds ranked by hero availability and competition
        </p>
      </div>
      <div className="build-suggestions__list">
        {topSuggestions.map((suggestion) => {
          const buildSynergies = calculateBuildSynergies(suggestion.build, effectiveHeroesData);
          const activeSynergies = buildSynergies.filter(synergy => isSynergyActive(synergy));

          return (
            <div
              key={suggestion.build.id}
              className="build-suggestion"
              onClick={() => handleBuildClick(suggestion.build)}
            >
              <div className="build-suggestion__header">
                <div className="build-suggestion__name-section">
                  <h3 className="build-suggestion__name">{suggestion.build.name}</h3>
                  {activeSynergies.length > 0 && (
                    <div className="build-suggestion__synergies">
                      {activeSynergies.map((synergy) => {
                        const synergyName = getSynergyNameByKeyword(synergy.keyword);
                        if (!synergyName) return null;
                        const visual = getSynergyVisualData(synergyName);
                        return (
                          <div
                            key={synergy.keyword}
                            className="build-suggestion__synergy-icon"
                            title={synergyName}
                          >
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
                  )}
                </div>
                <div className="build-suggestion__score">
                  <span className="build-suggestion__score-label">Score:</span>
                  <span className="build-suggestion__score-value">
                    {(suggestion.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {suggestion.build.description && (
                <p className="build-suggestion__description">{suggestion.build.description}</p>
              )}

              <div className="build-suggestion__heroes">
                <div className="build-suggestion__heroes-title">Heroes:</div>
                <div className="build-suggestion__heroes-list">
                  {Array.from(suggestion.heroScores.entries())
                    .slice(0, 10) // Show more heroes since we're using horizontal layout
                    .map(([unitId, heroScore]) => {
                    const heroIconPath = getHeroIconPath(unitId, effectiveHeroesData);
                    // Use score (which includes competition) for color coding, not just availability
                    const availabilityClass = getAvailabilityClass(heroScore.score);
                    const competitionClass = getCompetitionClass(heroScore.competition);
                    const competitionText = heroScore.competition > 0
                      ? `${heroScore.competition} competing`
                      : 'No competition';

                    return (
                      <div
                        key={unitId}
                        className={`build-suggestion__hero ${availabilityClass}`}
                        title={`Unit ID ${unitId}: ${(heroScore.availability * 100).toFixed(0)}% available, ${competitionText}, Score: ${(heroScore.score * 100).toFixed(0)}%`}
                      >
                        <div className="build-suggestion__hero-portrait">
                          <img 
                            src={heroIconPath} 
                            alt={`Unit ${unitId}`}
                            className="build-suggestion__hero-image"
                          />
                        </div>
                        <div className={`build-suggestion__hero-competition ${competitionClass}`}>
                          {heroScore.competition}
                        </div>
                      </div>
                    );
                  })}
                  {suggestion.heroScores.size > 10 && (
                    <div className="build-suggestion__hero-more">
                      +{suggestion.heroScores.size - 10}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

