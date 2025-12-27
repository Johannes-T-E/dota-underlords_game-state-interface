import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { HeroSelectionPanel } from '@/features/build-creator/components/HeroSelectionPanel/HeroSelectionPanel';
import { EditablePlayerBoard } from '@/features/build-creator/components/EditablePlayerBoard/EditablePlayerBoard';
import { BuildManager } from '@/features/build-creator/components/BuildManager/BuildManager';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { generateBuildId, saveBuild } from '@/services/buildStorage';
import { validateBuild, getBuildStats, calculateBuildSynergies } from '@/utils/buildHelpers';
import { isSynergyActive } from '@/components/ui/SynergyDisplay/utils';
import { SynergiesCell } from '@/components/ui/SynergyDisplay';
import type { Build, BuildUnit } from '@/types';
import './BuildCreatorPage.css';

export const BuildCreatorPage = () => {
  const location = useLocation();
  const { heroesData } = useHeroesDataContext();
  const [currentBuild, setCurrentBuild] = useState<Build | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<BuildUnit | null>(null);
  // Track board state separately from build - allows free editing
  const [boardUnits, setBoardUnits] = useState<BuildUnit[]>([]);
  // Track hovered synergy for highlighting units
  const [hoveredSynergyKeyword, setHoveredSynergyKeyword] = useState<number | null>(null);

  // Use board units for display, or current build units if a build is loaded
  const buildUnits = useMemo(() => {
    return currentBuild?.units || boardUnits;
  }, [currentBuild, boardUnits]);

  // Handle hero selection from panel
  const handleHeroSelect = (unitId: number) => {
    // Find first empty position (bench first, then roster)
    let position = { x: 0, y: -1 };
    let found = false;

    // Check bench
    for (let x = 0; x < 8; x++) {
      const occupied = buildUnits.some(u => u.position.x === x && u.position.y === -1);
      if (!occupied) {
        position = { x, y: -1 };
        found = true;
        break;
      }
    }

    // Check roster if bench is full
    if (!found) {
      for (let y = 3; y >= 0; y--) {
        for (let x = 0; x < 8; x++) {
          const occupied = buildUnits.some(u => u.position.x === x && u.position.y === y);
          if (!occupied) {
            position = { x, y };
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    if (!found) {
      alert('Board is full. Remove a unit first.');
      return;
    }

    // Add unit to board
    const newUnit: BuildUnit = {
      unit_id: unitId,
      position,
      rank: 1,
    };

    const updatedUnits = [...buildUnits, newUnit];
    updateBoardUnits(updatedUnits);
  };

  // Handle units change from board
  const handleUnitsChange = (units: BuildUnit[]) => {
    updateBoardUnits(units);
  };

  // Update board units (separate from build - allows free editing)
  const updateBoardUnits = (units: BuildUnit[]) => {
    setBoardUnits(units);
    // If a build is loaded, update it too (for editing existing builds)
    if (currentBuild) {
      setCurrentBuild({
        ...currentBuild,
        units,
        updatedAt: new Date().toISOString(),
      });
    }
    setSelectedUnit(null);
  };

  // Handle unit selection
  const handleUnitSelect = (unit: BuildUnit | null) => {
    setSelectedUnit(unit);
  };

  // Handle build selection from manager
  const handleBuildSelect = (build: Build | null) => {
    setCurrentBuild(build);
    // When loading a build, update board units to match
    if (build) {
      setBoardUnits(build.units);
    } else {
      // When clearing build, keep board state (allows starting fresh)
      setBoardUnits([]);
    }
    setSelectedUnit(null);
  };

  // Handle build loading from navigation state (e.g., from BuildSuggestions)
  useEffect(() => {
    const loadBuild = (location.state as { loadBuild?: Build })?.loadBuild;
    if (loadBuild) {
      handleBuildSelect(loadBuild);
      // Clear the state to prevent reloading on re-render
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Handle clear board
  const handleClearBoard = () => {
    if (confirm('Clear the board? This will not affect saved builds.')) {
      setBoardUnits([]);
      setSelectedUnit(null);
      // Don't clear currentBuild - user might want to reload it
    }
  };

  // Handle build save from manager
  const handleBuildSave = (build: Build) => {
    const validation = validateBuild(build);
    if (!validation.valid) {
      console.error('Build validation failed:', validation.errors);
      alert(`Build validation failed:\n${validation.errors.join('\n')}`);
      return;
    }
    setCurrentBuild(build);
    console.log('Build saved and set as current:', build.name);
  };

  // Handle unit rank change
  const handleUnitRankChange = (rank: number) => {
    if (!selectedUnit) return;

    const updatedUnits = buildUnits.map(u =>
      u === selectedUnit ? { ...u, rank } : u
    );
    updateBoardUnits(updatedUnits);
    setSelectedUnit({ ...selectedUnit, rank });
  };

  // Get build stats (use current board state or current build)
  const buildStats = useMemo(() => {
    const unitsToUse = buildUnits;
    if (unitsToUse.length === 0) return null;
    const tempBuild: Build = {
      id: '',
      name: '',
      units: unitsToUse,
      createdAt: '',
      updatedAt: '',
    };
    return getBuildStats(tempBuild, heroesData);
  }, [buildUnits, heroesData]);

  // Get synergies (use current board state or current build)
  const synergies = useMemo(() => {
    const unitsToUse = buildUnits;
    if (unitsToUse.length === 0) return [];
    const tempBuild: Build = {
      id: '',
      name: '',
      units: unitsToUse,
      createdAt: '',
      updatedAt: '',
    };
    const calculatedSynergies = calculateBuildSynergies(tempBuild, heroesData);
    
    // Sort: active synergies first, then inactive
    return calculatedSynergies.sort((a, b) => {
      const aIsActive = isSynergyActive(a);
      const bIsActive = isSynergyActive(b);
      
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      return 0; // Keep original order within active/inactive groups
    });
  }, [buildUnits, heroesData]);

  return (
    <AppLayout>
      <MainContentTemplate centered={false} className="build-creator-page">
        <div className="build-creator-page__container">
          <div className="build-creator-page__header">
            <h1 className="build-creator-page__title">Build Creator</h1>
          </div>

          <div className="build-creator-page__content">
            {/* Left panel: Hero selection */}
            <div className="build-creator-page__left-panel">
              <HeroSelectionPanel
                heroesData={heroesData}
                onHeroSelect={handleHeroSelect}
              />
            </div>

            {/* Center panel: Editable board */}
            <div className="build-creator-page__center-panel">
              <EditablePlayerBoard
                units={buildUnits}
                heroesData={heroesData}
                onUnitsChange={handleUnitsChange}
                onUnitSelect={handleUnitSelect}
                selectedUnitId={selectedUnit?.unit_id || null}
                onClearBoard={handleClearBoard}
                hoveredSynergyKeyword={hoveredSynergyKeyword}
              />

              {/* Unit details panel */}
              {selectedUnit && (
                <div className="build-creator-page__unit-details">
                  <h3>Unit Details</h3>
                  <div className="build-creator-page__unit-details-content">
                    <div className="build-creator-page__unit-details-row">
                      <label>Rank:</label>
                      <select
                        value={selectedUnit.rank}
                        onChange={(e) => handleUnitRankChange(parseInt(e.target.value, 10))}
                        className="build-creator-page__unit-details-select"
                      >
                        <option value={1}>1 Star</option>
                        <option value={2}>2 Stars</option>
                        <option value={3}>3 Stars</option>
                      </select>
                    </div>
                    <div className="build-creator-page__unit-details-row">
                      <label>Position:</label>
                      <span>
                        ({selectedUnit.position.x}, {selectedUnit.position.y === -1 ? 'Bench' : selectedUnit.position.y})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Build stats */}
              {buildStats && (
                <div className="build-creator-page__build-stats">
                  <div className="build-creator-page__build-stats-header">
                    <div className="build-creator-page__build-stats-title">Build Stats</div>
                    <div className="build-creator-page__build-stats-meta">
                      {buildStats.unitCount} units • {buildStats.totalCost}g • Tier {buildStats.averageTier.toFixed(1)}
                    </div>
                  </div>
                  <div className="build-creator-page__build-stats-content">
                    {synergies.length > 0 ? (
                      <div className="build-creator-page__synergies">
                        <SynergiesCell
                          synergies={synergies}
                          showPips={true}
                          onlyActive={false}
                          onSynergyHover={setHoveredSynergyKeyword}
                        />
                      </div>
                    ) : (
                      <div className="build-creator-page__synergies-empty">No synergies</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right panel: Build manager */}
            <div className="build-creator-page__right-panel">
              <BuildManager
                currentBuild={currentBuild}
                currentBoardUnits={buildUnits}
                onBuildSelect={handleBuildSelect}
                onBuildSave={handleBuildSave}
              />
            </div>
          </div>
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};

