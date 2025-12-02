# Permissions System Guide

## Overview

The NutriOffice permissions system provides granular, role-based access control (RBAC) for different features and resources in the application.

## Architecture

### Storage
Permissions are stored in Firestore:
```
users/{professionalId}/settings/permissions
{
  rolePermissions: {
    SECRETARY: {
      customers: "write",
      consultas: "write",
      anamnesis: "read",
      finances: "read",
      analytics: "read",
      settings: "none"
    },
    // ... other roles
  },
  updatedAt: Timestamp
}
```

### Resources
- `customers` - Patient/customer management
- `consultas` - Consultation scheduling and management
- `anamnesis` - Anamnesis forms and records
- `finances` - Financial operations and payments
- `analytics` - Reports and analytics
- `settings` - System settings and configurations

### Access Levels
- `none` - No access to the resource
- `read` - Can view but not modify
- `write` - Full access (view, create, edit, delete)

## Usage

### 1. Configure Permissions (Professional Only)

Navigate to **Settings → Preferences Tab**

The PermissionsMatrix component allows you to:
- View all roles and their permissions in a table
- Change access levels using dropdowns
- Save changes or restore to defaults

```tsx
// Already implemented in PreferencesTab
<PermissionsMatrix />
```

### 2. Using Permission Hooks

#### Check any permission
```tsx
import { usePermissions } from "@/hooks/usePermissions";

function MyComponent() {
  const { can, canRead, canWrite, isProfessional } = usePermissions();

  // Check specific permission
  if (can("customers", "write")) {
    // User can create/edit customers
  }

  // Check read permission
  if (canRead("finances")) {
    // User can view finances
  }

  // Check write permission
  if (canWrite("consultas")) {
    // User can create/edit consultas
  }

  // Check if professional
  if (isProfessional) {
    // Full access to everything
  }
}
```

#### Simple permission hooks
```tsx
import { useCanWrite, useCanRead } from "@/hooks/usePermissions";

function CreateButton() {
  const canCreate = useCanWrite("customers");

  return (
    <Button disabled={!canCreate}>
      Create Customer
    </Button>
  );
}
```

### 3. Permission Guard Components

#### Full Guard with Alert
```tsx
import { PermissionGuard } from "@/components/Permissions/PermissionGuard";

function MyPage() {
  return (
    <PermissionGuard resource="finances" level="read">
      <FinancialReport />
    </PermissionGuard>
  );
}
// Shows "Access Denied" alert if user doesn't have permission
```

#### Guard with Redirect
```tsx
<PermissionGuard
  resource="settings"
  level="write"
  redirect="/dashboard"
>
  <SettingsPage />
</PermissionGuard>
// Redirects to /dashboard if no permission
```

#### Guard with Custom Fallback
```tsx
<PermissionGuard
  resource="customers"
  level="write"
  fallback={<p>You can only view customers</p>}
  showAlert={false}
>
  <CreateCustomerForm />
</PermissionGuard>
```

#### Simple Wrappers
```tsx
import { CanRead, CanWrite } from "@/components/Permissions/PermissionGuard";

function CustomersPage() {
  return (
    <div>
      <CanRead resource="customers">
        <CustomersList />
      </CanRead>

      <CanWrite resource="customers">
        <CreateCustomerButton />
      </CanWrite>
    </div>
  );
}
```

### 4. Protecting Routes

#### In Route Definitions
```tsx
import { PermissionGuard } from "@/components/Permissions/PermissionGuard";

// In your route file
<Route
  path="finances"
  element={
    <PermissionGuard resource="finances" level="read" redirect="/dashboard">
      <FinancesPage />
    </PermissionGuard>
  }
/>
```

#### With RequireAuthLayout
```tsx
<Route
  path="settings"
  element={
    <RequireAuthLayout allowedRoles={["PROFESSIONAL"]}>
      <PermissionGuard resource="settings" level="write">
        <SettingsPage />
      </PermissionGuard>
    </RequireAuthLayout>
  }
/>
```

### 5. Conditional UI Elements

#### Hide/Show Buttons
```tsx
import { useCanWrite } from "@/hooks/usePermissions";

function CustomerActions() {
  const canEdit = useCanWrite("customers");
  const canDelete = useCanWrite("customers");

  return (
    <div>
      {canEdit && <Button>Edit</Button>}
      {canDelete && <Button>Delete</Button>}
    </div>
  );
}
```

#### Disable Buttons
```tsx
function FinanceActions() {
  const { canWrite } = usePermissions();

  return (
    <Button disabled={!canWrite("finances")}>
      Create Payment
    </Button>
  );
}
```

#### Navigation Links
```tsx
import { usePermissions } from "@/hooks/usePermissions";

function Sidebar() {
  const { canAccess } = usePermissions();

  return (
    <nav>
      {canAccess("customers") && <NavLink to="/customers">Patients</NavLink>}
      {canAccess("finances") && <NavLink to="/finances">Finances</NavLink>}
      {canAccess("analytics") && <NavLink to="/analytics">Reports</NavLink>}
    </nav>
  );
}
```

### 6. Display Permissions

#### Show User Permissions
```tsx
import PermissionsBadges from "@/components/Permissions/PermissionsBadges";

function UserProfile({ userRole }) {
  return (
    <div>
      <h3>Permissions:</h3>
      <PermissionsBadges role={userRole} compact />
    </div>
  );
}
```

#### In Collaborators Table
```tsx
// Already implemented in CollaboratorsTab
<PermissionsBadges
  role={collaboratorRole}
  professionalId={dbUid}
  compact
/>
```

## Default Permissions

### PROFESSIONAL / ADMIN
Full access to everything:
```typescript
{
  customers: "write",
  consultas: "write",
  anamnesis: "write",
  finances: "write",
  analytics: "write",
  settings: "write"
}
```

### COLLABORATOR
Medical/clinical focus:
```typescript
{
  customers: "write",
  consultas: "write",
  anamnesis: "write",
  finances: "none",
  analytics: "read",
  settings: "none"
}
```

### SECRETARY
Administrative focus:
```typescript
{
  customers: "write",
  consultas: "write",
  anamnesis: "read",
  finances: "read",
  analytics: "read",
  settings: "none"
}
```

### MARKETING
Limited to reports:
```typescript
{
  customers: "read",
  consultas: "read",
  anamnesis: "none",
  finances: "none",
  analytics: "write",
  settings: "none"
}
```

### FINANCES
Financial focus:
```typescript
{
  customers: "read",
  consultas: "read",
  anamnesis: "none",
  finances: "write",
  analytics: "read",
  settings: "none"
}
```

## Common Patterns

### Pattern 1: Page-Level Protection
```tsx
// pages/FinancesPage.tsx
import { PermissionGuard } from "@/components/Permissions/PermissionGuard";

const FinancesPage = () => {
  return (
    <PermissionGuard resource="finances" level="read">
      <div>
        {/* Page content */}
      </div>
    </PermissionGuard>
  );
};
```

### Pattern 2: Action-Level Protection
```tsx
// components/CustomerCard.tsx
import { useCanWrite } from "@/hooks/usePermissions";

const CustomerCard = ({ customer }) => {
  const canEdit = useCanWrite("customers");

  return (
    <Card>
      <CardHeader>{customer.name}</CardHeader>
      <CardFooter>
        <Button disabled={!canEdit}>Edit</Button>
      </CardFooter>
    </Card>
  );
};
```

### Pattern 3: Multi-Level Access
```tsx
import { usePermissions } from "@/hooks/usePermissions";

const ConsultaForm = () => {
  const { canRead, canWrite } = usePermissions();

  if (!canRead("consultas")) {
    return <AccessDenied />;
  }

  const isReadOnly = !canWrite("consultas");

  return (
    <form>
      <input disabled={isReadOnly} />
      {canWrite("consultas") && <Button type="submit">Save</Button>}
    </form>
  );
};
```

### Pattern 4: Role-Based Rendering
```tsx
const Dashboard = () => {
  const { isProfessional, canAccess } = usePermissions();

  return (
    <div className="grid gap-4">
      {isProfessional && <AdminPanel />}
      {canAccess("finances") && <FinancialSummary />}
      {canAccess("analytics") && <ReportsWidget />}
    </div>
  );
};
```

## API Reference

### Hooks

#### `usePermissions()`
Returns all permission checking functions:
- `userRole: Abilities` - Current user's role
- `rolePermissions: RolePermissions` - Full permissions object
- `can(resource, level): boolean` - Check specific permission
- `canRead(resource): boolean` - Check read access
- `canWrite(resource): boolean` - Check write access
- `canAccess(resource): boolean` - Check any access
- `getPermissionLevel(resource): AccessLevel` - Get permission level
- `isProfessional: boolean` - Check if user is professional

#### `useHasPermission(resource, level)`
Returns `boolean` - true if user has specified permission

#### `useCanRead(resource)`
Returns `boolean` - true if user can read resource

#### `useCanWrite(resource)`
Returns `boolean` - true if user can write to resource

### Components

#### `<PermissionGuard>`
Props:
- `resource: Resource` - Resource to check
- `level: AccessLevel` - Required access level
- `children: ReactNode` - Protected content
- `fallback?: ReactNode` - Custom fallback content
- `redirect?: string` - Redirect path if no access
- `showAlert?: boolean` - Show default alert (default: true)

#### `<CanRead>` / `<CanWrite>`
Props:
- `resource: Resource` - Resource to check
- `children: ReactNode` - Protected content
- `fallback?: ReactNode` - Custom fallback content

#### `<PermissionsBadges>`
Props:
- `role: Abilities` - Role to display permissions for
- `professionalId?: string` - Professional's UID
- `compact?: boolean` - Compact view (default: false)

### Services

#### `PermissionsService(uid)`
- `get()` - Get permissions configuration
- `update(rolePermissions)` - Update permissions
- `reset()` - Reset to defaults
- `getForRole(role)` - Get permissions for specific role

### RTK Query

#### Queries
- `useFetchPermissionsQuery(uid)` - Fetch full config
- `useFetchRolePermissionsQuery({ uid, role })` - Fetch for role

#### Mutations
- `useUpdatePermissionsMutation()` - Update permissions
- `useResetPermissionsMutation()` - Reset to defaults

## Testing Permissions

1. **Configure permissions** in Settings → Preferences
2. **Login as collaborator** with specific role
3. **Verify UI elements** are hidden/disabled appropriately
4. **Test navigation** to protected routes
5. **Check Firestore rules** enforce permissions on backend

## Best Practices

1. **Always protect sensitive actions** - Use `CanWrite` for create/edit/delete operations
2. **Provide user feedback** - Show why access is denied or buttons are disabled
3. **Test with multiple roles** - Ensure each role sees appropriate UI
4. **Use compound permissions** - Combine role checks with permissions when needed
5. **Keep UX smooth** - Hide rather than disable when appropriate
6. **Document custom permissions** - If you add new resources, update this guide

## Troubleshooting

### Permissions not updating
- Ensure Firestore rules allow read/write to `users/{uid}/settings/permissions`
- Check that professional UID is correct
- Verify permissions document exists in Firestore

### User has no permissions
- Check user's role in custom claims
- Verify `contributesTo` field points to correct professional
- Ensure permissions config exists or defaults are being used

### Permission checks always fail
- Verify user is authenticated
- Check that `dbUid` is set correctly in AuthContext
- Ensure role is properly set in user document and custom claims
