import { getFunctions, httpsCallable } from "firebase/functions";
import { CheckCircle, Loader2, PlayCircle, XCircle } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const InitializeAnalyticsButton = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const handleInitialize = async () => {
    setLoading(true);
    setResult(null);

    try {
      const functions = getFunctions();
      const initializeAnalytics = httpsCallable(
        functions,
        "initializeAnalytics",
      );

      const response = await initializeAnalytics();
      const data = response.data as any;

      setResult({
        success: true,
        message: "Analytics inicializado com sucesso!",
        data: data.counters,
      });
    } catch (error: any) {
      console.error("Failed to initialize analytics:", error);
      setResult({
        success: false,
        message: error.message || "Falha ao inicializar analytics",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMonthlyAggregation = async () => {
    setLoading(true);
    setResult(null);

    try {
      const functions = getFunctions();
      const triggerMonthlyAggregation = httpsCallable(
        functions,
        "triggerMonthlyAggregation",
      );

      const response = await triggerMonthlyAggregation();
      const data = response.data as any;

      setResult({
        success: true,
        message: `Agregação mensal completa para ${data.monthKey}`,
        data: data.metrics,
      });
    } catch (error: any) {
      console.error("Failed to aggregate monthly metrics:", error);
      setResult({
        success: false,
        message: error.message || "Falha ao agregar métricas mensais",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inicialização de Analytics</CardTitle>
        <CardDescription>
          Inicialize os contadores de analytics e agregue métricas mensais. Use
          estas ferramentas após o deploy ou ao configurar uma nova conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleInitialize}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Inicializar Contadores de Analytics
              </>
            )}
          </Button>

          <Button
            onClick={handleMonthlyAggregation}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Agregar Métricas do Último Mês
              </>
            )}
          </Button>
        </div>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  <p className="font-medium">{result.message}</p>
                  {result.data && (
                    <div className="mt-2 text-sm">
                      <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <strong>Inicializar Contadores de Analytics:</strong> Escaneia todos
            os seus dados e calcula total de clientes, consultas, receita e
            saldo pendente.
          </p>
          <p>
            <strong>Agregar Métricas Mensais:</strong> Gera dados agregados
            mensais do mês anterior, incluindo clientes ativos e receita média
            por cliente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
