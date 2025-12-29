import { Moon, Sun } from "lucide-react";

import { useUpdateThemeMutation } from "@/app/state/features/themeSlice";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppTheme } from "@/contexts/ThemeContext";
import { ThemeMode } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

export function ThemeToggle() {
  const { theme } = useAppTheme();
  const { dbUid } = useAuth();
  const [updateTheme] = useUpdateThemeMutation();

  const handleThemeChange = async (mode: ThemeMode) => {
    if (!dbUid) return;

    try {
      await updateTheme({
        uid: dbUid,
        theme: { mode },
      }).unwrap();
    } catch (error) {
      console.error("Error updating theme mode:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
