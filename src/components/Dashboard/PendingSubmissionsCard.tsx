import { Link } from "react-router-dom";
import { FileCheck, ChevronRight, Loader2 } from "lucide-react";

import { useAuth } from "@/infra/firebase/hooks/useAuth";
import { useFetchFormSubmissionsQuery } from "@/app/state/features/formSubmissionsSlice";
import { ROUTES } from "@/app/router/routes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function PendingSubmissionsCard() {
  const { dbUid } = useAuth();
  const { data: submissions = [], isLoading } = useFetchFormSubmissionsQuery(dbUid || "", {
    skip: !dbUid,
  });

  const pendingSubmissions = submissions.filter((s) => s.status === "pending");
  const pendingCount = pendingSubmissions.length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Submissões Pendentes
          </CardTitle>
          <CardDescription>Formulários aguardando aprovação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Submissões Pendentes
          </CardTitle>
          <CardDescription>Formulários aguardando aprovação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma submissão pendente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Submissões Pendentes
              <Badge variant="default" className="ml-2">
                {pendingCount}
              </Badge>
            </CardTitle>
            <CardDescription>Formulários aguardando aprovação</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to={ROUTES.FORM_SUBMISSIONS}>
              Ver todas
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingSubmissions.slice(0, 3).map((submission, index) => (
            <div key={submission.id}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {submission.customerData.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {submission.customerData.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                    {submission.appointmentType === "online" ? "Online" : "Presencial"}
                  </Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link to={ROUTES.FORM_SUBMISSIONS}>
                      Ver detalhes
                    </Link>
                  </Button>
                </div>
              </div>
              {index < Math.min(pendingCount, 3) - 1 && <Separator className="mt-4" />}
            </div>
          ))}
          {pendingCount > 3 && (
            <>
              <Separator />
              <div className="text-center">
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link to={ROUTES.FORM_SUBMISSIONS}>
                    Ver mais {pendingCount - 3} submissões
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
