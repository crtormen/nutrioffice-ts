import {
  Contact,
  DollarSign,
  FileHeart,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
// import { buttonVariants } from '@/components/ui/button'

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <div className="border-b py-4">
      <nav
        className={cn(
          "mx-auto flex max-w-[1200px] items-center gap-2 space-x-4 lg:space-x-6",
          className,
        )}
        {...props}
      >
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive
              ? "inline-flex items-center gap-1.5 rounded-full border border-transparent bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors"
              : "inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          }
        >
          <LayoutDashboard size="16" />
          Geral
        </NavLink>
        <NavLink
          to="/customers"
          className={({ isActive }) =>
            isActive
              ? "inline-flex items-center gap-1.5 rounded-full border border-transparent bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors"
              : "inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          }
        >
          <Users size="16" />
          Clientes
        </NavLink>
        <NavLink
          to="/consultas"
          className={({ isActive }) =>
            isActive
              ? "inline-flex items-center gap-1.5 rounded-full border border-transparent bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors"
              : "inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          }
        >
          <FileHeart size="16" />
          Consultas
        </NavLink>
        <NavLink
          to="/finances"
          className={({ isActive }) =>
            isActive
              ? "inline-flex items-center gap-1.5 rounded-full border border-transparent bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors"
              : "inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          }
        >
          <DollarSign size="16" />
          Finanças
        </NavLink>
        <NavLink
          to="/crm"
          className={({ isActive }) =>
            isActive
              ? "inline-flex items-center gap-1.5 rounded-full border border-transparent bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors"
              : "inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          }
        >
          <Contact size="16" />
          CRM
        </NavLink>
      </nav>
    </div>
  );
}
