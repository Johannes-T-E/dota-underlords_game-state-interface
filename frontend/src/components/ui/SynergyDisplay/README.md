# SynergyDisplay Component

A modular, optimized React component for displaying Dota Underlords synergy information with icon and pip progress indicators.

## Features

- **Modular Architecture**: Composed of reusable subcomponents (SynergyIcon, PipDisplay)
- **Highly Optimized**: Pre-rendered state components, heavy memoization, React.memo
- **Flexible Display Modes**: Show icon + pips or icon only
- **Dynamic Theming**: CSS custom properties for synergy colors
- **Type-Safe**: Full TypeScript support

## Usage

### Basic Usage (Icon + Pips)

```tsx
import { SynergyDisplay } from '@/components/ui/SynergyDisplay';

<SynergyDisplay
  keyword={10}  // Synergy keyword ID
  levels={[{ unitcount: 2 }, { unitcount: 4 }, { unitcount: 6 }]}
  activeUnits={3}
  benchUnits={1}
/>
```

### Icon Only Mode

```tsx
<SynergyDisplay
  keyword={10}
  showPips={false}
/>
```

### Using Subcomponents Directly

```tsx
import { SynergyIcon, PipDisplay } from '@/components/ui/SynergyDisplay';

// Icon only
<SynergyIcon
  styleNumber={5}
  iconFile="warrior_psd.png"
  synergyName="Warrior"
  synergyColor="#ff6600"
  brightColor="#ff9933"
/>

// Pips only
<PipDisplay
  levels={3}
  pips_per_level={2}
  number_of_A={4}
  number_of_B={1}
  fillColor="#ff6600"
  backgroundColor="#1a1a1a"
/>
```

## Props

### SynergyDisplay

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `keyword` | `number` | required | Synergy keyword ID |
| `levels` | `SynergyLevel[]` | `[]` | Array of synergy level thresholds |
| `activeUnits` | `number` | `0` | Number of active units on board |
| `benchUnits` | `number` | `0` | Number of benched units |
| `showPips` | `boolean` | `true` | Whether to show pip progress bars |

### SynergyIcon

| Prop | Type | Description |
|------|------|-------------|
| `styleNumber` | `number` | Capsule style (1-16) |
| `iconFile` | `string` | Icon image filename |
| `synergyName` | `string` | For alt text |
| `synergyColor` | `string` | Computed synergy color (hex) |
| `brightColor` | `string` | Bright color for border pop (hex) |

### PipDisplay

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `levels` | `number` | required | Number of levels (bars) |
| `pips_per_level` | `number` | required | Pips per level (1, 2, or 3) |
| `number_of_A` | `number` | `0` | Active/filled pips |
| `number_of_B` | `number` | `0` | Bench/partial pips |
| `fillColor` | `string` | `#ff0000` | Fill color (hex) |
| `backgroundColor` | `string` | `#000000` | Background color (hex) |

## File Structure

```
SynergyDisplay/
├── components/
│   ├── SynergyIcon/
│   │   ├── SynergyIcon.tsx
│   │   ├── SynergyIcon.css
│   │   └── index.ts
│   ├── SynergyPips/
│   │   ├── PipDisplay.tsx
│   │   ├── PipDisplay.css
│   │   ├── components/
│   │   │   └── PipStates/
│   │   │       ├── PipStates_1.tsx  (3 states: A, E, B)
│   │   │       ├── PipStates_2.tsx  (6 states: AA, EE, BB, AE, AB, BE)
│   │   │       ├── PipStates_3.tsx  (10 states)
│   │   │       ├── PipStates.css
│   │   │       └── index.ts
│   │   └── index.ts
│   └── index.ts
├── data/
│   ├── synergies.json
│   ├── synergy-icon-map.json
│   ├── synergy-keyword-mappings.json
│   └── synergy-styles.json
├── SynergyDisplay.tsx
├── SynergyDisplay.css
├── synergy-colors.css
├── SynergiesCell.tsx
├── SynergiesCell.css
├── utils.ts
├── index.ts
└── README.md
```

## Performance

The component is optimized for high-frequency updates:

- **19 pre-rendered pip state components** - No runtime state calculation
- **React.memo** on all components prevents unnecessary re-renders
- **useMemo** for all derived calculations
- **ResizeObserver** for pixel-perfect pip positioning
- Handles **100+ instances at 5 updates/sec** smoothly

## Assets

- Synergy icons: `/public/icons/synergyicons/`
- Capsule backing layers: `/public/icons/synergyicons/synergy_backing_layers/`
- Pip images: `/public/icons/synergyicons/empty_synergy_pip_*`
