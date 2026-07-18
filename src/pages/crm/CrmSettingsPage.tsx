import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, Trash2, Plus, GripVertical, CheckCircle, XCircle, RefreshCw, Inbox } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DEFAULT_FUNNEL, ICrmSettings, IInboxSetting } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

// ── Schemas ──────────────────────────────────────────────────────────────────

const chatwootSchema = z.object({
  chatwootApiUrl: z.string().url("URL inválida").or(z.literal("")),
  chatwootApiToken: z.string().optional(),
  chatwootAccountId: z.coerce.number().int().positive().optional().or(z.literal("")),
});

const stageRuleSchema = z.object({
  stageId: z.string().min(1),
  targetFunnelId: z.string().min(1),
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
  entryMode: z.enum(["webhook", "stage_trigger"]).optional(),
  stageRules: z.array(stageRuleSchema).optional(),
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
  const [fetchingInboxes, setFetchingInboxes] = useState(false);
  const [availableInboxes, setAvailableInboxes] = useState<{ id: number; name: string; channelType: string; medium?: string }[]>([]);
  const [inboxSettings, setInboxSettings] = useState<Record<number, IInboxSetting>>({});
  const [savingInboxes, setSavingInboxes] = useState(false);

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

  useEffect(() => {
    if (crmSettings?.inboxSettings) {
      setInboxSettings(crmSettings.inboxSettings);
      // Restore previously saved inboxes so they show without re-fetching
      setAvailableInboxes((prev) => {
        const saved = Object.entries(crmSettings.inboxSettings!).map(([idStr, s]) => ({
          id: Number(idStr),
          name: s.label ?? `Inbox ${idStr}`,
          channelType: s.channelType ?? "",
        }));
        // Merge: keep any freshly fetched inboxes (have more metadata), fill gaps from saved
        if (prev.length === 0) return saved;
        const existingIds = new Set(prev.map((i) => i.id));
        const missing = saved.filter((i) => !existingIds.has(i.id));
        return [...prev, ...missing];
      });
    }
  }, [crmSettings]);

  async function handleFetchInboxes() {
    if (!dbUid || !user) return;
    setFetchingInboxes(true);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch(`/api/users/${dbUid}/chatwoot/inboxes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAvailableInboxes(data.inboxes ?? []);
        // Pre-populate settings for newly discovered inboxes
        setInboxSettings((prev) => {
          const next = { ...prev };
          for (const inbox of data.inboxes ?? []) {
            if (!(inbox.id in next)) {
              next[inbox.id] = { tracked: true, color: "#60a5fa", label: inbox.name, channelType: inbox.channelType };
            }
          }
          return next;
        });
      }
    } finally {
      setFetchingInboxes(false);
    }
  }

  async function handleSaveInboxes() {
    if (!dbUid) return;
    setSavingInboxes(true);
    try {
      const current: ICrmSettings = {
        ...(crmSettings ?? { funnels: { default: DEFAULT_FUNNEL }, defaultFunnelId: "default" }),
        inboxSettings,
      };
      await setSettings({ uid: dbUid, type: "crm", setting: current as any, merge: true });
    } finally {
      setSavingInboxes(false);
    }
  }

  // ── Funnel management ─────────────────────────────────────────────────────

  const defaultFunnelId = crmSettings?.defaultFunnelId ?? "default";
  const allFunnels = useMemo(
    () =>
      Object.values(crmSettings?.funnels ?? { default: DEFAULT_FUNNEL }).sort(
        (a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : a.name.localeCompare(b.name)),
      ),
    [crmSettings],
  );

  const [editingFunnelId, setEditingFunnelId] = useState<string | null>(null);
  const activeFunnelId = editingFunnelId ?? defaultFunnelId;
  const activeFunnel = crmSettings?.funnels?.[activeFunnelId] ?? DEFAULT_FUNNEL;
  const [funnelNameDraft, setFunnelNameDraft] = useState("");

  // Sync name draft when active funnel changes
  useEffect(() => {
    setFunnelNameDraft(activeFunnel.name);
  }, [activeFunnelId, crmSettings]);

  const stageForm = useForm<StageFormValues>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      stages: [...activeFunnel.stages].sort((a, b) => a.order - b.order),
      entryMode: activeFunnel.entryMode ?? "webhook",
      stageRules: activeFunnel.stageRules ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: stageForm.control,
    name: "stages",
  });

  const { fields: ruleFields, append: appendRule, remove: removeRule } = useFieldArray({
    control: stageForm.control,
    name: "stageRules",
  });

  useEffect(() => {
    stageForm.reset({
      stages: [...activeFunnel.stages].sort((a, b) => a.order - b.order),
      entryMode: activeFunnel.entryMode ?? "webhook",
      stageRules: activeFunnel.stageRules ?? [],
    });
  }, [activeFunnelId, crmSettings]);

  async function saveFunnel(values: StageFormValues) {
    if (!dbUid) return;
    const updatedStages = values.stages.map((s, i) => ({ ...s, order: i }));
    const updatedFunnel = {
      ...activeFunnel,
      name: funnelNameDraft || activeFunnel.name,
      stages: updatedStages,
      entryMode: values.entryMode ?? "webhook",
      stageRules: values.stageRules ?? [],
    };
    const current: ICrmSettings = {
      ...(crmSettings ?? {}),
      funnels: {
        ...(crmSettings?.funnels ?? {}),
        [activeFunnelId]: updatedFunnel,
      },
      defaultFunnelId,
    };
    await setSettings({ uid: dbUid, type: "crm", setting: current as any, merge: false });
  }

  function handleAddFunnel() {
    if (!dbUid) return;
    const newId = `funnel-${Date.now()}`;
    const newFunnel = {
      id: newId,
      name: "Novo Funil",
      isDefault: false,
      stages: [...DEFAULT_FUNNEL.stages],
    };
    const current: ICrmSettings = {
      ...(crmSettings ?? {}),
      funnels: {
        ...(crmSettings?.funnels ?? {}),
        [newId]: newFunnel,
      },
      defaultFunnelId,
    };
    setSettings({ uid: dbUid, type: "crm", setting: current as any, merge: false });
    setEditingFunnelId(newId);
  }

  async function handleDeleteFunnel(funnelId: string) {
    if (!dbUid) return;
    if (!window.confirm("Excluir este funil? Os leads associados não serão afetados.")) return;
    const { [funnelId]: _removed, ...rest } = crmSettings?.funnels ?? {};
    const newDefaultId = funnelId === defaultFunnelId
      ? (Object.keys(rest)[0] ?? "default")
      : defaultFunnelId;
    const current: ICrmSettings = {
      ...(crmSettings ?? {}),
      funnels: Object.keys(rest).length > 0 ? rest : { default: DEFAULT_FUNNEL },
      defaultFunnelId: newDefaultId,
    };
    await setSettings({ uid: dbUid, type: "crm", setting: current as any, merge: false });
    if (editingFunnelId === funnelId) setEditingFunnelId(null);
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
          <TabsTrigger value="inboxes">Canais</TabsTrigger>
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

        {/* ── Inboxes tab ──────────────────────────────────────────────── */}
        <TabsContent value="inboxes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Canais (Inboxes)</CardTitle>
              <CardDescription>
                Defina quais canais do Chatwoot criam leads automaticamente e configure a cor de identificação de cada um.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={fetchingInboxes}
                onClick={handleFetchInboxes}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${fetchingInboxes ? "animate-spin" : ""}`} />
                {fetchingInboxes ? "Buscando..." : "Buscar Canais do Chatwoot"}
              </Button>

              {availableInboxes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Clique em "Buscar Canais" para carregar os inboxes disponíveis no Chatwoot.
                </p>
              )}

              {availableInboxes.length > 0 && (
                <div className="space-y-3">
                  {availableInboxes.map((inbox) => {
                    const setting = inboxSettings[inbox.id] ?? { tracked: true, color: "#60a5fa", label: inbox.name };
                    return (
                      <div key={inbox.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                        <input
                          type="color"
                          value={setting.color}
                          onChange={(e) => setInboxSettings((prev) => ({
                            ...prev,
                            [inbox.id]: { ...setting, color: e.target.value },
                          }))}
                          className="w-8 h-8 rounded cursor-pointer border border-input flex-shrink-0"
                          title="Cor do canal"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">#{inbox.id} · {inbox.channelType}</p>
                          <input
                            type="text"
                            value={setting.label ?? inbox.name}
                            onChange={(e) => setInboxSettings((prev) => ({
                              ...prev,
                              [inbox.id]: { ...setting, label: e.target.value },
                            }))}
                            className="w-full bg-transparent text-sm font-medium border-b border-transparent hover:border-input focus:border-primary focus:outline-none py-0.5"
                            placeholder={inbox.name}
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={setting.tracked}
                            onChange={(e) => setInboxSettings((prev) => ({
                              ...prev,
                              [inbox.id]: { ...setting, tracked: e.target.checked },
                            }))}
                            className="w-4 h-4"
                          />
                          Rastrear
                        </label>
                        <Select
                          value={setting.funnelId ?? (crmSettings?.defaultFunnelId ?? "default")}
                          onValueChange={(value) => setInboxSettings((prev) => ({
                            ...prev,
                            [inbox.id]: { ...setting, funnelId: value },
                          }))}
                        >
                          <SelectTrigger className="w-40 h-8 text-xs flex-shrink-0">
                            <SelectValue placeholder="Funil" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(crmSettings?.funnels ?? { default: DEFAULT_FUNNEL })
                              .sort((a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : a.name.localeCompare(b.name)))
                              .map((funnel) => (
                                <SelectItem key={funnel.id} value={funnel.id} className="text-xs">
                                  {funnel.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}

                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      disabled={savingInboxes}
                      onClick={handleSaveInboxes}
                    >
                      <Inbox className="h-4 w-4 mr-2" />
                      {savingInboxes ? "Salvando..." : "Salvar Canais"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Funnel tab ───────────────────────────────────────────────── */}
        <TabsContent value="funnel" className="mt-4">
          <div className="flex gap-4">
            {/* Funnel list */}
            <div className="w-44 flex-shrink-0 space-y-1">
              {allFunnels.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setEditingFunnelId(f.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    f.id === activeFunnelId
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.name}
                  {f.isDefault && (
                    <span className="block text-[10px] opacity-70">Principal</span>
                  )}
                </button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2 border-dashed"
                onClick={handleAddFunnel}
              >
                <Plus size={12} className="mr-1" />
                Novo Funil
              </Button>
            </div>

            {/* Funnel editor */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={funnelNameDraft}
                    onChange={(e) => setFunnelNameDraft(e.target.value)}
                    className="text-base font-semibold bg-transparent border-b border-transparent hover:border-input focus:border-primary focus:outline-none w-full py-0.5"
                    placeholder="Nome do funil"
                  />
                  {!activeFunnel.isDefault && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => handleDeleteFunnel(activeFunnelId)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
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

                    <Separator className="my-3" />

                    {/* Entry mode */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Modo de Entrada</p>
                      <p className="text-xs text-muted-foreground">
                        Define como leads são criados neste funil.
                      </p>
                      <FormField
                        control={stageForm.control}
                        name="entryMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                value={field.value ?? "webhook"}
                                onValueChange={field.onChange}
                                className="space-y-1"
                              >
                                <label className="flex items-start gap-2 cursor-pointer">
                                  <RadioGroupItem value="webhook" className="mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">
                                    <span className="font-medium">Via Canal (Chatwoot)</span>
                                    <span className="block text-xs text-muted-foreground">Criado automaticamente por mensagens recebidas</span>
                                  </span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                  <RadioGroupItem value="stage_trigger" className="mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">
                                    <span className="font-medium">Via Transição de Etapa</span>
                                    <span className="block text-xs text-muted-foreground">Criado apenas quando um lead de outro funil atingir uma etapa configurada</span>
                                  </span>
                                </label>
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-3" />

                    {/* Stage transition rules */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Regras de Transição</p>
                      <p className="text-xs text-muted-foreground">
                        Quando um lead deste funil atingir a etapa abaixo, um novo lead será criado automaticamente no funil de destino.
                      </p>

                      {ruleFields.map((ruleField, index) => (
                        <div key={ruleField.id} className="flex items-center gap-2">
                          <FormField
                            control={stageForm.control}
                            name={`stageRules.${index}.stageId`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Etapa gatilho" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {[...activeFunnel.stages]
                                      .sort((a, b) => a.order - b.order)
                                      .map((s) => (
                                        <SelectItem key={s.id} value={s.id} className="text-xs">
                                          {s.label}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <span className="text-xs text-muted-foreground flex-shrink-0">→</span>

                          <FormField
                            control={stageForm.control}
                            name={`stageRules.${index}.targetFunnelId`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Funil destino" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {allFunnels
                                      .filter((f) => f.id !== activeFunnelId)
                                      .map((f) => (
                                        <SelectItem key={f.id} value={f.id} className="text-xs">
                                          {f.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={() => removeRule(index)}
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
                        onClick={() => appendRule({ stageId: "", targetFunnelId: "" })}
                        disabled={allFunnels.filter((f) => f.id !== activeFunnelId).length === 0}
                      >
                        <Plus size={14} className="mr-1" />
                        Adicionar Regra
                      </Button>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Salvando..." : "Salvar Funil"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrmSettingsPage;
