# SynergyDisplay Component

A modular React component for displaying Dota Underlords synergy icons with progress pips.

## Structure

```
SynergyDisplay/
├── index.ts                 # Exports
├── SynergyDisplay.tsx       # Main component (combines Icon + Pips)
├── SynergyDisplay.css       # Main styles
├── SynergyIcon.tsx          # Capsule icon component
├── SynergyIcon.css          # Icon styles
├── SynergyPip.tsx           # Pip/progress bar component
├── SynergyPip.css           # Pip styles
├── synergy-colors.css       # CSS color variables
├── data/
│   ├── synergy-keyword-mappings.json
│   ├── synergy-styles.json
│   └── synergy-icon-map.json
└── README.md
```

## Usage

```tsx
import { SynergyDisplay } from './SynergyDisplay';

// Basic usage (icon only, no pips)
<SynergyDisplay keyword={15} />

// With pips (requires level data from synergies.json)
<SynergyDisplay 
  keyword={24}  // Warrior
  levels={[{ unitcount: 3 }, { unitcount: 6 }]}
  activeUnits={4}
  benchUnits={2}
/>
```

## Props

### SynergyDisplay
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `keyword` | `number` | Yes | Synergy keyword ID (from synergy_keyword_mappings.json) |
| `levels` | `SynergyLevel[]` | No | Level data from synergies.json |
| `activeUnits` | `number` | No | Number of active units (default: 0) |
| `benchUnits` | `number` | No | Number of benched units (default: 0) |

### SynergyIcon (standalone)
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `styleNumber` | `number` | Yes | Capsule style (1-16) |
| `iconFile` | `string` | Yes | Icon image filename |
| `synergyName` | `string` | Yes | For alt text |
| `synergyColor` | `string` | Yes | Computed synergy color |
| `brightColor` | `string` | Yes | Bright color for border pop |

### SynergyPip (standalone)
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `segmentNumber` | `number` | Yes | 1, 2, or 3 |
| `pipsPerBar` | `number` | Yes | 1, 2, or 3 pips per bar |
| `pipStates` | `PipState[]` | Yes | State of each pip ('active', 'bench', 'empty') |
| `synergyColor` | `string` | Yes | Color for active/bench pips |
| `bgColor` | `string` | No | Background color for empty pips |

## Requirements

- Images must be served from `/synergyicons/` path
- CSS color variables are loaded from `synergy-colors.css`

## Image Paths

The component expects images at:
- `/synergyicons/synergy_backing_layers/` - Capsule images
- `/synergyicons/` - Synergy icons and pip images

