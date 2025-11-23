import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useGetCustomerConsultaData } from "@/components/Consultas/hooks/useGetCustomerConsultas";
import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import { useAuth } from "@/infra/firebase/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ConsultaPhotosTab: React.FC = () => {
  const { customerId, consultaId } = useParams<{ customerId: string; consultaId: string }>();
  const { dbUid } = useAuth();
  const consulta = useGetCustomerConsultaData(customerId, consultaId);

  // Fetch all consultas for comparison
  const { data: consultas } = useFetchCustomerConsultasQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

  // Filter consultas that have images
  const consultasWithImages = consultas?.filter(c => c.images) || [];

  // State for comparison selection
  const [beforeConsultaId, setBeforeConsultaId] = useState<string>("");
  const [afterConsultaId, setAfterConsultaId] = useState<string>("");

  // Find selected consultas
  const beforeConsulta = consultasWithImages.find(c => c.id === beforeConsultaId);
  const afterConsulta = consultasWithImages.find(c => c.id === afterConsultaId);

  if (!consulta) {
    return <div>Carregando...</div>;
  }

  // Format date for display
  const formatConsultaDate = (dateString?: string) => {
    if (!dateString) return "Data não informada";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Comparison Section */}
      <Card>
        <CardHeader>
          <CardTitle>Comparar Progresso</CardTitle>
          <CardDescription>Selecione as consultas que deseja comparar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selection Controls */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="before-select">Antes</Label>
              <Select value={beforeConsultaId} onValueChange={setBeforeConsultaId}>
                <SelectTrigger id="before-select">
                  <SelectValue placeholder="Selecione uma consulta" />
                </SelectTrigger>
                <SelectContent>
                  {consultasWithImages.map((c) => (
                    <SelectItem key={c.id} value={c.id!} disabled={c.id === afterConsultaId}>
                      {formatConsultaDate(c.date)}
                      {c.id === consultaId && " (Atual)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="after-select">Depois</Label>
              <Select value={afterConsultaId} onValueChange={setAfterConsultaId}>
                <SelectTrigger id="after-select">
                  <SelectValue placeholder="Selecione uma consulta" />
                </SelectTrigger>
                <SelectContent>
                  {consultasWithImages.map((c) => (
                    <SelectItem key={c.id} value={c.id!} disabled={c.id === beforeConsultaId}>
                      {formatConsultaDate(c.date)}
                      {c.id === consultaId && " (Atual)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comparison Grid */}
          {beforeConsulta && afterConsulta && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                Comparando: {formatConsultaDate(beforeConsulta.date)} vs {formatConsultaDate(afterConsulta.date)}
              </div>

              {/* Frente Comparison */}
              {beforeConsulta.images?.img_frente && afterConsulta.images?.img_frente && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-center">Frente</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-center text-muted-foreground">
                        Antes ({formatConsultaDate(beforeConsulta.date)})
                      </p>
                      <img
                        src={beforeConsulta.images.img_frente.url}
                        alt="Foto Frente - Antes"
                        className="w-full h-auto rounded-lg border object-cover"
                      />
                      {beforeConsulta.peso && (
                        <p className="text-xs text-center text-muted-foreground">
                          Peso: {beforeConsulta.peso} kg
                          {beforeConsulta.results?.fat && ` | Gordura: ${beforeConsulta.results.fat}%`}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-center text-muted-foreground">
                        Depois ({formatConsultaDate(afterConsulta.date)})
                      </p>
                      <img
                        src={afterConsulta.images.img_frente.url}
                        alt="Foto Frente - Depois"
                        className="w-full h-auto rounded-lg border object-cover"
                      />
                      {afterConsulta.peso && (
                        <p className="text-xs text-center text-muted-foreground">
                          Peso: {afterConsulta.peso} kg
                          {afterConsulta.results?.fat && ` | Gordura: ${afterConsulta.results.fat}%`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Lado Comparison */}
              {beforeConsulta.images?.img_lado && afterConsulta.images?.img_lado && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-center">Lado</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-center text-muted-foreground">
                        Antes ({formatConsultaDate(beforeConsulta.date)})
                      </p>
                      <img
                        src={beforeConsulta.images.img_lado.url}
                        alt="Foto Lado - Antes"
                        className="w-full h-auto rounded-lg border object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-center text-muted-foreground">
                        Depois ({formatConsultaDate(afterConsulta.date)})
                      </p>
                      <img
                        src={afterConsulta.images.img_lado.url}
                        alt="Foto Lado - Depois"
                        className="w-full h-auto rounded-lg border object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Costas Comparison */}
              {beforeConsulta.images?.img_costas && afterConsulta.images?.img_costas && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-center">Costas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-center text-muted-foreground">
                        Antes ({formatConsultaDate(beforeConsulta.date)})
                      </p>
                      <img
                        src={beforeConsulta.images.img_costas.url}
                        alt="Foto Costas - Antes"
                        className="w-full h-auto rounded-lg border object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-center text-muted-foreground">
                        Depois ({formatConsultaDate(afterConsulta.date)})
                      </p>
                      <img
                        src={afterConsulta.images.img_costas.url}
                        alt="Foto Costas - Depois"
                        className="w-full h-auto rounded-lg border object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state when no selection */}
          {(!beforeConsultaId || !afterConsultaId) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Selecione duas consultas acima para comparar as fotos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Consultation Photos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <CardTitle className="text-base">Fotos desta Consulta</CardTitle>
          </div>
          <CardDescription>
            Fotos registradas em {formatConsultaDate(consulta.date)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consulta.images  && !Object.values(consulta.images).every(img => Object.keys(img).length === 0) ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Object.keys(consulta.images.img_frente).length > 0  && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Frente</p>
                  <img
                    src={consulta.images.img_frente.url}
                    alt="Foto Frente"
                    className="w-full h-auto rounded-lg border object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </div>
              )}
              {Object.keys(consulta.images.img_lado).length > 0  && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Lado</p>
                  <img
                    src={consulta.images.img_lado.url}
                    alt="Foto Lado"
                    className="w-full h-auto rounded-lg border object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </div>
              )}
              {Object.keys(consulta.images.img_costas).length > 0  && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Costas</p>
                  <img
                    src={consulta.images.img_costas.url}
                    alt="Foto Costas"
                    className="w-full h-auto rounded-lg border object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma foto disponível para esta consulta
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsultaPhotosTab;
