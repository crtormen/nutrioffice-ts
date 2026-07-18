export interface IFunnelStage {
  id: string;
  label: string;
  color: string;
  order: number;
}

export interface IFunnelStageRule {
  stageId: string;
  targetFunnelId: string;
}

export interface IFunnel {
  id: string;
  name: string;
  stages: IFunnelStage[];
  isDefault?: boolean;
  stageRules?: IFunnelStageRule[];
  entryMode?: "webhook" | "stage_trigger";
}

export interface IInboxSetting {
  tracked: boolean;
  color: string;
  label?: string;
  channelType?: string;
  funnelId?: string;
}

export interface ICrmSettings {
  funnels: Record<string, IFunnel>;
  chatwootApiUrl?: string;
  chatwootApiToken?: string;
  chatwootAccountId?: number;
  defaultFunnelId?: string;
  inboxSettings?: Record<number, IInboxSetting>;
}

export const DEFAULT_FUNNEL_STAGES: IFunnelStage[] = [
  { id: "novo-lead",        label: "Novo Lead",        color: "#94a3b8", order: 0 },
  { id: "qualificado",      label: "Qualificado",      color: "#60a5fa", order: 1 },
  { id: "proposta-enviada", label: "Proposta Enviada", color: "#f59e0b", order: 2 },
  { id: "negociacao",       label: "Negociação",       color: "#a78bfa", order: 3 },
  { id: "convertido",       label: "Convertido",       color: "#34d399", order: 4 },
  { id: "perdido",          label: "Perdido",          color: "#f87171", order: 5 },
];

export const DEFAULT_FUNNEL: IFunnel = {
  id: "default",
  name: "Funil Principal",
  isDefault: true,
  stages: DEFAULT_FUNNEL_STAGES,
};

export const DEFAULT_CRM_SETTINGS: ICrmSettings = {
  funnels: { default: DEFAULT_FUNNEL },
  defaultFunnelId: "default",
};
