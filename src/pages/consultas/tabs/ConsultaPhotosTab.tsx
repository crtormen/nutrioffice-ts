import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Image as ImageIcon } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import { useGetCustomerConsultaData } from "@/components/Consultas/hooks/useGetCustomerConsultas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

interface SyncedImagePairProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel: string;
  afterLabel: string;
  beforeMeta?: string;
  afterMeta?: string;
}

const SyncedImagePair: React.FC<SyncedImagePairProps> = ({
  beforeSrc,
  afterSrc,
  beforeLabel,
  afterLabel,
  beforeMeta,
  afterMeta,
}) => {
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);
  const loadedHeights = useRef<(number | null)[]>([null, null]);

  const onLoad = useCallback((index: 0 | 1, img: HTMLImageElement) => {
    const renderedHeight = img.getBoundingClientRect().height;
    loadedHeights.current[index] = renderedHeight;
    if (loadedHeights.current[0] !== null && loadedHeights.current[1] !== null) {
      setContainerHeight(Math.min(loadedHeights.current[0], loadedHeights.current[1]));
    }
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <p className="text-center text-xs text-muted-foreground">{beforeLabel}</p>
        <div className="overflow-hidden rounded-lg border" style={{ height: containerHeight }}>
          <img
            src={beforeSrc}
            alt={beforeLabel}
            className="h-auto w-full object-cover object-center"
            onLoad={(e) => onLoad(0, e.currentTarget)}
          />
        </div>
        {beforeMeta && <p className="text-center text-xs text-muted-foreground">{beforeMeta}</p>}
      </div>
      <div className="space-y-2">
        <p className="text-center text-xs text-muted-foreground">{afterLabel}</p>
        <div className="overflow-hidden rounded-lg border" style={{ height: containerHeight }}>
          <img
            src={afterSrc}
            alt={afterLabel}
            className="h-auto w-full object-cover object-center"
            onLoad={(e) => onLoad(1, e.currentTarget)}
          />
        </div>
        {afterMeta && <p className="text-center text-xs text-muted-foreground">{afterMeta}</p>}
      </div>
    </div>
  );
};

const ConsultaPhotosTab: React.FC = () => {
  const { customerId, consultaId } = useParams<{
    customerId: string;
    consultaId: string;
  }>();
  const { dbUid } = useAuth();
  const consulta = useGetCustomerConsultaData(customerId, consultaId);

  // Fetch all consultas for comparison
  const { data: consultas } = useFetchCustomerConsultasQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

  // Filter consultas that have images
  const consultasWithImages = consultas?.filter((c) => c.images) || [];

  // State for comparison selection
  const [beforeConsultaId, setBeforeConsultaId] = useState<string>("");
  const [afterConsultaId, setAfterConsultaId] = useState<string>("");

  // Find selected consultas
  const beforeConsulta = consultasWithImages.find(
    (c) => c.id === beforeConsultaId,
  );
  const afterConsulta = consultasWithImages.find(
    (c) => c.id === afterConsultaId,
  );

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
          <CardDescription>
            Selecione as consultas que deseja comparar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selection Controls */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="before-select">Antes</Label>
              <Select
                value={beforeConsultaId}
                onValueChange={setBeforeConsultaId}
              >
                <SelectTrigger id="before-select">
                  <SelectValue placeholder="Selecione uma consulta" />
                </SelectTrigger>
                <SelectContent>
                  {consultasWithImages.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id!}
                      disabled={c.id === afterConsultaId}
                    >
                      {formatConsultaDate(c.date)}
                      {c.id === consultaId && " (Atual)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="after-select">Depois</Label>
              <Select
                value={afterConsultaId}
                onValueChange={setAfterConsultaId}
              >
                <SelectTrigger id="after-select">
                  <SelectValue placeholder="Selecione uma consulta" />
                </SelectTrigger>
                <SelectContent>
                  {consultasWithImages.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id!}
                      disabled={c.id === beforeConsultaId}
                    >
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
              <div className="text-center text-sm text-muted-foreground">
                Comparando: {formatConsultaDate(beforeConsulta.date)} vs{" "}
                {formatConsultaDate(afterConsulta.date)}
              </div>

              {/* Frente Comparison */}
              {beforeConsulta.images?.img_frente &&
                afterConsulta.images?.img_frente && (
                  <div className="space-y-2">
                    <h4 className="text-center text-sm font-medium">Frente</h4>
                    <SyncedImagePair
                      beforeSrc={beforeConsulta.images.img_frente.url}
                      afterSrc={afterConsulta.images.img_frente.url}
                      beforeLabel={`Antes (${formatConsultaDate(beforeConsulta.date)})`}
                      afterLabel={`Depois (${formatConsultaDate(afterConsulta.date)})`}
                      beforeMeta={beforeConsulta.peso ? `Peso: ${beforeConsulta.peso} kg${beforeConsulta.results?.fat ? ` | Gordura: ${beforeConsulta.results.fat}%` : ""}` : undefined}
                      afterMeta={afterConsulta.peso ? `Peso: ${afterConsulta.peso} kg${afterConsulta.results?.fat ? ` | Gordura: ${afterConsulta.results.fat}%` : ""}` : undefined}
                    />
                  </div>
                )}

              {/* Lado Comparison */}
              {beforeConsulta.images?.img_lado &&
                afterConsulta.images?.img_lado && (
                  <div className="space-y-2">
                    <h4 className="text-center text-sm font-medium">Lado</h4>
                    <SyncedImagePair
                      beforeSrc={beforeConsulta.images.img_lado.url}
                      afterSrc={afterConsulta.images.img_lado.url}
                      beforeLabel={`Antes (${formatConsultaDate(beforeConsulta.date)})`}
                      afterLabel={`Depois (${formatConsultaDate(afterConsulta.date)})`}
                    />
                  </div>
                )}

              {/* Costas Comparison */}
              {beforeConsulta.images?.img_costas &&
                afterConsulta.images?.img_costas && (
                  <div className="space-y-2">
                    <h4 className="text-center text-sm font-medium">Costas</h4>
                    <SyncedImagePair
                      beforeSrc={beforeConsulta.images.img_costas.url}
                      afterSrc={afterConsulta.images.img_costas.url}
                      beforeLabel={`Antes (${formatConsultaDate(beforeConsulta.date)})`}
                      afterLabel={`Depois (${formatConsultaDate(afterConsulta.date)})`}
                    />
                  </div>
                )}
            </div>
          )}

          {/* Empty state when no selection */}
          {(!beforeConsultaId || !afterConsultaId) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="mb-3 h-12 w-12 text-muted-foreground" />
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
          {consulta.images &&
          !Object.values(consulta.images).every(
            (img) => Object.keys(img).length === 0,
          ) ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Object.keys(consulta.images.img_frente).length > 0 && (
                <div className="space-y-2">
                  <p className="text-center text-sm font-medium">Frente</p>
                  <img
                    src={consulta.images.img_frente.url}
                    alt="Foto Frente"
                    className="h-auto w-full cursor-pointer rounded-lg border object-cover transition-opacity hover:opacity-90"
                  />
                </div>
              )}
              {Object.keys(consulta.images.img_lado).length > 0 && (
                <div className="space-y-2">
                  <p className="text-center text-sm font-medium">Lado</p>
                  <img
                    src={consulta.images.img_lado.url}
                    alt="Foto Lado"
                    className="h-auto w-full cursor-pointer rounded-lg border object-cover transition-opacity hover:opacity-90"
                  />
                </div>
              )}
              {Object.keys(consulta.images.img_costas).length > 0 && (
                <div className="space-y-2">
                  <p className="text-center text-sm font-medium">Costas</p>
                  <img
                    src={consulta.images.img_costas.url}
                    alt="Foto Costas"
                    className="h-auto w-full cursor-pointer rounded-lg border object-cover transition-opacity hover:opacity-90"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="mb-3 h-12 w-12 text-muted-foreground" />
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
