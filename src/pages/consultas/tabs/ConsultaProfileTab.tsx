import React from "react";
import { useParams } from "react-router-dom";
import { Scale, Ruler, Activity, User, FileText, ClipboardList, Utensils, Image as ImageIcon, Paperclip } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useGetCustomerConsultaData } from "@/components/Consultas/hooks/useGetCustomerConsultas";
import { FOLDS, MEASURES, RESULTS } from "@/domain/entities/consulta";

const ConsultaProfileTab: React.FC = () => {
  const { customerId, consultaId } = useParams<{ customerId: string; consultaId: string }>();
  const consulta = useGetCustomerConsultaData(customerId, consultaId);

  if (!consulta) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Evaluation Info - 4 blocks side by side */}
      <div className="grid gap-4 grid-cols-2">
        {/* Resultados Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Resultados</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            {consulta.results ? (
              <>
                {Object.entries(consulta.results).map(([key, value]) => {
                  const label = RESULTS.find(r => r.value === key)?.label || key;
                  return (
                    <div key={key} className="flex justify-between py-1.5 border-b border-dotted border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground uppercase tracking-wide">{label}</span>
                      <span className="font-medium text-sm">{value}</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum dado cadastrado</p>
            )}
          </CardContent>
        </Card>

        {/* Dobras Card */}
        <Card className="hover:shadow-md transition-shadow">
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
                  <div className="flex justify-between py-1.5 border-b-2 border-primary/30">
                    <span className="text-sm font-semibold uppercase tracking-wide">Soma de Dobras</span>
                    <span className="text-sm font-bold">{consulta.results.dobras} mm</span>
                  </div>
                )}
                {Object.entries(consulta.dobras).map(([key, value]) => {
                  const label = FOLDS.find(f => f.value === key)?.label || key;
                  return (
                    <div key={key} className="flex justify-between py-1.5 border-b border-dotted border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground uppercase tracking-wide">{label}</span>
                      <span className="font-medium text-sm">{value} mm</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum dado cadastrado</p>
            )}
          </CardContent>
        </Card>

        {/* Medidas Card */}
        <Card className="hover:shadow-md transition-shadow">
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
                  const label = MEASURES.find(m => m.value === key)?.label || key;
                  return (
                    <div key={key} className="flex justify-between py-1.5 border-b border-dotted border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground uppercase tracking-wide">{label}</span>
                      <span className="font-medium text-sm">{value} cm</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum dado cadastrado</p>
            )}
          </CardContent>
        </Card>

        {/* Estrutura Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Estrutura</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            {consulta.structure ? (
              <>
                {consulta.structure.altura && (
                  <div className="flex justify-between py-1.5 border-b border-dotted border-border/50">
                    <span className="text-sm text-muted-foreground uppercase tracking-wide">Altura</span>
                    <span className="font-medium text-sm">{consulta.structure.altura} cm</span>
                  </div>
                )}
                {consulta.structure.punho && (
                  <div className="flex justify-between py-1.5 border-b border-dotted border-border/50">
                    <span className="text-sm text-muted-foreground uppercase tracking-wide">Punho</span>
                    <span className="font-medium text-sm">{consulta.structure.punho} cm</span>
                  </div>
                )}
                {consulta.structure.joelho && (
                  <div className="flex justify-between py-1.5 border-b border-dotted border-border/50">
                    <span className="text-sm text-muted-foreground uppercase tracking-wide">Joelho</span>
                    <span className="font-medium text-sm">{consulta.structure.joelho} cm</span>
                  </div>
                )}
                {consulta.peso && (
                  <div className="flex justify-between py-1.5 border-b border-dotted border-border/50">
                    <span className="text-sm text-muted-foreground uppercase tracking-wide">Peso</span>
                    <span className="font-medium text-sm">{consulta.peso} kg</span>
                  </div>
                )}
                {consulta.idade && (
                  <div className="flex justify-between py-1.5 border-b border-dotted border-border/50 last:border-0">
                    <span className="text-sm text-muted-foreground uppercase tracking-wide">Idade</span>
                    <span className="font-medium text-sm">{consulta.idade} anos</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum dado cadastrado</p>
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
                  <li key={index} className="text-sm border-l-2 border-primary pl-3 py-1">
                    {note}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma nota registrada</p>
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
              <p className="text-sm text-muted-foreground">Nenhuma observação registrada</p>
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
                  {index < consulta.meals!.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum recordatório registrado</p>
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
          {consulta.images && !Object.values(consulta.images).every(img => Object.keys(img).length === 0)  ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Object.keys(consulta.images.img_frente).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Frente</p>
                  <img
                    src={consulta.images.img_frente.url}
                    alt="Foto Frente"
                    className="w-full h-auto rounded-lg border object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </div>
              )}
              {Object.keys(consulta.images.img_lado).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Lado</p>
                  <img
                    src={consulta.images.img_lado.url}
                    alt="Foto Lado"
                    className="w-full h-auto rounded-lg border object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </div>
              )}
              {Object.keys(consulta.images.img_costas).length > 0 && (
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
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{anexo.path.split('/').pop()}</span>
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
            <p className="text-sm text-muted-foreground">Nenhum anexo disponível</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsultaProfileTab;
