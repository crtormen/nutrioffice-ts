// import { MainNav } from './MainNav'
// import { Search } from './Search'
import { UserNav } from './UserNav'
// import { Separator } from '@/components/ui/separator'
import logo from '@/assets/images/logo-80px.png'

const MainHeader = () => (
  <>
    <div className="max-w-6xl mx-auto">
      <div className="flex h-16 items-center">
        <div className="relative z-20 flex items-center text-lg font-medium px-10">
          <div className="text-center pr-4">
            <img alt="logo nutri office" src={logo} className="w-12" />
          </div>
          NutriOffice
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {/* <Search /> */}
          <UserNav />
        </div>
      </div>
    </div>
  </>
)

export default MainHeader
