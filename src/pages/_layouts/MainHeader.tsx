// import { MainNav } from './MainNav'
// import { Search } from './Search'
// import { Separator } from '@/components/ui/separator'
import logo from "@/assets/images/logo.png";
import { FormSubmissionsNotificationBadge } from "@/components/FormSubmissions/FormSubmissionsNotificationBadge";
import { ThemeToggle } from "@/components/theme/theme-toggle";

import { UserNav } from "./UserNav";

const MainHeader = () => (
  <>
    <div className="mx-auto max-w-6xl">
      <div className="flex h-16 items-center">
        <div className="relative z-20 flex items-center px-10 text-lg font-medium">
          <div className="pr-4 text-center">
            <img alt="logo nutri office" src={logo} className="w-12" />
          </div>
          NutriOffice
        </div>
        <div className="ml-auto flex items-center space-x-4 px-10">
          <FormSubmissionsNotificationBadge />
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </div>
  </>
);

export default MainHeader;
