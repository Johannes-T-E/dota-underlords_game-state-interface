import { useMemo, useState } from 'react';
import { IconArrowsShuffle } from '@tabler/icons-react';
import { MainContentTemplate } from '@/components/layout';
import { EmptyState, PageHeader } from '@/components/shared';
import { Button, HeroPortrait, Text } from '@/components/ui';
import { useAppSelector } from '@/hooks/redux';
import { useGeneralSettings } from '@/hooks/useSettings';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { SettingsSection } from '@/features/settings/components/SettingsSection/SettingsSection';
import { SettingsGroup } from '@/features/settings/components/SettingsGroup/SettingsGroup';
import type { Unit } from '@/types';
import { DEFAULT_BENCH_ORGANIZE_TIMINGS } from '@/utils/benchOrganizeTimings';
import { extractBenchUnits, buildTargetBench, organizeBench } from '@/utils/benchSort';
import { BenchSorterTimingControls } from './BenchSorterTimingControls';
import './BenchSorterPage.css';

const BENCH_SLOT_COUNT = 8;

export const BenchSorterPage = () => {
  const { currentMatch, players, privatePlayerAccountId } = useAppSelector((state) => state.match);
  const { heroesData } = useHeroesDataContext();
  const { settings: generalSettings, updateSettings: updateGeneral } = useGeneralSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rankDirection = generalSettings.benchRankDirection;
  const benchTimings = generalSettings.benchOrganizeTimings;

  const privatePlayer = useMemo(
    () => players.find((player) => player.account_id === privatePlayerAccountId) ?? null,
    [players, privatePlayerAccountId]
  );

  const currentBench = useMemo(() => extractBenchUnits(privatePlayer?.units), [privatePlayer?.units]);
  const targetBench = useMemo(() => buildTargetBench(currentBench, rankDirection), [currentBench, rankDirection]);
  const currentBenchSlots = useMemo(() => {
    const slots: Array<Unit | null> = Array(BENCH_SLOT_COUNT).fill(null);
    currentBench.forEach((unit) => {
      const slot = unit.position?.x ?? -1;
      if (slot >= 0 && slot < BENCH_SLOT_COUNT) {
        slots[slot] = unit;
      }
    });
    return slots;
  }, [currentBench]);
  const targetBenchSlots = useMemo(() => {
    const slots: Array<Unit | null> = Array(BENCH_SLOT_COUNT).fill(null);
    targetBench.slice(0, BENCH_SLOT_COUNT).forEach((unit, index) => {
      slots[index] = unit;
    });
    return slots;
  }, [targetBench]);

  const executeSort = async (dryRun: boolean) => {
    setIsSubmitting(true);
    try {
      const result = await organizeBench({
        targetBench,
        timings: benchTimings,
        dryRun,
      });
      console.log(dryRun ? '[Bench] Preview complete.' : '[Bench] Sort executed.', {
        moves: result.moves_executed,
        diagnostics: result.diagnostics,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sort request failed';
      console.error('[Bench]', message, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <MainContentTemplate centered={false} className="bench-sorter-page">
        <div className="bench-sorter-page__container">
          <PageHeader title="Bench Sorter" icon={<IconArrowsShuffle size={18} stroke={1.8} />} />

          {!currentMatch || !privatePlayer ? (
            <div className="bench-sorter-page__empty">
              <EmptyState
                title="No Active Match"
                message="Waiting for your private player state to become available."
                showSpinner
              />
            </div>
          ) : (
            <div className="bench-sorter-page__content">
              <SettingsSection
                title="Sort Controls"
                description="Choose how units are grouped and ordered on the bench."
                collapsible={false}
              >
                <SettingsGroup variant="card">
                  <Text variant="body">Rank preference within same hero cluster:</Text>
                  <div className="bench-sorter-page__control-buttons">
                    <Button
                      variant={rankDirection === 'left' ? 'primary' : 'secondary'}
                      size="small"
                      onClick={() => updateGeneral({ benchRankDirection: 'left' })}
                    >
                      Higher rank left
                    </Button>
                    <Button
                      variant={rankDirection === 'right' ? 'primary' : 'secondary'}
                      size="small"
                      onClick={() => updateGeneral({ benchRankDirection: 'right' })}
                    >
                      Higher rank right
                    </Button>
                  </div>
                </SettingsGroup>
              </SettingsSection>

              <SettingsSection
                title="Timing"
                description="Adjust how quickly units are moved. Saved automatically."
                collapsible={false}
              >
                <BenchSorterTimingControls
                  timings={benchTimings}
                  onChange={(patch) =>
                    updateGeneral({
                      benchOrganizeTimings: { ...benchTimings, ...patch },
                    })
                  }
                  onReset={() =>
                    updateGeneral({
                      benchOrganizeTimings: { ...DEFAULT_BENCH_ORGANIZE_TIMINGS },
                    })
                  }
                />
              </SettingsSection>

              <div className="bench-sorter-page__actions-outer">
                <div className="bench-sorter-page__actions">
                  <Button variant="secondary" size="medium" onClick={() => executeSort(true)} disabled={isSubmitting}>
                    {isSubmitting ? 'Working...' : 'Preview moves'}
                  </Button>
                  <Button variant="primary" size="medium" onClick={() => executeSort(false)} disabled={isSubmitting}>
                    {isSubmitting ? 'Sorting...' : 'Execute sort'}
                  </Button>
                </div>
              </div>

              <div className="bench-sorter-page__bench-grid">
                <SettingsSection title="Current Bench" collapsible={false} className="bench-sorter-page__panel-section">
                  <SettingsGroup variant="card">
                    <div className="bench-sorter-page__bench-row">
                      {currentBenchSlots.map((unit, index) => (
                        <div key={`current-slot-${index}`} className="bench-sorter-page__bench-slot">
                          <div className="bench-sorter-page__slot-index">{index + 1}</div>
                          {unit ? (
                            <div className="bench-sorter-page__bench-unit">
                              <HeroPortrait unitId={unit.unit_id} rank={unit.rank} heroesData={heroesData} />
                            </div>
                          ) : (
                            <div className="bench-sorter-page__bench-unit bench-sorter-page__bench-unit--empty" />
                          )}
                        </div>
                      ))}
                    </div>
                  </SettingsGroup>
                </SettingsSection>

                <SettingsSection title="Target Bench" collapsible={false} className="bench-sorter-page__panel-section">
                  <SettingsGroup variant="card">
                    <div className="bench-sorter-page__bench-row">
                      {targetBenchSlots.map((unit, index) => (
                        <div key={`target-slot-${index}`} className="bench-sorter-page__bench-slot">
                          <div className="bench-sorter-page__slot-index">{index + 1}</div>
                          {unit ? (
                            <div className="bench-sorter-page__bench-unit">
                              <HeroPortrait unitId={unit.unit_id} rank={unit.rank} heroesData={heroesData} />
                            </div>
                          ) : (
                            <div className="bench-sorter-page__bench-unit bench-sorter-page__bench-unit--empty" />
                          )}
                        </div>
                      ))}
                    </div>
                  </SettingsGroup>
                </SettingsSection>
              </div>

            </div>
          )}
        </div>
      </MainContentTemplate>
  );
};
