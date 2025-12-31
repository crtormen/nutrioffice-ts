import { FileCheck, Home, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { ROUTES } from "@/app/router/routes";
import {
  useApproveFormSubmissionMutation,
  useFetchFormSubmissionsQuery,
  useRejectFormSubmissionMutation,
} from "@/app/state/features/formSubmissionsSlice";
import { columns } from "@/components/FormSubmissions/columns";
import { PublicFormLinksCard } from "@/components/FormSubmissions/PublicFormLinksCard";
import { SubmissionDetailsDialog } from "@/components/FormSubmissions/SubmissionDetailsDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IFormSubmission } from "@/domain/entities/formSubmission";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

export default function FormSubmissionsPage() {
  const { dbUid } = useAuth();
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [selectedSubmission, setSelectedSubmission] =
    useState<IFormSubmission | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch submissions with real-time updates
  const {
    data: submissions = [],
    isLoading,
    error,
  } = useFetchFormSubmissionsQuery(dbUid || "", {
    skip: !dbUid,
  });

  const [approveSubmission, { isLoading: isApproving }] =
    useApproveFormSubmissionMutation();
  const [rejectSubmission, { isLoading: isRejecting }] =
    useRejectFormSubmissionMutation();

  // Filter submissions by status
  const filteredSubmissions = submissions.filter(
    (s) => s.status === statusFilter,
  );

  // Count by status
  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const approvedCount = submissions.filter(
    (s) => s.status === "approved",
  ).length;
  const rejectedCount = submissions.filter(
    (s) => s.status === "rejected",
  ).length;

  const handleViewDetails = (submission: IFormSubmission) => {
    setSelectedSubmission(submission);
    setDetailsDialogOpen(true);
  };

  const handleApprove = async (submission: IFormSubmission) => {
    if (!dbUid) return;

    try {
      await approveSubmission({
        uid: dbUid,
        submissionId: submission.id,
        customerData: submission.customerData,
        anamnesisData: submission.anamnesisData,
      }).unwrap();

      toast.success("Submissão aprovada e cliente criado com sucesso!");
      setDetailsDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? String(error.data)
          : "Erro ao aprovar submissão";
      toast.error(errorMessage);
    }
  };

  const handleReject = async (submission: IFormSubmission) => {
    if (!dbUid) return;

    try {
      await rejectSubmission({
        uid: dbUid,
        submissionId: submission.id,
      }).unwrap();

      toast.success("Submissão rejeitada");
      setDetailsDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? String(error.data)
          : "Erro ao rejeitar submissão";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando submissões...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar submissões. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={ROUTES.DASHBOARD}>
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Submissões de Formulário</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <FileCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Submissões de Formulário
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os formulários de anamnese enviados por novos pacientes
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendentes</CardDescription>
            <CardTitle className="text-3xl">
              {pendingCount}
              {pendingCount > 0 && (
                <Badge variant="default" className="ml-2 text-xs">
                  Requer ação
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Aprovadas</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {approvedCount}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rejeitadas</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {rejectedCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Public Form Links */}
      <PublicFormLinksCard />

      {/* Submissions Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Submissões</CardTitle>
          <CardDescription>
            Visualize, edite e aprove ou rejeite as submissões de formulários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                Pendentes
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">
                Aprovadas
                {approvedCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {approvedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejeitadas
                {rejectedCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {rejectedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {filteredSubmissions.length === 0 ? (
                <div className="py-12 text-center">
                  <FileCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhuma submissão pendente
                  </p>
                </div>
              ) : (
                <DataTable
                  data={filteredSubmissions}
                  columns={columns({ onViewDetails: handleViewDetails })}
                />
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              {filteredSubmissions.length === 0 ? (
                <div className="py-12 text-center">
                  <FileCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhuma submissão aprovada
                  </p>
                </div>
              ) : (
                <DataTable
                  data={filteredSubmissions}
                  columns={columns({ onViewDetails: handleViewDetails })}
                />
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {filteredSubmissions.length === 0 ? (
                <div className="py-12 text-center">
                  <FileCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhuma submissão rejeitada
                  </p>
                </div>
              ) : (
                <DataTable
                  data={filteredSubmissions}
                  columns={columns({ onViewDetails: handleViewDetails })}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      {selectedSubmission && (
        <SubmissionDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          submission={selectedSubmission}
          onApprove={() => handleApprove(selectedSubmission)}
          onReject={() => handleReject(selectedSubmission)}
          isApproving={isApproving}
          isRejecting={isRejecting}
        />
      )}
    </div>
  );
}
