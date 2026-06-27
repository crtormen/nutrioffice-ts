import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Contact,
  ExternalLink,
  Mail,
  Phone,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "@/app/state/hooks";

import { ROUTES } from "@/app/router/routes";
import { useFetchLeadsQuery, selectLeadById, useUpdateLeadMutation } from "@/app/state/features/leadsSlice";
import {
  selectCrmSettings,
  useFetchSettingsQuery,
} from "@/app/state/features/settingsSlice";
import { ConvertLeadDialog } from "@/components/CRM/ConvertLeadDialog";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_FUNNEL } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  site: "Site",
  indicacao: "Indicação",
  outro: "Outro",
};

const LeadDetailsPage = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const { dbUid } = useAuth();
  const navigate = useNavigate();
  const [convertOpen, setConvertOpen] = useState(false);
  const [notesValue, setNotesValue] = useState<string | undefined>(undefined);
  const [savingNotes, setSavingNotes] = useState(false);

  useFetchLeadsQuery(dbUid, { skip: !dbUid });
  useFetchSettingsQuery(dbUid, { skip: !dbUid });

  const selectLead = useMemo(() => selectLeadById(dbUid, leadId), [dbUid, leadId]);
  const lead = useAppSelector(selectLead);
  const selectSettings = useMemo(() => selectCrmSettings(dbUid), [dbUid]);
  const crmSettings = useAppSelector(selectSettings);
  const [updateLead] = useUpdateLeadMutation();

  const defaultFunnelId = crmSettings?.defaultFunnelId ?? "default";
  const funnel = crmSettings?.funnels?.[defaultFunnelId] ?? DEFAULT_FUNNEL;
  const sortedStages = [...funnel.stages].sort((a, b) => a.order - b.order);

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "CRM", href: ROUTES.CRM.BASE },
    { label: lead?.name ?? "Lead" },
  ];

  if (!lead) {
    return (
      <div className="p-6 md:p-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.CRM.BASE)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <p className="mt-4 text-muted-foreground">Lead não encontrado.</p>
      </div>
    );
  }

  const currentNotes = notesValue !== undefined ? notesValue : (lead.notes ?? "");

  async function handleStageChange(stage: string) {
    if (!dbUid || !leadId) return;
    await updateLead({ uid: dbUid, leadId, updates: { stage } });
  }

  async function handleSaveNotes() {
    if (!dbUid || !leadId) return;
    setSavingNotes(true);
    await updateLead({ uid: dbUid, leadId, updates: { notes: currentNotes } });
    setSavingNotes(false);
  }

  const currentStage = sortedStages.find((s) => s.id === lead.stage);

  return (
    <div className="space-y-6 p-6 md:p-10">
      <PageHeader breadcrumbs={breadcrumbs} showBackButton />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Contact className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{lead.name}</h2>
              <p className="text-sm text-muted-foreground">
                {SOURCE_LABELS[lead.source] ?? lead.source}
                {lead.createdAt &&
                  ` · ${format(new Date(lead.createdAt), "dd/MM/yyyy", { locale: ptBR })}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!lead.isConverted && (
            <Button
              variant="default"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setConvertOpen(true)}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Converter em Cliente
            </Button>
          )}
          {lead.isConverted && lead.convertedToCustomerId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.CUSTOMERS.DETAILS(lead.convertedToCustomerId!))}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Ver Cliente
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lead.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.email}</span>
                  </div>
                )}
                {lead.chatwootConversationId && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Chatwoot conv. #{lead.chatwootConversationId}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Funil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {currentStage && (
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: currentStage.color }}
                    />
                  )}
                  <Select
                    value={lead.stage}
                    onValueChange={handleStageChange}
                    disabled={lead.isConverted}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedStages.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {lead.interest && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Interesse: </span>
                    {lead.interest}
                  </p>
                )}

                {lead.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {lead.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {lead.isConverted && (
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-600">
                    Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {lead.convertedAt && (
                    <p>
                      <span className="text-muted-foreground">Data: </span>
                      {format(new Date(lead.convertedAt), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                  {lead.lastPurchaseDate && (
                    <p>
                      <span className="text-muted-foreground">Última compra: </span>
                      {format(new Date(lead.lastPurchaseDate), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                  {lead.lastAppointmentDate && (
                    <p>
                      <span className="text-muted-foreground">Última consulta: </span>
                      {format(new Date(lead.lastAppointmentDate), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-3">
          <Textarea
            value={currentNotes}
            onChange={(e) => setNotesValue(e.target.value)}
            placeholder="Escreva observações sobre este lead..."
            rows={8}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes}>
              {savingNotes ? "Salvando..." : "Salvar Notas"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {!lead.isConverted && (
        <ConvertLeadDialog
          open={convertOpen}
          onOpenChange={setConvertOpen}
          lead={lead}
        />
      )}
    </div>
  );
};

export default LeadDetailsPage;
