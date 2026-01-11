import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ImageIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ICustomerConsulta } from "@/domain/entities";

interface PhotoComparisonCardProps {
  beforeConsulta?: ICustomerConsulta;
  afterConsulta?: ICustomerConsulta;
  showMetrics?: boolean;
}

export const PhotoComparisonCard = ({
  beforeConsulta,
  afterConsulta,
  showMetrics = true,
}: PhotoComparisonCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = parse(dateString, "dd/MM/yyyy", new Date());
      return format(date, "dd/MM/yy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getPhotoUrl = (view: "frente" | "costas" | "lado", consulta?: ICustomerConsulta) => {
    if (!consulta?.images) return null;

    const imageKey = `img_${view}` as keyof typeof consulta.images;
    const imageData = consulta.images[imageKey];

    if (!imageData || typeof imageData !== 'object') return null;
    return (imageData as any).url || (imageData as any).downloadURL || null;
  };

  const PhotoPlaceholder = ({ label }: { label: string }) => (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-md border-2 border-dashed border-muted bg-muted/20 p-4 text-muted-foreground">
      <ImageIcon className="mb-2 h-12 w-12 opacity-50" />
      <p className="text-sm">{label}</p>
    </div>
  );

  const PhotoView = ({ consulta, label }: { consulta?: ICustomerConsulta; label: string }) => {
    const frontalUrl = getPhotoUrl("frente", consulta);
    const backUrl = getPhotoUrl("costas", consulta);
    const sideUrl = getPhotoUrl("lado", consulta);

    const hasAnyPhoto = frontalUrl || backUrl || sideUrl;

    return (
      <div className="space-y-2">
        <div className="text-center">
          <p className="text-sm font-medium">{label}</p>
          {consulta?.date && (
            <p className="text-xs text-muted-foreground">{formatDate(consulta.date)}</p>
          )}
        </div>

        {!hasAnyPhoto ? (
          <PhotoPlaceholder label="Sem fotos disponíveis" />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {frontalUrl ? (
              <div className="space-y-1">
                <img
                  src={frontalUrl}
                  alt="Frente"
                  className="h-auto w-full rounded-md border object-cover"
                />
                <p className="text-center text-xs text-muted-foreground">Frente</p>
              </div>
            ) : (
              <div className="space-y-1">
                <PhotoPlaceholder label="Frente" />
              </div>
            )}

            {sideUrl ? (
              <div className="space-y-1">
                <img
                  src={sideUrl}
                  alt="Lado"
                  className="h-auto w-full rounded-md border object-cover"
                />
                <p className="text-center text-xs text-muted-foreground">Lado</p>
              </div>
            ) : (
              <div className="space-y-1">
                <PhotoPlaceholder label="Lado" />
              </div>
            )}

            {backUrl ? (
              <div className="space-y-1">
                <img
                  src={backUrl}
                  alt="Costas"
                  className="h-auto w-full rounded-md border object-cover"
                />
                <p className="text-center text-xs text-muted-foreground">Costas</p>
              </div>
            ) : (
              <div className="space-y-1">
                <PhotoPlaceholder label="Costas" />
              </div>
            )}
          </div>
        )}

        {showMetrics && consulta && (
          <div className="mt-2 flex justify-around rounded-md border bg-muted/30 p-2 text-sm">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Peso</p>
              <p className="font-semibold">{consulta.peso ? `${consulta.peso} kg` : "-"}</p>
            </div>
            {consulta.results?.fat && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Gordura</p>
                <p className="font-semibold">{consulta.results.fat}%</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparação de Fotos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <PhotoView consulta={beforeConsulta} label="Antes" />
          <PhotoView consulta={afterConsulta} label="Depois" />
        </div>
      </CardContent>
    </Card>
  );
};
