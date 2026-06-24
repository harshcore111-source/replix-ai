import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, LayoutDashboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { ReplyGenerator } from "@/components/ReplyGenerator";
import { getProfile, getUsage } from "@/lib/profile.functions";
import { PLAN_LIMITS } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home — Replix.ai" }] }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const getUsageFn = useServerFn(getUsage);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const { data: usage } = useQuery({ queryKey: ["usage"], queryFn: () => getUsageFn() });

  useEffect(() => {
    if (profile && !profile.onboarded) navigate({ to: "/onboarding" });
  }, [profile, navigate]);

  const used = usage?.replies_used ?? 0;
  const plan = (usage?.plan_type ?? "free") as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[plan];
  const pct = Math.min(100, (used / limit) * 100);
  const nearLimit = pct >= 80;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Hello{profile?.business_name ? `, ${profile.business_name}` : ""}</p>
            <h1 className="text-3xl font-bold md:text-4xl">Generate a reply</h1>
          </div>
          <Button asChild variant="outline">
            <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Open dashboard</Link>
          </Button>
        </div>

        <div className="mb-5 rounded-xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{used} / {limit} replies used this cycle</p>
              <p className="text-xs text-muted-foreground capitalize">{plan} plan</p>
            </div>
            {nearLimit && (
              <Button asChild size="sm" className="brand-gradient text-primary-foreground">
                <Link to="/pricing">Upgrade <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
            )}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className={`h-full transition-all ${nearLimit ? "bg-destructive" : "brand-gradient"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <ReplyGenerator
          mode="auth"
          defaults={{
            language: profile?.default_language,
            tone: profile?.default_tone,
            length: profile?.default_length,
            customInstruction: profile?.custom_instruction ?? undefined,
            businessName: profile?.business_name ?? undefined,
          }}
        />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Sparkles className="mr-1 inline h-3 w-3 text-primary" /> Replies are not stored unless you save them to your dashboard.
        </p>
      </div>
    </div>
  );
}
