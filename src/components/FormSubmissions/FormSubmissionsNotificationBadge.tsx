import { FileCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/infra/firebase/hooks/useAuth";
import { selectPendingSubmissionsCount } from "@/app/state/features/formSubmissionsSlice";
import { useFetchFormSubmissionsQuery } from "@/app/state/features/formSubmissionsSlice";
import { useAppSelector } from "@/app/state/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/app/router/routes";

export function FormSubmissionsNotificationBadge() {
  const { dbUid } = useAuth();

  // Fetch submissions to populate the cache (enables real-time updates)
  useFetchFormSubmissionsQuery(dbUid || "", {
    skip: !dbUid,
  });

  // Select pending count from the cache
  const pendingCount = useAppSelector((state) =>
    selectPendingSubmissionsCount(dbUid)(state)
  );

  if (!dbUid || pendingCount === 0) {
    return null;
  }

  return (
    <Link to={ROUTES.FORM_SUBMISSIONS}>
      <Button variant="ghost" size="icon" className="relative">
        <FileCheck className="h-5 w-5" />
        {pendingCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
          >
            {pendingCount > 9 ? "9+" : pendingCount}
          </Badge>
        )}
        <span className="sr-only">
          {pendingCount} submissões pendentes
        </span>
      </Button>
    </Link>
  );
}
