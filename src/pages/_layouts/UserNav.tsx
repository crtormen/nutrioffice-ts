import { KeyRound, LogOut, Settings, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// import avatar from "@/assets/images/avatar.jpg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/infra/firebase";
import { getInitials } from "@/lib/utils";

export function UserNav() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  const image = user?.photoURL ? user.photoURL : undefined;

  // Handle user logout
  const handleSignOut = () => {
    signout(
      () => navigate("/login"), // Redirect to the login page after logout
    ).catch((error) => {
      console.error(error);
      toast.error("Um erro ocorreu ao fazer o logout. Tente novamente.");
    });
  };
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-sm font-medium">{user?.displayName}</span>
        <span className="text-xs text-muted-foreground">{user?.email}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 select-none rounded-full"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={image} alt="@shadcn" />
              <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.displayName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to="/user/profile">
                <UserRound className="mr-2 h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <KeyRound className="mr-2 h-4 w-4" />
              Assinatura
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/user/settings">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
