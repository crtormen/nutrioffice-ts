import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import {
  Image as ImageIcon,
  Info,
  Loader2,
  Monitor,
  Moon,
  Palette,
  Radius,
  RotateCcw,
  Save,
  Sun,
  Type,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  useFetchThemeQuery,
  useResetThemeMutation,
  useUpdateThemeMutation,
} from "@/app/state/features/themeSlice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  COLOR_PRESETS,
  ColorPreset,
  DEFAULT_THEME,
  FONT_PRESETS,
  FontPreset,
  RADIUS_PRESETS,
  RadiusPreset,
  THEME_MODES,
  ThemeConfig,
  ThemeMode,
} from "@/domain/entities";
import { useAuth } from "@/infra/firebase";
import { storage } from "@/infra/firebase/firebaseConfig";
import { cn } from "@/lib/utils";

const ThemeSettingsTab = () => {
  const { dbUid } = useAuth();
  const { data: fetchedTheme, isLoading } = useFetchThemeQuery(dbUid || "", {
    skip: !dbUid,
  });
  const [updateTheme, { isLoading: isUpdating }] = useUpdateThemeMutation();
  const [resetTheme, { isLoading: isResetting }] = useResetThemeMutation();

  const [localTheme, setLocalTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Tente novamente mais tarde.";
      toast.error("Erro ao atualizar tema", {
        description: errorMessage,
      });
    }
  };

  const handleReset = async () => {
    if (!dbUid) return;

    try {
      await resetTheme(dbUid).unwrap();
      setLocalTheme(DEFAULT_THEME);
      toast.success("Tema restaurado para o padrão!");
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Tente novamente mais tarde.";
      toast.error("Erro ao restaurar tema", {
        description: errorMessage,
      });
    }
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !dbUid) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande", {
        description: "O tamanho máximo é 2MB",
      });
      return;
    }

    setUploadingLogo(true);

    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `logos/${dbUid}/brand-logo`);
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Get image dimensions
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Update local theme
      setLocalTheme({
        ...localTheme,
        logo: {
          url: downloadURL,
          width: img.width,
          height: img.height,
        },
      });

      toast.success("Logo carregada com sucesso!");
    } catch (error: unknown) {
      console.error("Error uploading logo:", error);
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Tente novamente mais tarde.";
      toast.error("Erro ao fazer upload da logo", {
        description: errorMessage,
      });
    } finally {
      setUploadingLogo(false);
      // Reset file input
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!dbUid) return;

    try {
      // Delete from Storage if logo exists
      if (localTheme.logo?.url) {
        const storageRef = ref(storage, `logos/${dbUid}/brand-logo`);
        await deleteObject(storageRef).catch(() => {
          // Ignore if file doesn't exist
        });
      }

      // Remove from local theme
      setLocalTheme({
        ...localTheme,
        logo: undefined,
      });

      toast.success("Logo removida com sucesso!");
    } catch (error: unknown) {
      console.error("Error removing logo:", error);
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Tente novamente mais tarde.";
      toast.error("Erro ao remover logo", {
        description: errorMessage,
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
            Você tem alterações não salvas. Clique em &quot;Salvar
            Alterações&quot; para aplicar.
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
                    : "border-muted hover:border-muted-foreground/50",
                )}
              >
                <div
                  className="h-12 w-12 rounded-full shadow-md"
                  style={{ backgroundColor: primary }}
                />
                <span className="text-center text-xs font-medium">{name}</span>
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
              {Object.entries(RADIUS_PRESETS).map(
                ([key, { name, example }]) => (
                  <div
                    key={key}
                    className="flex items-center space-x-3 space-y-0"
                  >
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
                ),
              )}
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
              {Object.entries(FONT_PRESETS).map(
                ([key, { name, fontFamily }]) => (
                  <div
                    key={key}
                    className="flex items-center space-x-3 space-y-0"
                  >
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
                ),
              )}
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
          <CardDescription>Preferência de tema claro ou escuro</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={localTheme.mode}
            onValueChange={(value) =>
              setLocalTheme({ ...localTheme, mode: value as ThemeMode })
            }
          >
            <div className="grid gap-3">
              {Object.entries(THEME_MODES).map(
                ([key, { name, description }]) => {
                  const Icon =
                    key === "light" ? Sun : key === "dark" ? Moon : Monitor;
                  return (
                    <div
                      key={key}
                      className="flex items-center space-x-3 space-y-0"
                    >
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
                },
              )}
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

            {/* Logo Upload Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Logo da Marca</Label>
                <p className="text-xs text-muted-foreground">
                  Faça upload de uma logo personalizada (PNG, JPG ou SVG, máx.
                  2MB)
                </p>
              </div>

              {/* Logo Preview */}
              {localTheme.logo?.url && (
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex-shrink-0">
                    <img
                      src={localTheme.logo.url}
                      alt="Logo da marca"
                      className="h-16 w-auto max-w-[200px] object-contain"
                    />
                  </div>
                  <div className="flex-1 text-sm text-muted-foreground">
                    <p>
                      Dimensões: {localTheme.logo.width} ×{" "}
                      {localTheme.logo.height}px
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {localTheme.logo ? "Alterar Logo" : "Fazer Upload"}
                    </>
                  )}
                </Button>
                {localTheme.logo && (
                  <Button variant="ghost" onClick={handleRemoveLogo}>
                    Remover Logo
                  </Button>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  A logo será exibida no cabeçalho do sistema e em documentos
                  gerados.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Bottom) */}
      {hasChanges && (
        <div className="flex justify-end gap-2 rounded-lg border bg-muted/30 p-4">
          <Button
            variant="outline"
            onClick={() => setLocalTheme(fetchedTheme!)}
          >
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
