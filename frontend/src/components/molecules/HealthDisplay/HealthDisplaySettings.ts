// HealthDisplay Settings Interface
// This could be used in a future settings menu component

export interface ColorStop {
  position: number; // 0-100 where this color should appear
  color: string; // Hex or RGB color
}

export interface InterpolationConfig {
  type: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier';
  bezierPoints?: [number, number, number, number]; // For bezier type
}

export interface HealthColorConfig {
  colorStops: ColorStop[];
  interpolation: InterpolationConfig;
  reverse?: boolean; // If true, reverses the color stops
}

export interface HealthDisplayStyling {
  // Font settings
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  
  // Text effects
  textShadow?: string;
  
  // Icon settings
  iconFontSize?: string;
  iconMargin?: string;
  
  // Color configuration
  colorConfig?: HealthColorConfig;
  
  // Animation settings
  animationDuration?: number; // milliseconds
  animationEasing?: string;
  pulseScale?: number; // How much to scale during pulse (1.0 = no scaling)
}

export interface HealthDisplaySettings {
  // Visibility toggles
  showIcon: boolean;
  showValue: boolean;
  animateOnChange: boolean;
  
  // Color configuration
  useColorTransition: boolean;
  colorConfig?: HealthColorConfig;
  
  // Styling configuration
  styling?: HealthDisplayStyling;
}

export const DEFAULT_HEALTH_DISPLAY_SETTINGS: HealthDisplaySettings = {
  showIcon: true,
  showValue: true,
  animateOnChange: false,
  useColorTransition: true,
  colorConfig: {
    colorStops: [
      { position: 0, color: '#cc4d1b' },
      { position: 100, color: '#a2ff92' }
    ],
    interpolation: { type: 'linear' }
  },
  styling: {
    fontSize: '32px',
    fontWeight: 'bold',
    iconFontSize: '32px',
    iconMargin: '8px',
    animationDuration: 600,
    pulseScale: 1.2
  }
};


// Note: Persistence is now handled by Redux store
