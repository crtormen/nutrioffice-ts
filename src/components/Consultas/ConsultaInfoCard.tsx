import { differenceInYears, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Hash, TrendingUp, User, UserCircle } from "lucide-react";

import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ICustomer, ICustomerConsulta } from "@/domain/entities";
import { useAuth } from "@/infra/firebase/hooks";

interface ConsultaInfoCardProps {
  customer: ICustomer;
  consulta: ICustomerConsulta;
  customerId: string;
}

export function ConsultaInfoCard({
  customer,
  consulta,
  customerId,
}: ConsultaInfoCardProps) {
  const { dbUid } = useAuth();

  // Fetch all consultas for this customer to get count and order
  const { data: allConsultas, isLoading } = useFetchCustomerConsultasQuery({
    uid: dbUid,
    customerId,
  });

  const calculateAge = (birthday?: string): number | null => {
    if (!birthday) return null;
    try {
      // Try pt-BR locale string format first (e.g. "21 de setembro de 1974")
      const ptParsed = parse(birthday, "d 'de' MMMM 'de' yyyy", new Date(), { locale: ptBR });
      if (!isNaN(ptParsed.getTime())) return differenceInYears(new Date(), ptParsed);
      // Fallback for ISO or other parseable formats
      const fallback = new Date(birthday);
      if (!isNaN(fallback.getTime())) return differenceInYears(new Date(), fallback);
      return null;
    } catch {
      return null;
    }
  };

  // Get gender label
  const getGenderLabel = (gender?: string): string => {
    if (!gender) return "Não informado";
    if (gender === "H") return "Homem";
    if (gender === "M") return "Mulher";
    return gender;
  };

  // Sort consultas by date and find current consulta index
  const sortedConsultas = allConsultas
    ? [...allConsultas].sort((a, b) => {
        if (!a.date || !b.date) return 0;
        try {
          const dateA = parse(a.date, "dd/MM/yyyy", new Date());
          const dateB = parse(b.date, "dd/MM/yyyy", new Date());
          return dateA.getTime() - dateB.getTime();
        } catch {
          return 0;
        }
      })
    : [];

  const currentIndex = sortedConsultas.findIndex((c) => c.id === consulta.id);
  const consultaNumber = currentIndex + 1;
  const totalConsultas = sortedConsultas.length;

  // Get previous consulta date (if exists)
  const previousConsulta =
    currentIndex > 0 ? sortedConsultas[currentIndex - 1] : null;

  const age = calculateAge(customer.birthday);
  const genderLabel = getGenderLabel(customer.gender);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {/* Customer Name */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Cliente</span>
            </div>
            <p className="text-lg font-semibold">{customer.name}</p>
          </div>

          {/* Gender & Age */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserCircle className="h-4 w-4" />
              <span>Sexo e Idade</span>
            </div>
            <p className="text-lg font-semibold">
              {genderLabel}
              {age !== null && `, ${age} anos`}
            </p>
          </div>

          {/* Consulta Number */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span>Consulta</span>
            </div>
            <p className="text-lg font-semibold">
              {consultaNumber} de {totalConsultas}
            </p>
          </div>

          {/* Total Consultas */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Total de Consultas</span>
            </div>
            <p className="text-lg font-semibold">{totalConsultas}</p>
          </div>

          {/* Previous Consulta Date */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Consulta Anterior</span>
            </div>
            <p className="text-lg font-semibold">
              {previousConsulta?.date ? (
                previousConsulta.date
              ) : (
                <span className="text-sm text-muted-foreground">
                  Primeira consulta
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
