import { Edit, Upload, X } from "lucide-react";
import React, { useState } from "react";
import { useParams } from "react-router-dom";

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
  ICustomerConsulta,
  IFolds,
  IMeal,
  IMeasures,
  IResults,
  IStructure,
  MEASURES,
  RESULTS,
} from "@/domain/entities/consulta";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

interface EditConsultaDialogProps {
  consulta: ICustomerConsulta;
}

export const EditConsultaDialog: React.FC<EditConsultaDialogProps> = ({
  consulta,
}) => {
  const [open, setOpen] = useState(false);
  const { dbUid } = useAuth();
  const { customerId } = useParams<{ customerId: string }>();
  const [updateConsulta, { isLoading }] = useUpdateCustomerConsultaMutation();

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
  });

  const [newNote, setNewNote] = useState("");
  const [newMeal, setNewMeal] = useState({ time: "", description: "" });

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="evaluation">Avaliação</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
            <TabsTrigger value="meals">Alimentação</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
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
            <div className="rounded-lg border-2 border-dashed py-12 text-center">
              <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-sm text-muted-foreground">
                Upload de fotos e anexos em desenvolvimento
              </p>
              <p className="text-xs text-muted-foreground">
                Em breve você poderá fazer upload de novas fotos e documentos
              </p>
            </div>
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
