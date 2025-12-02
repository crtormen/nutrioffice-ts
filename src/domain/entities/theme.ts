/**
 * Theme Settings Entities
 * Defines customizable theme and appearance settings
 */

// Color presets
export const colorPresets = [
  "zinc", // Default
  "slate",
  "stone",
  "gray",
  "neutral",
  "red",
  "rose",
  "orange",
  "green",
  "blue",
  "yellow",
  "violet",
] as const;

export type ColorPreset = (typeof colorPresets)[number];

// Radius presets (for border-radius)
export const radiusPresets = [
  "0",    // Sharp
  "0.3",  // Minimal
  "0.5",  // Default
  "0.75", // Rounded
  "1.0",  // Very Rounded
] as const;

export type RadiusPreset = (typeof radiusPresets)[number];

// Font presets
export const fontPresets = [
  "default", // System font
  "inter",
  "roboto",
  "open-sans",
  "lato",
  "montserrat",
  "poppins",
] as const;

export type FontPreset = (typeof fontPresets)[number];

// Theme mode
export const themeModes = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof themeModes)[number];

// Color preset labels
export const COLOR_PRESETS: Record<ColorPreset, { name: string; primary: string }> = {
  zinc: { name: "Zinco", primary: "#18181b" },
  slate: { name: "Ardósia", primary: "#0f172a" },
  stone: { name: "Pedra", primary: "#1c1917" },
  gray: { name: "Cinza", primary: "#111827" },
  neutral: { name: "Neutro", primary: "#171717" },
  red: { name: "Vermelho", primary: "#dc2626" },
  rose: { name: "Rosa", primary: "#e11d48" },
  orange: { name: "Laranja", primary: "#ea580c" },
  green: { name: "Verde", primary: "#16a34a" },
  blue: { name: "Azul", primary: "#2563eb" },
  yellow: { name: "Amarelo", primary: "#ca8a04" },
  violet: { name: "Violeta", primary: "#7c3aed" },
};

// Radius preset labels
export const RADIUS_PRESETS: Record<RadiusPreset, { name: string; example: string }> = {
  "0": { name: "Pontiagudo", example: "border-radius: 0" },
  "0.3": { name: "Sutil", example: "border-radius: 0.3rem" },
  "0.5": { name: "Padrão", example: "border-radius: 0.5rem" },
  "0.75": { name: "Arredondado", example: "border-radius: 0.75rem" },
  "1.0": { name: "Muito Arredondado", example: "border-radius: 1rem" },
};

// Font preset labels
export const FONT_PRESETS: Record<FontPreset, { name: string; fontFamily: string }> = {
  default: { name: "Padrão do Sistema", fontFamily: "system-ui, sans-serif" },
  inter: { name: "Inter", fontFamily: "'Inter', sans-serif" },
  roboto: { name: "Roboto", fontFamily: "'Roboto', sans-serif" },
  "open-sans": { name: "Open Sans", fontFamily: "'Open Sans', sans-serif" },
  lato: { name: "Lato", fontFamily: "'Lato', sans-serif" },
  montserrat: { name: "Montserrat", fontFamily: "'Montserrat', sans-serif" },
  poppins: { name: "Poppins", fontFamily: "'Poppins', sans-serif" },
};

// Theme mode labels
export const THEME_MODES: Record<ThemeMode, { name: string; description: string }> = {
  light: { name: "Claro", description: "Tema claro" },
  dark: { name: "Escuro", description: "Tema escuro" },
  system: {
    name: "Sistema",
    description: "Seguir preferência do sistema",
  },
};

/**
 * Theme configuration
 */
export interface ThemeConfig {
  // Color settings
  colorPreset: ColorPreset;

  // Border radius
  radius: RadiusPreset;

  // Font family
  font: FontPreset;

  // Theme mode (light/dark/system)
  mode: ThemeMode;

  // Logo settings
  logo?: {
    url?: string;
    width?: number;
    height?: number;
  };

  // Favicon
  favicon?: string;

  // Brand name
  brandName?: string;

  // Custom CSS (advanced users)
  customCSS?: string;

  // Updated timestamp
  updatedAt?: string;
}

/**
 * Default theme configuration
 */
export const DEFAULT_THEME: ThemeConfig = {
  colorPreset: "zinc",
  radius: "0.5",
  font: "default",
  mode: "light",
  brandName: "NutriOffice",
};

/**
 * Firestore interface with Timestamp
 */
export interface ThemeConfigFirebase extends Omit<ThemeConfig, "updatedAt"> {
  updatedAt?: any; // Firestore Timestamp
}
