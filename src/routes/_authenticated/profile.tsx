import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, CreditCard, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { getProfile, getUsage } from "@/lib/profile.functions";
import { PLAN_LIMITS } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Replix.ai" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const getProfileFn = useServerFn(getProfile);
  const usageFn = useServerFn(getUsage);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const { data: usage } = useQuery({ queryKey: ["usage"], queryFn: () => usageFn() });
  const plan = (usage?.plan_type ?? "free") as keyof typeof PLAN_LIMITS;

  const signOut = async () => {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="mb-6 text-3xl font-bold md:text-4xl">Profile</h1>
        <Card className="border-border/60">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full brand-gradient text-xl font-bold text-primary-foreground">
                {(user?.email ?? "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user?.email}</p>
                <p className="text-sm text-muted-foreground">{profile?.business_name ?? "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Info label="Plan" value={plan} />
              <Info label="Replies used" value={`${usage?.replies_used ?? 0} / ${PLAN_LIMITS[plan]}`} />
              <Info label="Business type" value={profile?.business_type ?? "—"} />
              <Info label="Language" value={profile?.default_language ?? "—"} />
            </div>
            <div className="flex flex-wrap gap-2 pt-3">
              <Button asChild variant="outline"><Link to="/settings"><UserIcon className="mr-2 h-4 w-4" /> Edit preferences</Link></Button>
              <Button asChild variant="outline"><Link to="/pricing"><CreditCard className="mr-2 h-4 w-4" /> Manage plan</Link></Button>
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium capitalize">{value}</p>
    </div>
  );
}
