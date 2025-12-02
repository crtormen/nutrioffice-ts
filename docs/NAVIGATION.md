# Navigation Component Usage

## PageHeader Component

The `PageHeader` component provides breadcrumb navigation and a back button for your pages.

### Props

```typescript
interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];  // Array of breadcrumb items
  title?: string;                  // Optional page title
  onBack?: () => void;            // Custom back handler
  backTo?: string;                // Specific route to navigate back to
  showBackButton?: boolean;       // Show/hide back button (default: true)
}

interface BreadcrumbItem {
  label: string;                  // Display text
  href?: string;                  // Link URL (omit for current page)
}
```

### Usage Examples

#### NewConsultaPage (Already Implemented)
```tsx
import { PageHeader } from "@/components/PageHeader";
import { ROUTES } from "@/app/router/routes";

const breadcrumbs = [
  { label: "Dashboard", href: ROUTES.DASHBOARD },
  { label: "Clientes", href: `/${ROUTES.CUSTOMERS.BASE}` },
  { label: customer?.name || "Cliente", href: ROUTES.CUSTOMERS.DETAILS(customerId!) },
  { label: "Nova Consulta" },
];

<PageHeader
  breadcrumbs={breadcrumbs}
  backTo={ROUTES.CUSTOMERS.DETAILS(customerId!)}
/>
```

#### CustomerDetailsPage Example
```tsx
const breadcrumbs = [
  { label: "Dashboard", href: ROUTES.DASHBOARD },
  { label: "Clientes", href: `/${ROUTES.CUSTOMERS.BASE}` },
  { label: customer?.name || "Detalhes" },
];

<PageHeader
  breadcrumbs={breadcrumbs}
  backTo={`/${ROUTES.CUSTOMERS.BASE}`}
/>
```

#### NewCustomerPage Example
```tsx
const breadcrumbs = [
  { label: "Dashboard", href: ROUTES.DASHBOARD },
  { label: "Clientes", href: `/${ROUTES.CUSTOMERS.BASE}` },
  { label: "Novo Cliente" },
];

<PageHeader
  breadcrumbs={breadcrumbs}
  backTo={`/${ROUTES.CUSTOMERS.BASE}`}
/>
```

#### ConsultaDetailsPage Example
```tsx
const breadcrumbs = [
  { label: "Dashboard", href: ROUTES.DASHBOARD },
  { label: "Clientes", href: `/${ROUTES.CUSTOMERS.BASE}` },
  { label: customer?.name || "Cliente", href: ROUTES.CUSTOMERS.DETAILS(customerId!) },
  { label: "Consultas", href: ROUTES.CUSTOMERS.DETAILS(customerId!) },
  { label: `Consulta ${consulta?.date || ""}` },
];

<PageHeader
  breadcrumbs={breadcrumbs}
  backTo={ROUTES.CUSTOMERS.DETAILS(customerId!)}
/>
```

#### SettingsPage Example
```tsx
const breadcrumbs = [
  { label: "Dashboard", href: ROUTES.DASHBOARD },
  { label: "Configurações" },
];

<PageHeader
  breadcrumbs={breadcrumbs}
  showBackButton={false}  // Optional: hide back button for top-level pages
/>
```

### Features

1. **Automatic Back Navigation**: By default, navigates to previous page using `navigate(-1)`
2. **Specific Route**: Use `backTo` prop to navigate to a specific route
3. **Custom Handler**: Use `onBack` prop for custom back button behavior
4. **Breadcrumb Links**: All breadcrumb items except the last one are clickable links
5. **Current Page**: The last breadcrumb item is displayed as plain text (current page)

### Best Practices

1. Always use `ROUTES` constants from `@/app/router/routes` instead of hardcoding paths
2. Include customer/entity names in breadcrumbs when available for better context
3. For detail pages, link back to the parent list page
4. For create/edit pages, link back to the detail or list page
5. Use meaningful labels that match your navigation structure

### Styling

The component uses Tailwind CSS and shadcn/ui components:
- Back button: Ghost variant with icon-only size
- Breadcrumbs: Standard shadcn/ui breadcrumb styling
- Spacing: `mb-6 space-y-2` for consistent page spacing
