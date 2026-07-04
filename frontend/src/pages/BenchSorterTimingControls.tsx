import { Button } from '@/components/ui';
import { SettingsGroup } from '@/features/settings/components/SettingsGroup/SettingsGroup';
import { SettingsSection } from '@/features/settings/components/SettingsSection/SettingsSection';
import { SliderInput } from '@/features/settings/components/SliderInput/SliderInput';
import {
  type BenchOrganizeTimings,
  DEFAULT_BENCH_ORGANIZE_TIMINGS,
} from '@/utils/benchOrganizeTimings';
import './BenchSorterTimingControls.css';

type TimingKey = keyof BenchOrganizeTimings;

interface TimingSliderSpec {
  key: TimingKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

const BETWEEN_MOVE_SLIDERS: TimingSliderSpec[] = [
  {
    key: 'betweenMovesSec',
    label: 'Pause between moves',
    min: 0.05,
    max: 1,
    step: 0.01,
  },
];

const SESSION_SLIDERS: TimingSliderSpec[] = [
  {
    key: 'settleAfterFocusSec',
    label: 'Pause after focusing the game',
    min: 0.05,
    max: 0.5,
    step: 0.01,
  },
];

const PER_DRAG_SLIDERS: TimingSliderSpec[] = [
  {
    key: 'postDragDelaySec',
    label: 'Pause after releasing a unit',
    min: 0.01,
    max: 0.15,
    step: 0.005,
  },
];

const ADVANCED_DRAG_SLIDERS: TimingSliderSpec[] = [
  {
    key: 'prePickupDelaySec',
    label: 'Pause before picking up',
    min: 0.001,
    max: 0.03,
    step: 0.001,
  },
  {
    key: 'afterMousedownDelaySec',
    label: 'Hold after click',
    min: 0.005,
    max: 0.05,
    step: 0.001,
  },
  {
    key: 'beforeMouseupDelaySec',
    label: 'Pause before releasing click',
    min: 0.005,
    max: 0.05,
    step: 0.001,
  },
  {
    key: 'dragStepSleepSec',
    label: 'Pause during drag motion',
    min: 0.005,
    max: 0.05,
    step: 0.001,
  },
];

const roundTiming = (value: number, step: number): number => {
  const decimals = step < 0.01 ? 3 : step < 0.1 ? 2 : 1;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const clampTiming = (value: number, min: number, max: number, step: number): number =>
  Math.min(max, Math.max(min, roundTiming(value, step)));

export interface BenchSorterTimingControlsProps {
  timings: BenchOrganizeTimings;
  onChange: (patch: Partial<BenchOrganizeTimings>) => void;
  onReset: () => void;
}

const TimingSliderGroup = ({
  sliders,
  timings,
  onChange,
}: {
  sliders: TimingSliderSpec[];
  timings: BenchOrganizeTimings;
  onChange: (patch: Partial<BenchOrganizeTimings>) => void;
}) => (
  <div className="bench-sorter-timing-controls__slider-group">
    {sliders.map((spec) => (
      <SliderInput
        key={spec.key}
        label={spec.label}
        value={timings[spec.key]}
        onChange={(v) =>
          onChange({ [spec.key]: clampTiming(v, spec.min, spec.max, spec.step) } as Partial<BenchOrganizeTimings>)
        }
        min={spec.min}
        max={spec.max}
        step={spec.step}
        unit="s"
        showValue
        className="bench-sorter-timing-controls__slider"
      />
    ))}
  </div>
);

export const BenchSorterTimingControls = ({ timings, onChange, onReset }: BenchSorterTimingControlsProps) => {
  return (
    <div className="bench-sorter-timing-controls">
      <SettingsGroup variant="card">
        <SliderInput
          label="Drag speed"
          value={timings.dragScale}
          onChange={(v) => onChange({ dragScale: Math.min(4, Math.max(0.25, Math.round(v * 100) / 100)) })}
          min={0.25}
          max={4}
          step={0.05}
          leftLabel="Faster"
          rightLabel="Slower"
          unit="×"
          showValue
          className="bench-sorter-timing-controls__slider"
        />
      </SettingsGroup>

      <SettingsSection title="Between moves" collapsible defaultOpen>
        <SettingsGroup variant="card">
          <TimingSliderGroup sliders={BETWEEN_MOVE_SLIDERS} timings={timings} onChange={onChange} />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="When sorting starts" collapsible defaultOpen={false}>
        <SettingsGroup variant="card">
          <TimingSliderGroup sliders={SESSION_SLIDERS} timings={timings} onChange={onChange} />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Each drag" collapsible defaultOpen={false}>
        <SettingsGroup variant="card">
          <TimingSliderGroup sliders={PER_DRAG_SLIDERS} timings={timings} onChange={onChange} />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Fine tuning" collapsible defaultOpen={false}>
        <SettingsGroup variant="card">
          <TimingSliderGroup sliders={ADVANCED_DRAG_SLIDERS} timings={timings} onChange={onChange} />
        </SettingsGroup>
      </SettingsSection>

      <div className="bench-sorter-timing-controls__reset">
        <Button variant="secondary" size="small" onClick={onReset}>
          Reset to defaults
        </Button>
      </div>
    </div>
  );
};

export { DEFAULT_BENCH_ORGANIZE_TIMINGS };
