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

const mainNavItems = [
  {
    title: "Home",
    link: "/",
    icon: <LayoutDashboard size="16" />,
  },
  {
    title: "Clientes",
    link: "/customers",
    icon: <Users size="16" />,
  },
  {
    title: "Consultas",
    link: "/consultas",
    icon: <FileHeart size="16" />,
  },
  {
    title: "Finanças",
    link: "/finances",
    icon: <DollarSign size="16" />,
  },
  {
    title: "CRM",
    link: "/crm",
    icon: <Contact size="16" />,
  },
];

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
        {mainNavItems.map((item, i) => (
          <NavLink
            key={i}
            to={item.link}
            className={({ isActive }) =>
              isActive
                ? "inline-flex items-center gap-1.5 rounded-full border border-transparent bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors"
                : "inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            }
          >
            {item.icon}
            {item.title}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
