import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, TrendingUp, DollarSign, Target, FileText, Plus } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGetCustomerData } from "@/components/Customers/hooks";
import { useGetCustomerConsultaData } from "@/components/Consultas/hooks/useGetCustomerConsultas";
import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import { useFetchAnamnesisQuery } from "@/app/state/features/anamnesisSlice";
import { useAuth } from "@/infra/firebase/hooks/useAuth";
import { ROUTES } from "@/app/router/routes";
import { IAnamnesis, ICustomerConsulta } from "@/domain/entities";
import { NewFinanceDialog } from "@/components/Finances/NewFinanceDialog";

const CustomerSummaryTab: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { dbUid } = useAuth();
  const customer = useGetCustomerData(customerId!);

  // Fetch all consultas
  const { data: consultas, isLoading: consultasLoading } = useFetchCustomerConsultasQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

  // Fetch anamnesis
  const { data: anamnesisRecords, isLoading: anamnesisLoading } = useFetchAnamnesisQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

  // Get last consulta
  const lastConsulta = consultas && consultas.length > 0
    ? [...consultas].sort((a: ICustomerConsulta, b: ICustomerConsulta) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })[0]
    : null;

  // Get last anamnesis
  const lastAnamnesis = anamnesisRecords && anamnesisRecords.length > 0
    ? [...anamnesisRecords].sort((a, b) => {
        const dateA = a.createdAt && typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt && typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })[0]
    : null;

  // Format date safely
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não informado";
    let date;
    try {
      date = parse(dateString, "dd/MM/yyyy", new Date());
    } catch {
      date = undefined;
    }
    return date && !isNaN(date.getTime()) ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Data inválida";
  };

  // Calculate weight evolution
  const calculateWeightEvolution = () => {
    if (!consultas || consultas.length < 2) return null;

    const sortedConsultas = [...consultas]
      .filter(c => c.peso)
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });

    if (sortedConsultas.length < 2) return null;

    const first = sortedConsultas[0];
    const last = sortedConsultas[sortedConsultas.length - 1];

    const weightDiff = Number(last.peso || 0) - Number(first.peso || 0);
    const percentChange = ((weightDiff / Number(first.peso || 1)) * 100).toFixed(1);

    return {
      initial: first.peso,
      current: last.peso,
      diff: weightDiff,
      percentChange: parseFloat(percentChange),
    };
  };

  const weightEvolution = calculateWeightEvolution();

  if (!customer) {
    return <div>Carregando...</div>;
  }

  if (!customerId) {
    console.error("No customerId defined")
    navigate(`/${ROUTES.CUSTOMERS.BASE}`)
    return;
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button
          onClick={() => navigate(`/${ROUTES.CONSULTAS.CREATE(customerId!)}`)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Consulta
        </Button>
        <NewFinanceDialog customerId={customerId} variant="outline" />
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Last Consulta */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Consulta</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastConsulta ? formatDate(lastConsulta.date) : "Nenhuma"}
            </div>
            {lastConsulta?.peso && (
              <p className="text-xs text-muted-foreground mt-1">
                Peso: {lastConsulta.peso} kg
              </p>
            )}
          </CardContent>
        </Card>

        {/* Total Consultas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultas?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Consultas registradas
            </p>
          </CardContent>
        </Card>

        {/* Weight Evolution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evolução de Peso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {weightEvolution ? (
              <>
                <div className="text-2xl font-bold">
                  {weightEvolution.diff > 0 ? "+" : ""}
                  {weightEvolution.diff.toFixed(1)} kg
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {weightEvolution.percentChange > 0 ? "+" : ""}
                  {weightEvolution.percentChange}% desde o início
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Dados insuficientes
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credits/Finances */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customer.credits || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Créditos disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Last Consulta Details */}
      {lastConsulta && (
        <Card>
          <CardHeader>
            <CardTitle>Última Consulta - {formatDate(lastConsulta.date)}</CardTitle>
            <CardDescription>Resumo dos principais dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Results */}
            {lastConsulta.results && (
              <div>
                <h4 className="text-sm font-medium mb-2">Resultados</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {lastConsulta.results.fat && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">% Gordura</p>
                      <p className="text-sm font-medium">{lastConsulta.results.fat}%</p>
                    </div>
                  )}
                  {lastConsulta.results.mm && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Massa Magra</p>
                      <p className="text-sm font-medium">{lastConsulta.results.mm} kg</p>
                    </div>
                  )}
                  {lastConsulta.results.mg && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Massa Gorda</p>
                      <p className="text-sm font-medium">{lastConsulta.results.mg} kg</p>
                    </div>
                  )}
                  {lastConsulta.peso && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Peso</p>
                      <p className="text-sm font-medium">{lastConsulta.peso} kg</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Notes/Observations */}
            {lastConsulta.obs && (
              <div>
                <h4 className="text-sm font-medium mb-2">Observações</h4>
                <p className="text-sm text-muted-foreground">{lastConsulta.obs}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/${ROUTES.CONSULTAS.DETAILS(customerId!, lastConsulta.id!)}`)}
              >
                Ver Consulta Completa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Metas Ativas</CardTitle>
              <CardDescription>Objetivos em andamento</CardDescription>
            </div>
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {lastConsulta ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ver metas na aba de Consultas e Resultados
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/${ROUTES.CUSTOMERS.BASE}/${customerId}/consultas`)}
              >
                Ver Todas as Consultas
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma meta registrada ainda
            </p>
          )}
        </CardContent>
      </Card>

      {/* Important Anamnesis Info */}
      {lastAnamnesis ? (
        <Card>
          <CardHeader>
            <CardTitle>Informações da Anamnese</CardTitle>
            <CardDescription>
              Última atualização: {formatDate(typeof lastAnamnesis.createdAt === 'string' ? lastAnamnesis.createdAt : undefined)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(lastAnamnesis)
                .filter(([key]) => key !== 'createdAt' && key !== 'id')
                .slice(0, 5)
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              {Object.keys(lastAnamnesis).length > 7 && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto"
                  onClick={() => navigate(`/${ROUTES.CUSTOMERS.BASE}/${customerId}/anamnesis`)}
                >
                  Ver anamnese completa
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Anamnese não cadastrada</CardTitle>
            </div>
            <CardDescription>
              Registre a anamnese do paciente para acompanhar seu histórico de saúde e alimentação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.CUSTOMERS.CREATEANAMNESIS(customerId!))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Anamnese
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerSummaryTab;
