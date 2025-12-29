import { ShieldAlert } from "lucide-react";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AccessLevel, Resource } from "@/domain/entities";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGuardProps {
  resource: Resource;
  level: AccessLevel;
  children: ReactNode;
  fallback?: ReactNode;
  redirect?: string;
  showAlert?: boolean;
}

/**
 * Permission Guard Component
 * Protects content based on user permissions
 *
 * Usage:
 * ```tsx
 * <PermissionGuard resource="customers" level="write">
 *   <CreateCustomerButton />
 * </PermissionGuard>
 * ```
 */
export const PermissionGuard = ({
  resource,
  level,
  children,
  fallback,
  redirect,
  showAlert = true,
}: PermissionGuardProps) => {
  const { can } = usePermissions();

  const hasAccess = can(resource, level);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Redirect if specified
  if (redirect) {
    return <Navigate to={redirect} replace />;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show default alert if enabled
  if (showAlert) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar este recurso.
        </AlertDescription>
      </Alert>
    );
  }

  // Hide content by default
  return null;
};

/**
 * Simple wrapper for read permission
 */
export const CanRead = ({
  resource,
  children,
  fallback,
}: {
  resource: Resource;
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  return (
    <PermissionGuard
      resource={resource}
      level="read"
      fallback={fallback}
      showAlert={false}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * Simple wrapper for write permission
 */
export const CanWrite = ({
  resource,
  children,
  fallback,
}: {
  resource: Resource;
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  return (
    <PermissionGuard
      resource={resource}
      level="write"
      fallback={fallback}
      showAlert={false}
    >
      {children}
    </PermissionGuard>
  );
};
