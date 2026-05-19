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
import { SliderInput } from '@/features/settings/components/SliderInput/SliderInput';
import type { Unit } from '@/types';
import { extractBenchUnits, buildTargetBench, type BenchRankDirection } from '@/utils/benchSort';
import './BenchSorterPage.css';

const BENCH_SLOT_COUNT = 8;

export const BenchSorterPage = () => {
  const { currentMatch, players, privatePlayerAccountId } = useAppSelector((state) => state.match);
  const { heroesData } = useHeroesDataContext();
  const { settings: generalSettings, updateSettings: updateGeneral } = useGeneralSettings();
  const [rankDirection, setRankDirection] = useState<BenchRankDirection>('left');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const response = await fetch('/api/organize_bench', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dry_run: dryRun,
          desired_entindex_order: targetBench.map((unit) => unit.entindex),
          timing_scale: generalSettings.benchOrganizeTimingScale,
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.status !== 'success') {
        throw new Error(payload?.message || payload?.error || 'Sort request failed');
      }
      const moves = payload?.moves_executed ?? 0;
      console.log(dryRun ? '[Bench] Dry-run complete.' : '[Bench] Sort executed.', { moves, diagnostics: payload?.diagnostics });
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
            <EmptyState
              title="No Active Match"
              message="Waiting for your private player state to become available."
              showSpinner
            />
          ) : (
            <div className="bench-sorter-page__content">
              <SettingsSection
                title="Sort Controls"
                description="Frontend computes desired bench order and backend executes it."
                collapsible={false}
              >
                <SettingsGroup variant="card">
                  <Text variant="body">Rank preference within same hero cluster:</Text>
                  <div className="bench-sorter-page__control-buttons">
                    <Button
                      variant={rankDirection === 'left' ? 'primary' : 'secondary'}
                      size="small"
                      onClick={() => setRankDirection('left')}
                    >
                      Higher rank left
                    </Button>
                    <Button
                      variant={rankDirection === 'right' ? 'primary' : 'secondary'}
                      size="small"
                      onClick={() => setRankDirection('right')}
                    >
                      Higher rank right
                    </Button>
                  </div>
                  <SliderInput
                    label="Sort automation speed"
                    value={generalSettings.benchOrganizeTimingScale}
                    onChange={(v) =>
                      updateGeneral({
                        benchOrganizeTimingScale: Math.min(4, Math.max(0.25, Math.round(v * 100) / 100)),
                      })
                    }
                    min={0.25}
                    max={4}
                    step={0.05}
                    leftLabel="Faster"
                    rightLabel="Slower"
                    unit="×"
                    showValue
                    className="bench-sorter-page__timing-slider"
                  />
                  <Text variant="label" color="secondary" className="bench-sorter-page__timing-hint">
                    Multiplies delay between each automated drag in the game client. Increase if sorting misses slots.
                  </Text>
                  <div className="bench-sorter-page__actions">
                    <Button variant="secondary" size="medium" onClick={() => executeSort(true)} disabled={isSubmitting}>
                      {isSubmitting ? 'Working...' : 'Dry-run backend'}
                    </Button>
                    <Button variant="primary" size="medium" onClick={() => executeSort(false)} disabled={isSubmitting}>
                      {isSubmitting ? 'Sorting...' : 'Execute sort'}
                    </Button>
                  </div>
                </SettingsGroup>
              </SettingsSection>

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

