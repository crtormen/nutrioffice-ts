import { NavLink } from 'react-router-dom'
import { DollarSign, FileHeart, LayoutDashboard, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
// import { buttonVariants } from '@/components/ui/button'

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <div className="border-b py-4">
      <nav
        className={cn(
          'flex items-center gap-2 space-x-4 lg:space-x-6 max-w-[1200px] mx-auto',
          className,
        )}
        {...props}
      >
        <NavLink
          to="/"
          // className={cn(
          //   buttonVariants({ variant: "link" }),
          //   "py-1.5 px-3 inline-flex items-center text-sm gap-1.5 font-medium rounded-full border border-transparent transition-colors hover:text-primary  hover:border-primary"
          // )}
          className="py-1.5 px-3 inline-flex items-center text-sm gap-1.5 font-medium rounded-full border border-transparent transition-colors hover:text-primary hover:border-primary data-[state=active]:bg-primary"
        >
          <LayoutDashboard size="16" />
          Geral
        </NavLink>
        <NavLink
          to="/customers"
          className="py-1.5 px-3 inline-flex items-center text-sm gap-1.5 font-medium rounded-full border border-transparent transition-colors hover:text-primary  hover:border-primary data-[state=active]:bg-primary"
        >
          <Users size="16" />
          Clientes
        </NavLink>
        <NavLink
          to="/consultas"
          className="py-1.5 px-3 inline-flex items-center text-sm gap-1.5 font-medium rounded-full border border-transparent transition-colors hover:text-primary  hover:border-primary"
        >
          <FileHeart size="16" />
          Consultas
        </NavLink>
        <NavLink
          to="/finances"
          className="py-1.5 px-3 inline-flex items-center text-sm gap-1.5 font-medium rounded-full border border-transparent transition-colors hover:text-primary  hover:border-primary"
        >
          <DollarSign size="16" />
          Finanças
        </NavLink>
      </nav>
    </div>
  )
}
