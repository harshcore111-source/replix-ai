import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { PLANS, type PlanType } from "@/lib/plans";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getUsage } from "@/lib/profile.functions";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Replix.ai" },
      { name: "description", content: "Simple, honest pricing. Start free with 30 AI replies a month. Upgrade only when you love it." },
      { property: "og:title", content: "Replix.ai Pricing" },
      { property: "og:description", content: "Free, Starter ₹199/mo, Growth ₹399/mo." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const getUsageFn = useServerFn(getUsage);
  const { data } = useQuery({
    queryKey: ["usage"],
    queryFn: () => getUsageFn(),
    retry: false,
  });
  const currentPlan = (data?.plan_type ?? null) as PlanType | null;

  // Per spec: hide lower plans for paid users; hide Free after first visit.
  let visible = PLANS;
  if (currentPlan === "starter") visible = PLANS.filter((p) => p.id !== "free");
  if (currentPlan === "growth") visible = PLANS.filter((p) => p.id === "growth");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Pricing
          </div>
          <h1 className="text-4xl font-bold md:text-5xl">Pick a plan that fits your reviews</h1>
          <p className="mt-3 text-muted-foreground">All plans include English + Hinglish, smart negative handling, and dashboard access.</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {visible.map((p) => {
            const isCurrent = currentPlan === p.id;
            return (
              <Card key={p.id} className={`relative border-border/60 ${p.id === "starter" ? "ring-2 ring-primary shadow-pop" : ""}`}>
                {p.badge && !isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full brand-gradient px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {p.badge}
                  </span>
                )}
                <CardContent className="p-6">
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{p.name}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.cadence}</span>
                  </div>
                  {p.perDay && <p className="text-xs text-primary">{p.perDay}</p>}
                  <p className="mt-2 text-sm text-muted-foreground">{p.blurb}</p>
                  <ul className="mt-5 space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-success" /> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button disabled className="mt-6 w-full" variant="secondary">You're on {p.name} plan</Button>
                  ) : currentPlan === "growth" ? null : (
                    <Button
                      asChild
                      className={`mt-6 w-full ${p.id === "starter" ? "brand-gradient text-primary-foreground" : ""}`}
                      variant={p.id === "starter" ? "default" : "outline"}
                    >
                      <Link to={currentPlan ? "/dashboard" : "/auth"} search={currentPlan ? undefined : { mode: "signup" }}>
                        {p.cta}
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Payments coming soon — secure checkout via Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
