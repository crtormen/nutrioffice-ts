# Theme Settings Implementation Plan

## ✅ Completed

1. **Improved UserProfileTab** - Modern, elegant design with:
   - Hero card with gradient header
   - Large avatar with hover upload button
   - Separate cards for Bio, Contact Info, and Professional Info
   - Clickable fields (phone, email, whatsapp, website)
   - Icons for visual appeal
   - Better responsive layout

2. **Theme Entities** - Created `src/domain/entities/theme.ts` with:
   - Color presets (12 options: zinc, slate, stone, gray, neutral, red, rose, orange, green, blue, yellow, violet)
   - Radius presets (5 levels of border-radius)
   - Font presets (7 font families)
   - Theme modes (light, dark, system)
   - Logo and brand name settings
   - Custom CSS support

## 🚧 To Implement

### 1. Theme Service (`src/app/services/ThemeService.ts`)

```typescript
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/infra/firebase/firebaseConfig";
import { ThemeConfig, DEFAULT_THEME } from "@/domain/entities";

export const ThemeService = (uid: string | undefined) => {
  if (!uid) return null;

  const themeDocRef = doc(db, `users/${uid}/settings/theme`);

  return {
    get: async (): Promise<ThemeConfig> => {
      const docSnap = await getDoc(themeDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          updatedAt: data.updatedAt?.toDate().toISOString(),
        } as ThemeConfig;
      }
      return DEFAULT_THEME;
    },

    update: async (theme: Partial<ThemeConfig>): Promise<void> => {
      await setDoc(
        themeDocRef,
        {
          ...theme,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },

    reset: async (): Promise<void> => {
      await setDoc(themeDocRef, {
        ...DEFAULT_THEME,
        updatedAt: serverTimestamp(),
      });
    },
  };
};
```

### 2. Theme Slice (`src/app/state/features/themeSlice.ts`)

```typescript
import { firestoreApi } from "../firestoreApi";
import { ThemeService } from "@/app/services/ThemeService";
import { ThemeConfig } from "@/domain/entities";

export const themeSlice = firestoreApi
  .enhanceEndpoints({ addTagTypes: ["Theme"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchTheme: builder.query<ThemeConfig, string>({
        providesTags: ["Theme"],
        queryFn: async (uid) => {
          const service = ThemeService(uid);
          if (!service) return { error: "Service not available" };
          const theme = await service.get();
          return { data: theme };
        },
      }),

      updateTheme: builder.mutation<void, { uid: string; theme: Partial<ThemeConfig> }>({
        invalidatesTags: ["Theme"],
        queryFn: async ({ uid, theme }) => {
          const service = ThemeService(uid);
          if (!service) return { error: "Service not available" };
          await service.update(theme);
          return { data: undefined };
        },
      }),

      resetTheme: builder.mutation<void, string>({
        invalidatesTags: ["Theme"],
        queryFn: async (uid) => {
          const service = ThemeService(uid);
          if (!service) return { error: "Service not available" };
          await service.reset();
          return { data: undefined };
        },
      }),
    }),
  });

export const {
  useFetchThemeQuery,
  useUpdateThemeMutation,
  useResetThemeMutation,
} = themeSlice;
```

### 3. Theme Settings Tab (`src/pages/user/ThemeSettingsTab.tsx`)

Create a comprehensive UI with:

**Sections:**
1. **Color Theme** - Grid of color swatches to select
2. **Border Radius** - Slider or preset buttons
3. **Font Family** - Dropdown or radio buttons
4. **Theme Mode** - Light/Dark/System toggle
5. **Branding** - Logo upload, brand name input
6. **Advanced** - Custom CSS textarea (for power users)

**Features:**
- Real-time preview
- Reset to defaults button
- Save button
- Visual examples of each setting

**Example Structure:**
```tsx
import { useState } from "react";
import { useFetchThemeQuery, useUpdateThemeMutation } from "@/app/state/features/themeSlice";
import { COLOR_PRESETS, RADIUS_PRESETS, FONT_PRESETS, THEME_MODES } from "@/domain/entities";
// ... other imports

const ThemeSettingsTab = () => {
  const { dbUid } = useAuth();
  const { data: theme } = useFetchThemeQuery(dbUid || "", { skip: !dbUid });
  const [updateTheme, { isLoading }] = useUpdateThemeMutation();

  const [localTheme, setLocalTheme] = useState(theme);

  const handleSave = async () => {
    await updateTheme({ uid: dbUid, theme: localTheme }).unwrap();
    toast.success("Tema atualizado!");
  };

  return (
    <div className="space-y-6">
      {/* Color Preset Section */}
      <Card>
        <CardHeader>
          <CardTitle>Cor do Tema</CardTitle>
          <CardDescription>
            Escolha a paleta de cores principal do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {Object.entries(COLOR_PRESETS).map(([key, { name, primary }]) => (
              <button
                key={key}
                onClick={() => setLocalTheme({ ...localTheme, colorPreset: key })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all hover:scale-105",
                  localTheme?.colorPreset === key
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent"
                )}
              >
                <div
                  className="h-10 w-10 rounded-full"
                  style={{ backgroundColor: primary }}
                />
                <span className="text-xs font-medium">{name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Radius Section */}
      <Card>
        <CardHeader>
          <CardTitle>Arredondamento</CardTitle>
          <CardDescription>
            Defina o arredondamento dos cantos dos elementos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Radius preset buttons or slider */}
        </CardContent>
      </Card>

      {/* Font Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tipografia</CardTitle>
          <CardDescription>Escolha a fonte do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Font family selector */}
        </CardContent>
      </Card>

      {/* Theme Mode Section */}
      <Card>
        <CardHeader>
          <CardTitle>Modo do Tema</CardTitle>
          <CardDescription>Preferência de tema claro/escuro</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={localTheme?.mode} onValueChange={(value) => setLocalTheme({ ...localTheme, mode: value })}>
            {Object.entries(THEME_MODES).map(([key, { name, description }]) => (
              <div key={key} className="flex items-center space-x-2">
                <RadioGroupItem value={key} id={key} />
                <Label htmlFor={key}>
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Logo and Branding Section */}
      <Card>
        <CardHeader>
          <CardTitle>Identidade Visual</CardTitle>
          <CardDescription>
            Personalize a logo e o nome da marca
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Logo upload, brand name input */}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleReset}>
          Restaurar Padrão
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
};
```

### 4. Theme Context (`src/contexts/ThemeContext.tsx`)

```typescript
import { createContext, useContext, useEffect, useState } from "react";
import { useFetchThemeQuery } from "@/app/state/features/themeSlice";
import { ThemeConfig, DEFAULT_THEME } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

interface ThemeContextValue {
  theme: ThemeConfig;
  applyTheme: (theme: ThemeConfig) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { dbUid } = useAuth();
  const { data: fetchedTheme } = useFetchThemeQuery(dbUid || "", { skip: !dbUid });
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);

  useEffect(() => {
    if (fetchedTheme) {
      setTheme(fetchedTheme);
      applyTheme(fetchedTheme);
    }
  }, [fetchedTheme]);

  const applyTheme = (newTheme: ThemeConfig) => {
    const root = document.documentElement;

    // Apply color preset
    root.setAttribute("data-color", newTheme.colorPreset);

    // Apply radius
    root.style.setProperty("--radius", `${newTheme.radius}rem`);

    // Apply font
    if (newTheme.font !== "default") {
      root.style.setProperty("font-family", FONT_PRESETS[newTheme.font].fontFamily);
    }

    // Apply theme mode
    if (newTheme.mode === "dark") {
      root.classList.add("dark");
    } else if (newTheme.mode === "light") {
      root.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }

    // Apply custom CSS
    if (newTheme.customCSS) {
      let customStyleEl = document.getElementById("custom-theme-styles");
      if (!customStyleEl) {
        customStyleEl = document.createElement("style");
        customStyleEl.id = "custom-theme-styles";
        document.head.appendChild(customStyleEl);
      }
      customStyleEl.textContent = newTheme.customCSS;
    }

    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
```

### 5. Integration

**Add ThemeProvider to your app:**
```tsx
// In your root App.tsx or index.tsx
import { ThemeProvider } from "@/contexts/ThemeContext";

<ThemeProvider>
  <YourApp />
</ThemeProvider>
```

**CSS Variables Setup** (in your global CSS):
```css
:root {
  /* Default theme */
  --radius: 0.5rem;
}

/* Color preset data attributes */
[data-color="red"] {
  --primary: 0 72.2% 50.6%;
  --primary-foreground: 0 0% 100%;
  /* ... other color tokens */
}

[data-color="blue"] {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}

/* Add for all color presets */
```

**Google Fonts Integration** (in index.html):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;600;700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
```

## 🎨 Features Summary

**Color Themes:**
- 12 color presets
- Custom primary color
- Light/dark mode support

**Typography:**
- 7 font options
- Web font loading
- System font fallback

**Layout:**
- 5 border-radius presets
- Consistent spacing

**Branding:**
- Custom logo upload
- Brand name customization
- Favicon support

**Advanced:**
- Custom CSS injection
- Real-time preview
- Reset to defaults

## 🔄 User Flow

1. **Navigate to Settings → Aparência**
2. **Select color preset** from visual grid
3. **Choose border radius** with slider/buttons
4. **Pick font family** from dropdown
5. **Set theme mode** (light/dark/system)
6. **Upload logo** (optional)
7. **Set brand name** (optional)
8. **Add custom CSS** (power users)
9. **Preview changes** in real-time
10. **Save** to apply across all sessions

## 📝 Next Steps

1. Create ThemeService.ts
2. Create themeSlice.ts
3. Build ThemeSettingsTab.tsx UI
4. Create ThemeContext and hooks
5. Add ThemeProvider to app root
6. Set up CSS variables for color presets
7. Add Google Fonts link
8. Test theme persistence
9. Test with different users

## 🎯 Enhancement Ideas

- **Color Picker** - Custom color selection (beyond presets)
- **Font Size** - Adjustable base font size
- **Compact Mode** - Tighter spacing option
- **Sidebar Position** - Left/right toggle
- **Export/Import** - Theme configuration files
- **Theme Templates** - Pre-built professional themes
- **Preview Mode** - See changes before saving
- **Accessibility** - High contrast mode, reduced motion

This gives you complete control over your application's appearance!
