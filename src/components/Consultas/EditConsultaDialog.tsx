import { Edit, FileText, Loader2, Paperclip, Trash2, UploadCloud, X } from "lucide-react";
import { BodyCompositionCalculator } from "@/components/Results/BodyCompositionCalculator";
import React, { useCallback, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { useUpdateCustomerConsultaMutation } from "@/app/state/features/customerConsultasSlice";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  FOLDS,
  IAttachment,
  ICustomerConsulta,
  IFolds,
  IImages,
  ImageOptions,
  IMeal,
  IMeasures,
  IResults,
  IStructure,
  MEASURES,
  RESULTS,
} from "@/domain/entities/consulta";
import { useStorage } from "@/infra/firebase/hooks/useStorage";
import { useAuth } from "@/infra/firebase/hooks/useAuth";
import imageCompression from "browser-image-compression";

interface EditConsultaDialogProps {
  consulta: ICustomerConsulta;
  customerGender?: "H" | "M";
}

const PHOTO_SLOTS: { key: ImageOptions; label: string }[] = [
  { key: "img_frente", label: "Frente" },
  { key: "img_costas", label: "Costas" },
  { key: "img_lado", label: "Lado" },
];

const FILE_ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const FILE_ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";
const MAX_FILE_MB = 10;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const EditConsultaDialog: React.FC<EditConsultaDialogProps> = ({
  consulta,
  customerGender,
}) => {
  const [open, setOpen] = useState(false);
  const { dbUid } = useAuth();
  const { customerId } = useParams<{ customerId: string }>();
  const [updateConsulta, { isLoading }] = useUpdateCustomerConsultaMutation();
  const { storeFn, deleteFn } = useStorage();

  // Form state
  const [formData, setFormData] = useState<{
    peso: string | number;
    idade: string | number;
    date: string;
    updateCredits: boolean;
    obs: string;
    notes: string[];
    dobras: IFolds;
    medidas: IMeasures;
    results: IResults;
    structure: IStructure;
    meals: IMeal[];
    online: boolean;
    images: IImages;
    anexos: IAttachment[];
  }>({
    peso: consulta.peso || "",
    idade: consulta.idade || "",
    date: consulta.date || "",
    updateCredits: consulta.updateCredits ?? true,
    obs: consulta.obs || "",
    notes: consulta.notes || [],
    dobras: consulta.dobras || {},
    medidas: consulta.medidas || {},
    results: consulta.results || {
      dobras: 0,
      fat: 0,
      mg: 0,
      mm: 0,
      mo: 0,
      mr: 0,
    },
    structure: consulta.structure || { altura: 0, joelho: 0, punho: 0 },
    meals: consulta.meals || [],
    online: consulta.online || false,
    images: consulta.images || ({} as IImages),
    anexos: consulta.anexos || [],
  });

  const [newNote, setNewNote] = useState("");
  const [newMeal, setNewMeal] = useState({ time: "", description: "" });

  // Photo upload state: tracks upload progress per slot
  const [photoProgress, setPhotoProgress] = useState<Partial<Record<ImageOptions, number>>>({});

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileUploading, setFileUploading] = useState<Record<string, number>>({});
  const [fileDragOver, setFileDragOver] = useState(false);

  const handleSave = async () => {
    try {
      await updateConsulta({
        uid: dbUid!,
        customerId: customerId!,
        consulta: {
          ...consulta,
          peso: String(formData.peso),
          idade: formData.idade ? Number(formData.idade) : undefined,
          date: formData.date,
          updateCredits: formData.updateCredits,
          obs: formData.obs,
          notes: formData.notes,
          dobras: formData.dobras,
          medidas: formData.medidas,
          results: formData.results,
          structure: formData.structure,
          meals: formData.meals,
          online: formData.online,
          images: formData.images,
          anexos: formData.anexos,
        },
      }).unwrap();
      setOpen(false);
    } catch (error) {
      console.error("Failed to update consulta:", error);
    }
  };

  const addNote = () => {
    if (newNote.trim()) {
      setFormData({ ...formData, notes: [...formData.notes, newNote.trim()] });
      setNewNote("");
    }
  };

  const removeNote = (index: number) => {
    setFormData({
      ...formData,
      notes: formData.notes.filter((_, i) => i !== index),
    });
  };

  const addMeal = () => {
    if (newMeal.time && newMeal.description) {
      setFormData({
        ...formData,
        meals: [
          ...formData.meals,
          { time: newMeal.time, description: newMeal.description },
        ],
      });
      setNewMeal({ time: "", description: "" });
    }
  };

  const removeMeal = (index: number) => {
    setFormData({
      ...formData,
      meals: formData.meals.filter((_, i) => i !== index),
    });
  };

  // --- Photo handlers ---

  const handlePhotoUpload = useCallback(
    async (slot: ImageOptions, file: File) => {
      // Compress before upload
      let compressed = file;
      try {
        compressed = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/jpeg",
        });
      } catch {
        // Use original if compression fails
      }

      setPhotoProgress((prev) => ({ ...prev, [slot]: 0 }));
      const task = storeFn(compressed, "image");

      task.on(
        "state_changed",
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          setPhotoProgress((prev) => ({ ...prev, [slot]: pct }));
        },
        (error) => {
          console.error("Photo upload error:", error);
          toast.error("Falha ao enviar foto.");
          setPhotoProgress((prev) => {
            const next = { ...prev };
            delete next[slot];
            return next;
          });
        },
        async () => {
          try {
            const { getDownloadURL } = await import("firebase/storage");
            const url = await getDownloadURL(task.snapshot.ref);
            const attachment: IAttachment = { url, path: task.snapshot.metadata.fullPath };
            setFormData((prev) => ({
              ...prev,
              images: { ...prev.images, [slot]: attachment },
            }));
            toast.success("Foto enviada com sucesso!");
          } catch {
            toast.error("Falha ao obter URL da foto.");
          } finally {
            setPhotoProgress((prev) => {
              const next = { ...prev };
              delete next[slot];
              return next;
            });
          }
        },
      );
    },
    [storeFn],
  );

  const handlePhotoDelete = useCallback(
    async (slot: ImageOptions) => {
      const current = formData.images[slot];
      if (current?.path) {
        try {
          const pathParts = current.path.split("/");
          const filename = pathParts[pathParts.length - 1];
          await deleteFn(filename, "image");
        } catch {
          // Ignore — may already be deleted
        }
      }
      setFormData((prev) => {
        const next = { ...prev.images };
        delete (next as any)[slot];
        return { ...prev, images: next as IImages };
      });
    },
    [formData.images, deleteFn],
  );

  // --- File attachment handlers ---

  const processFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        if (!FILE_ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`Tipo não permitido: ${file.name}. Use PDF, imagem, DOC ou DOCX.`);
          continue;
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
          toast.error(`${file.name} excede ${MAX_FILE_MB} MB.`);
          continue;
        }

        const tempKey = `${file.name}-${Date.now()}`;
        setFileUploading((prev) => ({ ...prev, [tempKey]: 0 }));

        const task = storeFn(file, "file");

        task.on(
          "state_changed",
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            setFileUploading((prev) => ({ ...prev, [tempKey]: pct }));
          },
          (error) => {
            console.error("File upload error:", error);
            toast.error(`Erro ao enviar ${file.name}`);
            setFileUploading((prev) => {
              const next = { ...prev };
              delete next[tempKey];
              return next;
            });
          },
          async () => {
            try {
              const { getDownloadURL } = await import("firebase/storage");
              const url = await getDownloadURL(task.snapshot.ref);
              const entry: IAttachment = { url, path: task.snapshot.metadata.fullPath };
              setFormData((prev) => ({
                ...prev,
                anexos: [...(prev.anexos || []), entry],
              }));
              toast.success(`${file.name} enviado com sucesso!`);
            } catch {
              toast.error(`Erro ao finalizar envio de ${file.name}`);
            } finally {
              setFileUploading((prev) => {
                const next = { ...prev };
                delete next[tempKey];
                return next;
              });
            }
          },
        );
      }
    },
    [storeFn],
  );

  const handleFileRemove = useCallback(
    async (attachment: IAttachment) => {
      if (attachment.path) {
        try {
          const pathParts = attachment.path.split("/");
          const filename = pathParts[pathParts.length - 1];
          await deleteFn(filename, "file");
        } catch {
          // Ignore
        }
      }
      setFormData((prev) => ({
        ...prev,
        anexos: (prev.anexos || []).filter((a) => a.path !== attachment.path),
      }));
    },
    [deleteFn],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Editar Consulta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Dados da Consulta</DialogTitle>
          <DialogDescription>
            Atualize os dados da consulta. As alterações serão salvas
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="evaluation" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="evaluation">Avaliação</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
            <TabsTrigger value="meals">Alimentação</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
            <TabsTrigger value="files">Arquivos</TabsTrigger>
          </TabsList>

          {/* Evaluation Tab */}
          <TabsContent value="evaluation" className="mt-4 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Informações Básicas</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data da Consulta</Label>
                  <Input
                    id="date"
                    type="text"
                    placeholder="dd/MM/yyyy"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="peso">Peso (kg)</Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) =>
                      setFormData({ ...formData, peso: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idade">Idade</Label>
                  <Input
                    id="idade"
                    type="number"
                    value={formData.idade}
                    onChange={(e) =>
                      setFormData({ ...formData, idade: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="updateCredits" className="cursor-pointer">
                  Atualizar Créditos
                </Label>
                <Switch
                  id="updateCredits"
                  checked={formData.updateCredits}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, updateCredits: checked })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="online"
                  checked={formData.online}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, online: checked as boolean })
                  }
                />
                <Label
                  htmlFor="online"
                  className="cursor-pointer text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Consulta Online (sem avaliação de composição corporal)
                </Label>
              </div>
            </div>

            {/* Structure */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Estrutura</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="altura">Altura (cm)</Label>
                  <Input
                    id="altura"
                    type="number"
                    step="0.1"
                    value={formData.structure.altura || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        structure: {
                          ...formData.structure,
                          altura: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="punho">Punho (cm)</Label>
                  <Input
                    id="punho"
                    type="number"
                    step="0.1"
                    value={formData.structure.punho || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        structure: {
                          ...formData.structure,
                          punho: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joelho">Joelho (cm)</Label>
                  <Input
                    id="joelho"
                    type="number"
                    step="0.1"
                    value={formData.structure.joelho || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        structure: {
                          ...formData.structure,
                          joelho: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Dobras */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Dobras Cutâneas (mm)</h4>
              <div className="grid grid-cols-2 gap-4">
                {FOLDS.map((fold) => (
                  <div key={fold.value} className="space-y-2">
                    <Label htmlFor={fold.value}>{fold.label}</Label>
                    <Input
                      id={fold.value}
                      type="number"
                      step="0.1"
                      value={(formData.dobras as any)[fold.value] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dobras: {
                            ...formData.dobras,
                            [fold.value]: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Medidas */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Circunferências (cm)</h4>
              <div className="grid grid-cols-2 gap-4">
                {MEASURES.map((measure) => (
                  <div key={measure.value} className="space-y-2">
                    <Label htmlFor={measure.value}>{measure.label}</Label>
                    <Input
                      id={measure.value}
                      type="number"
                      step="0.1"
                      value={(formData.medidas as any)[measure.value] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          medidas: {
                            ...formData.medidas,
                            [measure.value]: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Body Composition Calculator */}
            {customerGender && formData.idade && formData.peso && (
              <BodyCompositionCalculator
                customerId={customerId!}
                customerGender={customerGender}
                customerAge={Number(formData.idade)}
                weight={Number(formData.peso)}
                height={formData.structure?.altura || undefined}
                wrist={formData.structure?.punho || undefined}
                knee={formData.structure?.joelho || undefined}
                folds={formData.dobras}
                onResultsCalculated={(calc) => {
                  setFormData((prev) => ({
                    ...prev,
                    results: {
                      dobras: calc.sumOfFolds ?? prev.results.dobras,
                      fat: calc.bodyFatPercentage ?? prev.results.fat,
                      mg: calc.fatMass ?? prev.results.mg,
                      mm: calc.muscleMass ?? prev.results.mm,
                      mo: calc.boneMass ?? prev.results.mo,
                      mr: calc.residualMass ?? prev.results.mr,
                    },
                  }));
                }}
              />
            )}

            {/* Results */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Resultados</h4>
              <div className="grid grid-cols-2 gap-4">
                {RESULTS.map((result) => (
                  <div key={result.value} className="space-y-2">
                    <Label htmlFor={result.value}>{result.label}</Label>
                    <Input
                      id={result.value}
                      type="number"
                      step="0.01"
                      value={(formData.results as any)[result.value] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          results: {
                            ...formData.results,
                            [result.value]: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-4 space-y-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Observações</h4>
              <Textarea
                placeholder="Observações gerais sobre a consulta..."
                value={formData.obs}
                onChange={(e) =>
                  setFormData({ ...formData, obs: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Notas</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar nova nota..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addNote()}
                />
                <Button type="button" onClick={addNote}>
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {formData.notes.map((note, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm">{note}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNote(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Meals Tab */}
          <TabsContent value="meals" className="mt-4 space-y-4">
            <h4 className="text-sm font-medium">Recordatório Alimentar</h4>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Horário (ex: 08:00)"
                value={newMeal.time}
                onChange={(e) =>
                  setNewMeal({ ...newMeal, time: e.target.value })
                }
              />
              <Input
                placeholder="Descrição da refeição"
                className="col-span-2"
                value={newMeal.description}
                onChange={(e) =>
                  setNewMeal({ ...newMeal, description: e.target.value })
                }
                onKeyPress={(e) => e.key === "Enter" && addMeal()}
              />
            </div>
            <Button type="button" onClick={addMeal} className="w-full">
              Adicionar Refeição
            </Button>
            <div className="space-y-2">
              {formData.meals.map((meal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex gap-4">
                    <span className="text-sm font-medium">{meal.time}</span>
                    <span className="text-sm text-muted-foreground">
                      {meal.description || meal.meal}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMeal(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="mt-4 space-y-4">
            <h4 className="text-sm font-medium">Fotos de Evolução</h4>
            <p className="text-xs text-muted-foreground">
              Faça upload das fotos Frente, Costas e Lado. As fotos existentes serão substituídas.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {PHOTO_SLOTS.map(({ key, label }) => {
                const current = formData.images?.[key];
                const progress = photoProgress[key];
                const isUploading = progress !== undefined;

                return (
                  <div key={key} className="space-y-2">
                    <Label className="text-xs font-medium">{label}</Label>

                    {current?.url ? (
                      <div className="group relative overflow-hidden rounded-lg border">
                        <img
                          src={current.url}
                          alt={label}
                          className="aspect-[3/4] w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <label className="cursor-pointer rounded bg-white/90 px-2 py-1 text-xs font-medium text-black hover:bg-white">
                            Substituir
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(key, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handlePhotoDelete(key)}
                            className="rounded bg-destructive/90 px-2 py-1 text-xs font-medium text-white hover:bg-destructive"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        className={`flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
                          isUploading
                            ? "border-primary bg-primary/5"
                            : "border-input hover:border-primary hover:bg-primary/5"
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground">{progress}%</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Clique para enviar</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(key, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="mt-4 space-y-4">
            <h4 className="text-sm font-medium">Arquivos Complementares</h4>
            <p className="text-xs text-muted-foreground">
              Exames, prescrições médicas e outros documentos. PDF, imagem, DOC ou DOCX — máx. {MAX_FILE_MB} MB.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setFileDragOver(true); }}
              onDragLeave={() => setFileDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setFileDragOver(false);
                if (e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files));
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
                fileDragOver
                  ? "border-primary bg-primary/5"
                  : "border-input bg-transparent hover:border-primary hover:bg-primary/5"
              }`}
            >
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Clique ou arraste arquivos aqui</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={FILE_ACCEPTED_EXTENSIONS}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) processFiles(Array.from(e.target.files));
                  e.target.value = "";
                }}
              />
            </div>

            {/* Upload progress */}
            {Object.entries(fileUploading).map(([key, pct]) => (
              <div key={key} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                <div className="flex-1 space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{pct}%</p>
                </div>
              </div>
            ))}

            {/* Uploaded files */}
            {(formData.anexos || []).map((attachment, i) => {
              const filename = attachment.name || attachment.path?.split("/").pop() || `arquivo-${i + 1}`;
              return (
                <div key={attachment.path || i} className="flex items-center gap-3 rounded-lg border bg-background p-3">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="truncate text-sm font-medium hover:underline"
                      onClick={async () => {
                        const res = await fetch(attachment.url);
                        const blob = await res.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = blobUrl;
                        a.download = filename;
                        a.click();
                        URL.revokeObjectURL(blobUrl);
                      }}
                    >
                      {filename}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFileRemove(attachment)}
                    className="text-destructive transition-colors hover:text-destructive/80"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}

            {(formData.anexos || []).length === 0 && Object.keys(fileUploading).length === 0 && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip size={12} />
                Nenhum arquivo enviado ainda
              </p>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
