import { useState, useEffect, useMemo } from 'react';
import { loadBuilds, deleteBuild, saveBuild, generateBuildId } from '@/services/buildStorage';
import { calculateBuildSynergies } from '@/utils/buildHelpers';
import { isSynergyActive } from '@/components/ui/SynergyDisplay/utils';
import { getSynergyNameByKeyword } from '@/components/ui/SynergyDisplay/utils';
import { SynergyIcon } from '@/components/ui/SynergyDisplay/components';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import synergyStyles from '@/components/ui/SynergyDisplay/data/synergy-styles.json';
import synergyIconMap from '@/components/ui/SynergyDisplay/data/synergy-icon-map.json';
import type { Build, BuildUnit } from '@/types';
import './BuildManager.css';
import '@/components/ui/SynergyDisplay/synergy-colors.css';

export interface BuildManagerProps {
  currentBuild: Build | null;
  currentBoardUnits: BuildUnit[]; // Current board state (may be unsaved)
  onBuildSelect: (build: Build | null) => void;
  onBuildSave: (build: Build) => void;
  className?: string;
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

// Build list item component
interface BuildListItemProps {
  build: Build;
  isActive: boolean;
  heroesData: any;
  onLoad: (build: Build) => void;
}

const BuildListItem = ({ build, isActive, heroesData, onLoad }: BuildListItemProps) => {
  // Calculate active synergies for this build
  const buildSynergies = useMemo(() => {
    if (!heroesData || build.units.length === 0) return [];
    const allSynergies = calculateBuildSynergies(build, heroesData);
    return allSynergies.filter(synergy => isSynergyActive(synergy));
  }, [build, heroesData]);

  return (
    <div
      className={`build-manager__list-item ${
        isActive ? 'build-manager__list-item--active' : ''
      }`}
      onClick={() => onLoad(build)}
    >
      <div className="build-manager__list-item-content">
        <div className="build-manager__list-item-header">
          <div className="build-manager__list-item-name">{build.name}</div>
          <div className="build-manager__list-item-units">{build.units.length} units</div>
        </div>
        {buildSynergies.length > 0 && (
          <div className="build-manager__list-item-synergies">
            {buildSynergies.map((synergy) => {
              const synergyName = getSynergyNameByKeyword(synergy.keyword);
              if (!synergyName) return null;
              const visual = getSynergyVisualData(synergyName);
              return (
                <div
                  key={synergy.keyword}
                  className="build-manager__synergy-icon"
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
        {build.description && (
          <div className="build-manager__list-item-description">{build.description}</div>
        )}
      </div>
    </div>
  );
};

export const BuildManager = ({
  currentBuild,
  currentBoardUnits,
  onBuildSelect,
  onBuildSave,
  className = '',
}: BuildManagerProps) => {
  const { heroesData } = useHeroesDataContext();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [buildName, setBuildName] = useState('');
  const [buildDescription, setBuildDescription] = useState('');
  const [, setEditingBuildId] = useState<string | null>(null);

  // Load builds on mount
  useEffect(() => {
    refreshBuilds();
  }, []);

  // Update form when current build changes
  useEffect(() => {
    if (currentBuild) {
      setBuildName(currentBuild.name);
      setBuildDescription(currentBuild.description || '');
      setEditingBuildId(currentBuild.id);
    } else {
      // When no build is selected, clear name but keep description if user was typing
      // Only clear if we're not in the middle of creating a new build
      if (currentBoardUnits.length === 0) {
        setBuildName('');
        setBuildDescription('');
      }
      setEditingBuildId(null);
    }
  }, [currentBuild, currentBoardUnits.length]);

  const refreshBuilds = async () => {
    try {
      const loadedBuilds = await loadBuilds();
      setBuilds(loadedBuilds);
    } catch (error) {
      console.error('Failed to refresh builds:', error);
    }
  };


  const handleSaveBuild = async () => {
    // Check if there are units on the board
    if (currentBoardUnits.length === 0) {
      alert('Please place units on the board before saving.');
      return;
    }

    // Get build name
    let finalName = buildName.trim();
    
    if (!finalName) {
      const nameInput = prompt('Enter a name for this build:');
      if (!nameInput || !nameInput.trim()) {
        return; // User cancelled or entered empty name
      }
      finalName = nameInput.trim();
      setBuildName(finalName);
    }

    // Check for duplicate names (excluding current build if updating)
    const existingBuildWithName = builds.find(b => 
      b.name.toLowerCase() === finalName.toLowerCase() && 
      b.id !== currentBuild?.id
    );
    
    if (existingBuildWithName) {
      alert(`A build with the name "${finalName}" already exists. Please choose a different name.`);
      return;
    }

    // Determine if we're creating new or updating existing
    const isNewBuild = !currentBuild;

    // Create build from current board state
    const buildToSave: Build = {
      ...(isNewBuild ? {} : currentBuild || {}),
      id: isNewBuild ? generateBuildId() : (currentBuild?.id || generateBuildId()),
      name: finalName,
      description: buildDescription.trim() || undefined,
      units: currentBoardUnits, // Always use current board state
      createdAt: isNewBuild ? new Date().toISOString() : (currentBuild?.createdAt || new Date().toISOString()),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveBuild(buildToSave);
      onBuildSave(buildToSave);
      await refreshBuilds();
      console.log('Build saved successfully:', buildToSave.name);
    } catch (error) {
      console.error('Failed to save build:', error);
      alert(`Failed to save build: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLoadBuild = (build: Build) => {
    onBuildSelect(build);
  };

  const handleDeleteBuild = async (buildId: string) => {
    if (confirm('Are you sure you want to delete this build?')) {
      try {
        await deleteBuild(buildId);
        if (currentBuild?.id === buildId) {
          onBuildSelect(null);
        }
        await refreshBuilds();
      } catch (error) {
        console.error('Failed to delete build:', error);
        alert(`Failed to delete build: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <div className={`build-manager ${className}`}>
      <div className="build-manager__header">
        <h3 className="build-manager__title">Builds</h3>
      </div>

      {/* Build form */}
      <div className="build-manager__form">
        {currentBuild && (
          <div className="build-manager__status">
            {currentBuild.name ? `Editing: ${currentBuild.name}` : 'Unsaved build'}
          </div>
        )}
        {!currentBuild && currentBoardUnits.length > 0 && (
          <div className="build-manager__status build-manager__status--unsaved">
            Unsaved configuration ({currentBoardUnits.length} units)
          </div>
        )}
        <div className="build-manager__form-group">
          <label htmlFor="build-name">Name:</label>
          <input
            id="build-name"
            type="text"
            value={buildName}
            onChange={(e) => setBuildName(e.target.value)}
            placeholder={currentBuild ? "Enter build name..." : "Enter name for new build..."}
            className="build-manager__input"
          />
        </div>

        <div className="build-manager__form-group">
          <label htmlFor="build-description">Description:</label>
          <textarea
            id="build-description"
            value={buildDescription}
            onChange={(e) => setBuildDescription(e.target.value)}
            placeholder="Optional description..."
            className="build-manager__textarea"
            rows={2}
          />
        </div>

        <div className="build-manager__actions">
          <button
            onClick={handleSaveBuild}
            className="build-manager__button build-manager__button--primary"
            disabled={currentBoardUnits.length === 0}
          >
            {currentBuild ? 'Save Changes' : 'Save Build'}
          </button>
          {currentBuild && (
            <button
              onClick={() => handleDeleteBuild(currentBuild.id)}
              className="build-manager__button build-manager__button--delete"
            >
              Delete Build
            </button>
          )}
        </div>
      </div>

      {/* Build list */}
      <div className="build-manager__list">
        <div className="build-manager__list-header">
          <span>Saved Builds ({builds.length})</span>
        </div>
        <div className="build-manager__list-content">
          {builds.length === 0 ? (
            <div className="build-manager__empty">
              No saved builds
            </div>
          ) : (
            builds.map((build) => (
              <BuildListItem
                key={build.id}
                build={build}
                isActive={currentBuild?.id === build.id}
                heroesData={heroesData}
                onLoad={handleLoadBuild}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

