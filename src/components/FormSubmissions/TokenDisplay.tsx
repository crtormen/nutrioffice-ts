import { useState } from "react";
import { Copy, Check, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TokenDisplayProps {
  token: string;
  type: "online" | "presencial";
}

export function TokenDisplay({ token, type }: TokenDisplayProps) {
  const [copied, setCopied] = useState(false);

  const formUrl = `${window.location.origin}/anamnesis/public/${token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  const handleOpenInNewTab = () => {
    window.open(formUrl, "_blank");
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`token-${type}`}>Link Público</Label>
        <div className="flex gap-2">
          <Input
            id={`token-${type}`}
            value={formUrl}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copiar link</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleOpenInNewTab}
            className="shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">Abrir em nova aba</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Compartilhe este link com pacientes que farão consultas{" "}
          {type === "online" ? "online (remotas)" : "presenciais"}
        </p>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <QrCode className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Código do Token</p>
            <p className="font-mono text-xs text-muted-foreground break-all">{token}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
