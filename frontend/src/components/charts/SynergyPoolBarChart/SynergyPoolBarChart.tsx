import { useMemo } from 'react';
import type { SynergyPoolStat } from '@/utils/synergyPoolCalculator';
import { synergyStatToBarStat, getSynergyVisualData } from '@/utils/poolBarStats';
import { SynergyIcon } from '@/components/ui/SynergyDisplay';
import { PoolBarChart } from '@/components/charts/PoolBarChart';

export interface SynergyPoolBarChartProps {
  synergyPoolStats: SynergyPoolStat[];
  className?: string;
}

/** @deprecated Use PoolBarChart with synergyStatToBarStat instead */
export const SynergyPoolBarChart = ({
  synergyPoolStats,
  className = '',
}: SynergyPoolBarChartProps) => {
  const items = useMemo(
    () => synergyPoolStats.map(synergyStatToBarStat),
    [synergyPoolStats]
  );

  return (
    <PoolBarChart
      className={className}
      items={items}
      emptyMessage="No synergy pool data available"
      renderLabel={(item) => {
        const synergyName = item.synergyName ?? item.label;
        const visual = getSynergyVisualData(synergyName);
        return (
          <SynergyIcon
            styleNumber={visual.styleNumber}
            iconFile={visual.iconFile}
            synergyName={synergyName}
            synergyColor={visual.synergyColor}
            brightColor={visual.brightColor}
          />
        );
      }}
    />
  );
};
