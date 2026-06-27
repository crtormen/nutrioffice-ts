import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, Trash2, Plus, GripVertical, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/state/hooks";
import { z } from "zod";

import { ROUTES } from "@/app/router/routes";
import {
  selectCrmSettings,
  useFetchSettingsQuery,
  useSetSettingsMutation,
} from "@/app/state/features/settingsSlice";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_FUNNEL, ICrmSettings } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

// ── Schemas ──────────────────────────────────────────────────────────────────

const chatwootSchema = z.object({
  chatwootApiUrl: z.string().url("URL inválida").or(z.literal("")),
  chatwootApiToken: z.string().optional(),
  chatwootAccountId: z.coerce.number().int().positive().optional().or(z.literal("")),
});

const stageSchema = z.object({
  stages: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1, "Label obrigatório"),
      color: z.string().min(1),
      order: z.number(),
    }),
  ),
});

type ChatwootFormValues = z.infer<typeof chatwootSchema>;
type StageFormValues = z.infer<typeof stageSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

// Direct Cloud Functions URLs bypass Firebase Hosting's 60s rewrite timeout.
// These long-running operations (196+ customers) need the full 540s function timeout.
const FUNCTIONS_BASE =
  import.meta.env.PROD
    ? "https://us-central1-nutri-office.cloudfunctions.net"
    : "/sync";

const CrmSettingsPage = () => {
  const { dbUid, user } = useAuth();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ total: number; synced: number; failed: number } | null>(null);
  const [syncNameFilter, setSyncNameFilter] = useState("");

  useFetchSettingsQuery(dbUid, { skip: !dbUid });
  const selectSettings = useMemo(() => selectCrmSettings(dbUid), [dbUid]);
  const crmSettings = useAppSelector(selectSettings);
  const [setSettings, { isLoading: isSaving }] = useSetSettingsMutation();

  // ── Chatwoot form ──────────────────────────────────────────────────────────

  const chatwootForm = useForm<ChatwootFormValues>({
    resolver: zodResolver(chatwootSchema),
    defaultValues: {
      chatwootApiUrl: crmSettings?.chatwootApiUrl ?? "",
      chatwootApiToken: crmSettings?.chatwootApiToken ?? "",
      chatwootAccountId: crmSettings?.chatwootAccountId ?? "",
    },
  });

  useEffect(() => {
    if (crmSettings) {
      chatwootForm.reset({
        chatwootApiUrl: crmSettings.chatwootApiUrl ?? "",
        chatwootApiToken: crmSettings.chatwootApiToken ?? "",
        chatwootAccountId: crmSettings.chatwootAccountId ?? "",
      });
    }
  }, [crmSettings]);

  async function saveChatwoot(values: ChatwootFormValues) {
    if (!dbUid) return;
    const current: ICrmSettings = {
      funnels: crmSettings?.funnels ?? { default: DEFAULT_FUNNEL },
      defaultFunnelId: crmSettings?.defaultFunnelId ?? "default",
      chatwootApiUrl: values.chatwootApiUrl || undefined,
      chatwootApiToken: values.chatwootApiToken || undefined,
      chatwootAccountId: values.chatwootAccountId ? Number(values.chatwootAccountId) : undefined,
    };
    await setSettings({ uid: dbUid, type: "crm", setting: current as any, merge: true });
    setVerifyResult(null);
  }

  async function handleVerify() {
    if (!dbUid || !user) return;
    setVerifying(true);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch(`/api/users/${dbUid}/chatwoot/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });
      const data = await res.json();
      setVerifyResult(data.ok === true);
    } catch {
      setVerifyResult(false);
    } finally {
      setVerifying(false);
    }
  }

  async function handleSyncCustomers() {
    if (!dbUid || !user) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch(`${FUNCTIONS_BASE}/syncCustomersToChatwoot`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: syncNameFilter, userId: dbUid }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(data);
      } else {
        setSyncResult(null);
      }
    } catch {
      setSyncResult(null);
    } finally {
      setSyncing(false);
    }
  }

// ── Funnel stages form ─────────────────────────────────────────────────────

  const defaultFunnelId = crmSettings?.defaultFunnelId ?? "default";
  const currentStages = crmSettings?.funnels?.[defaultFunnelId]?.stages
    ?? DEFAULT_FUNNEL.stages;

  const stageForm = useForm<StageFormValues>({
    resolver: zodResolver(stageSchema),
    defaultValues: { stages: [...currentStages].sort((a, b) => a.order - b.order) },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: stageForm.control,
    name: "stages",
  });

  useEffect(() => {
    if (crmSettings) {
      stageForm.reset({
        stages: [...currentStages].sort((a, b) => a.order - b.order),
      });
    }
  }, [crmSettings]);

  async function saveFunnel(values: StageFormValues) {
    if (!dbUid) return;
    const updatedStages = values.stages.map((s, i) => ({ ...s, order: i }));
    const updatedFunnel = {
      ...crmSettings?.funnels?.[defaultFunnelId] ?? DEFAULT_FUNNEL,
      stages: updatedStages,
    };
    const current: ICrmSettings = {
      ...(crmSettings ?? {}),
      funnels: {
        ...(crmSettings?.funnels ?? {}),
        [defaultFunnelId]: updatedFunnel,
      },
      defaultFunnelId,
    };
    await setSettings({ uid: dbUid, type: "crm", setting: current as any, merge: false });
  }

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "CRM", href: ROUTES.CRM.BASE },
    { label: "Configurações" },
  ];

  return (
    <div className="space-y-6 p-6 md:p-10">
      <PageHeader breadcrumbs={breadcrumbs} showBackButton />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurações do CRM</h2>
          <p className="text-sm text-muted-foreground">Integração Chatwoot e configuração do funil</p>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="chatwoot" className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="chatwoot">Chatwoot</TabsTrigger>
          <TabsTrigger value="funnel">Funil de Vendas</TabsTrigger>
        </TabsList>

        {/* ── Chatwoot tab ─────────────────────────────────────────────── */}
        <TabsContent value="chatwoot" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conexão com Chatwoot</CardTitle>
              <CardDescription>
                Configure a integração para sincronizar leads automaticamente via WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...chatwootForm}>
                <form
                  onSubmit={chatwootForm.handleSubmit(saveChatwoot)}
                  className="space-y-4"
                >
                  <FormField
                    control={chatwootForm.control}
                    name="chatwootApiUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Chatwoot</FormLabel>
                        <FormControl>
                          <Input placeholder="https://app.chatwoot.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={chatwootForm.control}
                    name="chatwootApiToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token de Acesso (API Access Token)</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={chatwootForm.control}
                    name="chatwootAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account ID</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-3 pt-2 flex-wrap">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={verifying}
                      onClick={handleVerify}
                    >
                      {verifying ? "Verificando..." : "Testar Conexão"}
                    </Button>
                    {verifyResult === true && (
                      <span className="flex items-center gap-1 text-sm text-emerald-600">
                        <CheckCircle className="h-4 w-4" /> Conectado
                      </span>
                    )}
                    {verifyResult === false && (
                      <span className="flex items-center gap-1 text-sm text-destructive">
                        <XCircle className="h-4 w-4" /> Falha na conexão
                      </span>
                    )}
                  </div>
                </form>
              </Form>

              <Separator className="my-4" />

              <div className="space-y-2">
                <p className="text-sm font-medium">Sincronizar Clientes Existentes</p>
                <p className="text-xs text-muted-foreground">
                  Envia todos os clientes cadastrados para o Chatwoot como contatos, com o atributo{" "}
                  <code className="text-xs">is_customer=true</code>. Execute uma vez após configurar a integração.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Filtrar por nome (ex: Consultoria)"
                    value={syncNameFilter}
                    onChange={(e) => setSyncNameFilter(e.target.value)}
                    className="max-w-xs"
                    disabled={syncing}
                  />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={syncing}
                    onClick={handleSyncCustomers}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Sincronizando..." : "Sincronizar Clientes"}
                  </Button>
                  {syncResult && (
                    <span className="text-xs text-muted-foreground">
                      {syncResult.synced} de {syncResult.total} sincronizados
                      {syncResult.failed > 0 && (
                        <span className="text-destructive ml-1">({syncResult.failed} falhas)</span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <p className="text-sm font-medium">URL do Webhook (registrar no Chatwoot)</p>
                <div className="rounded-md bg-muted px-3 py-2 font-mono text-xs break-all select-all">
                  {`https://us-central1-<SEU-PROJETO>.cloudfunctions.net/chatwootWebhook?userId=${dbUid ?? "<seu-uid>"}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registre esta URL em Chatwoot → Configurações → Integrações → Webhooks com os eventos:{" "}
                  <code className="text-xs">conversation_created</code>,{" "}
                  <code className="text-xs">conversation_updated</code>,{" "}
                  <code className="text-xs">contact_created</code>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Funnel tab ───────────────────────────────────────────────── */}
        <TabsContent value="funnel" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Etapas do Funil Principal</CardTitle>
              <CardDescription>
                Configure as etapas de negociação. A ordem define a progressão dos leads.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...stageForm}>
                <form onSubmit={stageForm.handleSubmit(saveFunnel)} className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <div className="cursor-grab text-muted-foreground hover:text-foreground">
                        <GripVertical size={16} />
                      </div>

                      <FormField
                        control={stageForm.control}
                        name={`stages.${index}.color`}
                        render={({ field: f }) => (
                          <input
                            type="color"
                            {...f}
                            className="w-8 h-8 rounded cursor-pointer border border-input"
                            title="Cor da etapa"
                          />
                        )}
                      />

                      <FormField
                        control={stageForm.control}
                        name={`stages.${index}.label`}
                        render={({ field: f }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Nome da etapa" {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() =>
                      append({
                        id: `etapa-${Date.now()}`,
                        label: "",
                        color: "#94a3b8",
                        order: fields.length,
                      })
                    }
                  >
                    <Plus size={14} className="mr-1" />
                    Adicionar Etapa
                  </Button>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Salvando..." : "Salvar Funil"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrmSettingsPage;
