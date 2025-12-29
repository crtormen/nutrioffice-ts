import { Shield } from "lucide-react";

import { useFetchRolePermissionsQuery } from "@/app/state/features/permissionsSlice";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Abilities,
  ACCESS_LEVELS,
  Resource,
  RESOURCES,
} from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

interface PermissionsBadgesProps {
  role: Abilities;
  professionalId?: string;
  compact?: boolean;
}

const PermissionsBadges = ({
  role,
  professionalId,
  compact = false,
}: PermissionsBadgesProps) => {
  const { dbUid } = useAuth();
  const uid = professionalId || dbUid || "";

  const { data: permissions } = useFetchRolePermissionsQuery(
    { uid, role },
    { skip: !uid },
  );

  if (!permissions) {
    return null;
  }

  // Get resources with write access
  const writeAccess = Object.entries(permissions)
    .filter(([_, level]) => level === "write")
    .map(([resource]) => resource as Resource);

  // Get resources with read access
  const readAccess = Object.entries(permissions)
    .filter(([_, level]) => level === "read")
    .map(([resource]) => resource as Resource);

  if (compact) {
    // Compact view - just show count
    const accessCount = writeAccess.length + readAccess.length;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              {accessCount} permissões
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              {writeAccess.length > 0 && (
                <div>
                  <p className="font-medium text-green-600">
                    Leitura e escrita:
                  </p>
                  <p className="text-xs">
                    {writeAccess.map((r) => RESOURCES[r].text).join(", ")}
                  </p>
                </div>
              )}
              {readAccess.length > 0 && (
                <div>
                  <p className="font-medium text-blue-600">Somente leitura:</p>
                  <p className="text-xs">
                    {readAccess.map((r) => RESOURCES[r].text).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full view - show all permissions as badges
  return (
    <div className="flex flex-wrap gap-1">
      {writeAccess.map((resource) => (
        <Badge key={resource} variant="default" className="text-xs">
          {RESOURCES[resource].text}: {ACCESS_LEVELS.write.text}
        </Badge>
      ))}
      {readAccess.map((resource) => (
        <Badge key={resource} variant="secondary" className="text-xs">
          {RESOURCES[resource].text}: {ACCESS_LEVELS.read.text}
        </Badge>
      ))}
      {writeAccess.length === 0 && readAccess.length === 0 && (
        <Badge variant="outline" className="text-xs">
          Sem permissões configuradas
        </Badge>
      )}
    </div>
  );
};

export default PermissionsBadges;
