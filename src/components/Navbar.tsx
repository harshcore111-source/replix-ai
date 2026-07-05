import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Menu, LayoutDashboard, Home, CreditCard, Settings, User, LogOut, Moon, Sun, Sparkles, Wand2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link to={user ? "/home" : "/"} className="flex items-center">
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link
                to="/pricing"
                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
              >
                Pricing
              </Link>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="brand-gradient text-primary-foreground shadow-pop">
                <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/home" })}>
                  <Home className="mr-2 h-4 w-4" /> Home
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/pricing" })}>
                  <CreditCard className="mr-2 h-4 w-4" /> Pricing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggle}>
                  {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          )}
        </div>
      </div>
      {user && (
        <Link
          to="/home"
          className="sr-only"
          aria-label="Generate review shortcut"
        >
          <Sparkles className="h-4 w-4" /> Generate
        </Link>
      )}
    </header>
  );
}
