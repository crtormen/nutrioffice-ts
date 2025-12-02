import { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuth } from "@/infra/firebase";
import { useFetchThemeQuery } from "@/app/state/features/themeSlice";
import { ThemeConfig, DEFAULT_THEME, FONT_PRESETS } from "@/domain/entities";

interface AppThemeContextType {
  theme: ThemeConfig;
  isLoading: boolean;
}

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined);

/**
 * Apply theme configuration to the document
 */
const applyTheme = (theme: ThemeConfig) => {
  const root = document.documentElement;

  // Apply color preset
  root.setAttribute("data-theme", theme.colorPreset);

  // Apply border radius
  root.style.setProperty("--radius", `${theme.radius}rem`);

  // Apply font family
  const fontPreset = FONT_PRESETS[theme.font];
  const fontFamily = fontPreset?.fontFamily || FONT_PRESETS.default.fontFamily;
  root.style.setProperty("--font-sans", fontFamily);

  // Apply theme mode (light/dark/system)
  root.classList.remove("light", "dark");
  if (theme.mode === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "dark" : "light");
  } else {
    root.classList.add(theme.mode);
  }

  // Apply brand name to document title
  if (theme.brandName) {
    document.title = theme.brandName;
  }

  // Apply custom CSS if provided
  let customStyleElement = document.getElementById("custom-theme-css");
  if (theme.customCSS) {
    if (!customStyleElement) {
      customStyleElement = document.createElement("style");
      customStyleElement.id = "custom-theme-css";
      document.head.appendChild(customStyleElement);
    }
    customStyleElement.textContent = theme.customCSS;
  } else if (customStyleElement) {
    customStyleElement.remove();
  }
};

interface AppThemeProviderProps {
  children: ReactNode;
}

export const AppThemeProvider = ({ children }: AppThemeProviderProps) => {
  const { dbUid } = useAuth();
  const { data: theme, isLoading } = useFetchThemeQuery(dbUid || "", {
    skip: !dbUid,
  });

  const currentTheme = theme || DEFAULT_THEME;

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Listen for system theme changes when mode is "system"
  useEffect(() => {
    if (currentTheme.mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme(currentTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [currentTheme]);

  return (
    <AppThemeContext.Provider value={{ theme: currentTheme, isLoading }}>
      {children}
    </AppThemeContext.Provider>
  );
};

/**
 * Hook to access current theme configuration
 */
export const useAppTheme = () => {
  const context = useContext(AppThemeContext);
  if (context === undefined) {
    throw new Error("useAppTheme must be used within an AppThemeProvider");
  }
  return context;
};
