import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Palette,
  Type,
  Radius,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  Save,
  Info,
  Image as ImageIcon,
} from "lucide-react";

import {
  useFetchThemeQuery,
  useUpdateThemeMutation,
  useResetThemeMutation,
} from "@/app/state/features/themeSlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ColorPreset,
  RadiusPreset,
  FontPreset,
  ThemeMode,
  COLOR_PRESETS,
  RADIUS_PRESETS,
  FONT_PRESETS,
  THEME_MODES,
  ThemeConfig,
  DEFAULT_THEME,
} from "@/domain/entities";
import { useAuth } from "@/infra/firebase";
import { cn } from "@/lib/utils";

const ThemeSettingsTab = () => {
  const { dbUid } = useAuth();
  const { data: fetchedTheme, isLoading } = useFetchThemeQuery(dbUid || "", {
    skip: !dbUid,
  });
  const [updateTheme, { isLoading: isUpdating }] = useUpdateThemeMutation();
  const [resetTheme, { isLoading: isResetting }] = useResetThemeMutation();

  const [localTheme, setLocalTheme] = useState<ThemeConfig>(DEFAULT_THEME);

  useEffect(() => {
    if (fetchedTheme) {
      setLocalTheme(fetchedTheme);
    }
  }, [fetchedTheme]);

  const hasChanges =
    JSON.stringify(localTheme) !== JSON.stringify(fetchedTheme);

  const handleSave = async () => {
    if (!dbUid) return;

    try {
      await updateTheme({ uid: dbUid, theme: localTheme }).unwrap();
      toast.success("Tema atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar tema", {
        description: error.message || "Tente novamente mais tarde.",
      });
    }
  };

  const handleReset = async () => {
    if (!dbUid) return;

    try {
      await resetTheme(dbUid).unwrap();
      setLocalTheme(DEFAULT_THEME);
      toast.success("Tema restaurado para o padrão!");
    } catch (error: any) {
      toast.error("Erro ao restaurar tema", {
        description: error.message || "Tente novamente mais tarde.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save/Reset Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Aparência</h2>
          <p className="text-muted-foreground">
            Personalize a aparência do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting || isUpdating}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar Padrão
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isUpdating}
          >
            <Save className="mr-2 h-4 w-4" />
            {isUpdating ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Você tem alterações não salvas. Clique em "Salvar Alterações" para
            aplicar.
          </AlertDescription>
        </Alert>
      )}

      {/* Color Theme Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Cor do Tema
          </CardTitle>
          <CardDescription>
            Escolha a paleta de cores principal do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {Object.entries(COLOR_PRESETS).map(([key, { name, primary }]) => (
              <button
                key={key}
                onClick={() =>
                  setLocalTheme({
                    ...localTheme,
                    colorPreset: key as ColorPreset,
                  })
                }
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all hover:scale-105",
                  localTheme.colorPreset === key
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-muted hover:border-muted-foreground/50"
                )}
              >
                <div
                  className="h-12 w-12 rounded-full shadow-md"
                  style={{ backgroundColor: primary }}
                />
                <span className="text-xs font-medium text-center">{name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Border Radius Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radius className="h-5 w-5" />
            Arredondamento
          </CardTitle>
          <CardDescription>
            Defina o arredondamento dos cantos dos elementos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={localTheme.radius}
            onValueChange={(value) =>
              setLocalTheme({ ...localTheme, radius: value as RadiusPreset })
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(RADIUS_PRESETS).map(([key, { name, example }]) => (
                <div key={key} className="flex items-center space-x-3 space-y-0">
                  <RadioGroupItem value={key} id={`radius-${key}`} />
                  <Label
                    htmlFor={`radius-${key}`}
                    className="flex flex-1 cursor-pointer flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{name}</span>
                      <div
                        className="h-8 w-16 border-2 border-primary bg-primary/10"
                        style={{ borderRadius: `${key}rem` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {example}
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Font Family Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Tipografia
          </CardTitle>
          <CardDescription>
            Escolha a fonte utilizada no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={localTheme.font}
            onValueChange={(value) =>
              setLocalTheme({ ...localTheme, font: value as FontPreset })
            }
          >
            <div className="grid gap-3">
              {Object.entries(FONT_PRESETS).map(([key, { name, fontFamily }]) => (
                <div key={key} className="flex items-center space-x-3 space-y-0">
                  <RadioGroupItem value={key} id={`font-${key}`} />
                  <Label
                    htmlFor={`font-${key}`}
                    className="flex flex-1 cursor-pointer items-center justify-between"
                  >
                    <span className="font-medium">{name}</span>
                    <span
                      className="text-sm text-muted-foreground"
                      style={{ fontFamily }}
                    >
                      O rato roeu a roupa do rei
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Theme Mode Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Modo do Tema
          </CardTitle>
          <CardDescription>
            Preferência de tema claro ou escuro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={localTheme.mode}
            onValueChange={(value) =>
              setLocalTheme({ ...localTheme, mode: value as ThemeMode })
            }
          >
            <div className="grid gap-3">
              {Object.entries(THEME_MODES).map(([key, { name, description }]) => {
                const Icon =
                  key === "light" ? Sun : key === "dark" ? Moon : Monitor;
                return (
                  <div key={key} className="flex items-center space-x-3 space-y-0">
                    <RadioGroupItem value={key} id={`mode-${key}`} />
                    <Label
                      htmlFor={`mode-${key}`}
                      className="flex flex-1 cursor-pointer items-center gap-3"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-sm text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Branding Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Identidade Visual
          </CardTitle>
          <CardDescription>
            Personalize a logo e o nome da marca (em breve)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Nome da Marca</Label>
              <Input
                id="brandName"
                placeholder="NutriOffice"
                value={localTheme.brandName || ""}
                onChange={(e) =>
                  setLocalTheme({ ...localTheme, brandName: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Este nome aparecerá no título da página e em alguns lugares do
                sistema
              </p>
            </div>

            <Separator />

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Upload de logo personalizada será disponibilizado em breve.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Bottom) */}
      {hasChanges && (
        <div className="flex justify-end gap-2 rounded-lg border bg-muted/30 p-4">
          <Button variant="outline" onClick={() => setLocalTheme(fetchedTheme!)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            <Save className="mr-2 h-4 w-4" />
            {isUpdating ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ThemeSettingsTab;
