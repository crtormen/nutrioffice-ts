"use client";

import { NavLink } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    link: string;
    title: string;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className,
      )}
      {...props}
    >
      {items.map((item, i) => (
        <NavLink
          key={i}
          to={item.link}
          className={({ isActive }) =>
            isActive
              ? cn(buttonVariants({ variant: "secondary" }), "justify-start")
              : cn(
                  buttonVariants({ variant: "ghost" }),
                  "hover:bg-transparent hover:underline",
                  "justify-start",
                )
          }
          end
        >
          {item.title}
        </NavLink>
      ))}
    </nav>
  );
}
