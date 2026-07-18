import { Contact, Plus, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/state/hooks";

import { ROUTES } from "@/app/router/routes";
import { useFetchLeadsQuery } from "@/app/state/features/leadsSlice";
import {
  selectCrmSettings,
  useFetchSettingsQuery,
} from "@/app/state/features/settingsSlice";
import { KanbanBoard } from "@/components/CRM/KanbanBoard";
import { AddLeadDialog } from "@/components/CRM/AddLeadDialog";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_FUNNEL } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

const CrmPage = () => {
  const { dbUid } = useAuth();
  const navigate = useNavigate();
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);

  useFetchSettingsQuery(dbUid, { skip: !dbUid });
  const selectSettings = useMemo(() => selectCrmSettings(dbUid), [dbUid]);
  const crmSettings = useAppSelector(selectSettings);

  const { data: allLeads = [] } = useFetchLeadsQuery(dbUid, { skip: !dbUid });

  const defaultFunnelId = crmSettings?.defaultFunnelId ?? "default";
  const activeFunnelId = selectedFunnelId ?? defaultFunnelId;
  const funnel = crmSettings?.funnels?.[activeFunnelId] ?? DEFAULT_FUNNEL;

  const funnelList = useMemo(
    () =>
      Object.values(crmSettings?.funnels ?? { default: DEFAULT_FUNNEL }).sort(
        (a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : a.name.localeCompare(b.name)),
      ),
    [crmSettings],
  );

  const leads = allLeads.filter((l) => !l.isArchived && l.funnelId === activeFunnelId);

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "CRM" },
  ];

  return (
    <div className="space-y-6 p-6 md:p-10">
      <PageHeader breadcrumbs={breadcrumbs} showBackButton={false} />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Contact className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">CRM</h2>
          </div>
          <p className="text-muted-foreground">
            Gerencie seus leads e funil de conversão
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTES.CRM.SETTINGS)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Configurações
          </Button>
          <Button size="sm" onClick={() => setAddLeadOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Lead
          </Button>
        </div>
      </div>

      <Separator />

      {funnelList.length > 1 && (
        <Tabs value={activeFunnelId} onValueChange={setSelectedFunnelId}>
          <TabsList>
            {funnelList.map((f) => (
              <TabsTrigger key={f.id} value={f.id}>
                {f.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <KanbanBoard funnel={funnel} leads={leads} />

      <AddLeadDialog
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        funnel={funnel}
      />
    </div>
  );
};

export default CrmPage;
