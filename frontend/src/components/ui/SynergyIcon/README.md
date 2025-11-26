# SynergyIcon Component

A React component that renders synergy icons based on an integer keyword prop.

## Usage

```tsx
import SynergyIcon from './components/SynergyIcon';

function App() {
  return (
    <div>
      <SynergyIcon keyword={15} /> {/* Assassin */}
      <SynergyIcon keyword={20} /> {/* Mage */}
    </div>
  );
}
```

## Props

- `keyword` (number, required): The integer keyword that maps to a synergy name

## Requirements

1. **Image Assets**: The component expects synergy icons to be accessible at:
   - `/synergyicons/` - Main icon images
   - `/synergyicons/synergy_backing_layers/` - Capsule style images (leftcapsule01-16, borders, etc.)

   Adjust the paths in `SynergyIcon.tsx` if your images are located elsewhere.

2. **TypeScript Configuration**: Ensure your `tsconfig.json` includes:
   ```json
   {
     "compilerOptions": {
       "resolveJsonModule": true
     }
   }
   ```

## Component Structure

- `SynergyIcon.tsx` - Main component
- `SynergyIcon.css` - Component styles
- `synergy-colors.css` - CSS custom properties for synergy colors
- `synergy-keyword-mappings.json` - Maps integer keywords to synergy names
- `synergy-styles.json` - Maps synergy names to capsule style numbers (1-16)
- `synergy-icon-map.json` - Maps synergy names to icon image files

## How It Works

1. Component receives `keyword` prop (integer)
2. Looks up synergy name from `synergy-keyword-mappings.json`
3. Gets capsule style number from `synergy-styles.json`
4. Gets icon image file from `synergy-icon-map.json`
5. Gets color CSS variables from `synergy-colors.css`
6. Renders icon with 4 layers:
   - Base capsule background (colored)
   - Border layer (black border texture)
   - Border pop layer (bright colored accent)
   - Synergy icon image (centered)

## Error Handling

- Missing keyword mapping: Falls back to Assassin (keyword 15)
- Missing style number: Falls back to style 1
- Missing icon file: Falls back to `beast_psd.png`
- Missing bright color: Falls back to regular color

