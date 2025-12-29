import {
  Activity,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Ruler,
  Scale,
  User,
  Utensils,
} from "lucide-react";
import React from "react";
import { useParams } from "react-router-dom";

import { useGetCustomerConsultaData } from "@/components/Consultas/hooks/useGetCustomerConsultas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FOLDS, MEASURES, RESULTS } from "@/domain/entities/consulta";

const ConsultaProfileTab: React.FC = () => {
  const { customerId, consultaId } = useParams<{
    customerId: string;
    consultaId: string;
  }>();
  const consulta = useGetCustomerConsultaData(customerId, consultaId);

  if (!consulta) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Evaluation Info - 4 blocks side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Resultados Card */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Resultados
              </CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            {consulta.results ? (
              <>
                {Object.entries(consulta.results).map(([key, value]) => {
                  const label =
                    RESULTS.find((r) => r.value === key)?.label || key;
                  return (
                    <div
                      key={key}
                      className="flex justify-between border-b border-dotted border-border/50 py-1.5 last:border-0"
                    >
                      <span className="text-sm uppercase tracking-wide text-muted-foreground">
                        {label}
                      </span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum dado cadastrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dobras Card */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Dobras</CardTitle>
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            {consulta.dobras ? (
              <>
                {consulta.results?.dobras && (
                  <div className="flex justify-between border-b-2 border-primary/30 py-1.5">
                    <span className="text-sm font-semibold uppercase tracking-wide">
                      Soma de Dobras
                    </span>
                    <span className="text-sm font-bold">
                      {consulta.results.dobras} mm
                    </span>
                  </div>
                )}
                {Object.entries(consulta.dobras).map(([key, value]) => {
                  const label =
                    FOLDS.find((f) => f.value === key)?.label || key;
                  return (
                    <div
                      key={key}
                      className="flex justify-between border-b border-dotted border-border/50 py-1.5 last:border-0"
                    >
                      <span className="text-sm uppercase tracking-wide text-muted-foreground">
                        {label}
                      </span>
                      <span className="text-sm font-medium">{value} mm</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum dado cadastrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Medidas Card */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Medidas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            {consulta.medidas ? (
              <>
                {Object.entries(consulta.medidas).map(([key, value]) => {
                  const label =
                    MEASURES.find((m) => m.value === key)?.label || key;
                  return (
                    <div
                      key={key}
                      className="flex justify-between border-b border-dotted border-border/50 py-1.5 last:border-0"
                    >
                      <span className="text-sm uppercase tracking-wide text-muted-foreground">
                        {label}
                      </span>
                      <span className="text-sm font-medium">{value} cm</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum dado cadastrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Estrutura Card */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Estrutura
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            {consulta.structure ? (
              <>
                {consulta.structure.altura && (
                  <div className="flex justify-between border-b border-dotted border-border/50 py-1.5">
                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
                      Altura
                    </span>
                    <span className="text-sm font-medium">
                      {consulta.structure.altura} cm
                    </span>
                  </div>
                )}
                {consulta.structure.punho && (
                  <div className="flex justify-between border-b border-dotted border-border/50 py-1.5">
                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
                      Punho
                    </span>
                    <span className="text-sm font-medium">
                      {consulta.structure.punho} cm
                    </span>
                  </div>
                )}
                {consulta.structure.joelho && (
                  <div className="flex justify-between border-b border-dotted border-border/50 py-1.5">
                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
                      Joelho
                    </span>
                    <span className="text-sm font-medium">
                      {consulta.structure.joelho} cm
                    </span>
                  </div>
                )}
                {consulta.peso && (
                  <div className="flex justify-between border-b border-dotted border-border/50 py-1.5">
                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
                      Peso
                    </span>
                    <span className="text-sm font-medium">
                      {consulta.peso} kg
                    </span>
                  </div>
                )}
                {consulta.idade && (
                  <div className="flex justify-between border-b border-dotted border-border/50 py-1.5 last:border-0">
                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
                      Idade
                    </span>
                    <span className="text-sm font-medium">
                      {consulta.idade} anos
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum dado cadastrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Anotações - 2 blocks side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Notas Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <CardTitle className="text-base">Notas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {consulta.notes && consulta.notes.length > 0 ? (
              <ul className="space-y-2">
                {consulta.notes.map((note, index) => (
                  <li
                    key={index}
                    className="border-l-2 border-primary py-1 pl-3 text-sm"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma nota registrada
              </p>
            )}
          </CardContent>
        </Card>

        {/* Observações Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <CardTitle className="text-base">Observações</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {consulta.obs ? (
              <p className="text-sm">{consulta.obs}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma observação registrada
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Recordatório Alimentar */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            <CardTitle className="text-base">Recordatório Alimentar</CardTitle>
          </div>
          <CardDescription>Registro das refeições do dia</CardDescription>
        </CardHeader>
        <CardContent>
          {consulta.meals && consulta.meals.length > 0 ? (
            <div className="space-y-4">
              {consulta.meals.map((meal, index) => (
                <div key={index}>
                  <div className="flex gap-4">
                    <div className="min-w-[80px] text-sm font-medium text-muted-foreground">
                      {meal.time}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{meal.description || meal.meal}</p>
                    </div>
                  </div>
                  {index < consulta.meals!.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum recordatório registrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Photos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <CardTitle className="text-base">Fotos da Consulta</CardTitle>
          </div>
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

      {/* Section 5: Anexos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            <CardTitle className="text-base">Anexos</CardTitle>
          </div>
          <CardDescription>Documentos e arquivos anexados</CardDescription>
        </CardHeader>
        <CardContent>
          {consulta.anexos && consulta.anexos.length > 0 ? (
            <div className="space-y-2">
              {consulta.anexos.map((anexo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {anexo.path.split("/").pop()}
                    </span>
                  </div>
                  <a
                    href={anexo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum anexo disponível
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsultaProfileTab;
