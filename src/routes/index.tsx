import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, MessageSquare, Globe2, Zap, ShieldCheck, Star, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { ReplyGenerator } from "@/components/ReplyGenerator";
import { PLANS } from "@/lib/plans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Replix.ai — AI replies to every customer review" },
      { name: "description", content: "Built for businesses that care about reputation. Reply to Google, Zomato and Amazon reviews in your tone, in English or Hinglish — in seconds." },
      { property: "og:title", content: "Replix.ai — AI replies to every customer review" },
      { property: "og:description", content: "Respond quickly, stay consistent, and maintain a strong brand voice across every review." },
    ],
  }),
  component: Landing,
});

const FAKE_REVIEWS = [
  { name: "Priya Sharma", city: "Mumbai", rating: 5, text: "Food was amazing, especially the paneer tikka. Staff bahut helpful the!", img: "https://i.pravatar.cc/100?img=47" },
  { name: "Rahul Verma", city: "Delhi", rating: 4, text: "Service was quick but the AC wasn't working properly. Overall decent experience.", img: "https://i.pravatar.cc/100?img=12" },
  { name: "Anjali Mehta", city: "Bangalore", rating: 5, text: "Loved the ambience. Will definitely come back with family this weekend.", img: "https://i.pravatar.cc/100?img=45" },
  { name: "Arjun Singh", city: "Pune", rating: 2, text: "Order delivery was 45 min late and the packaging was torn. Disappointed.", img: "https://i.pravatar.cc/100?img=33" },
  { name: "Sneha Patel", city: "Ahmedabad", rating: 5, text: "Best biryani in town! Hinglish menu was super helpful for my parents.", img: "https://i.pravatar.cc/100?img=49" },
  { name: "Vikram Iyer", city: "Chennai", rating: 4, text: "Great value for money. Loved the masala dosa, chai could be better.", img: "https://i.pravatar.cc/100?img=15" },
];

function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(60%_60%_at_50%_0%,theme(colors.primary/15%),transparent)]" />
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by Lovable AI
            </div>
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Built for businesses that care about <span className="brand-gradient bg-clip-text text-transparent">reputation</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
              Respond quickly, stay consistent, and maintain a strong brand voice across every review — in English or Hinglish.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {!user && (
                <Button asChild size="lg" className="brand-gradient h-12 px-6 text-base text-primary-foreground shadow-pop">
                  <a href="#try-demo">Try the demo <ArrowRight className="ml-1 h-4 w-4" /></a>
                </Button>
              )}
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link to="/auth" search={{ mode: "signup" }}>Start free — 30 replies/mo</Link>
              </Button>
            </div>
          </div>

          {/* DEMO */}
          <div id="try-demo" className="mx-auto mt-12 max-w-3xl scroll-mt-20">
            <ReplyGenerator mode="demo" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-border bg-card/40 py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Everything you need to reply, fast</h2>
            <p className="mt-3 text-muted-foreground">Personalised, on-brand replies in seconds — not minutes.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: MessageSquare, title: "Smart negative handling", desc: "Genuine apology + private contact line for low ratings." },
              { icon: Globe2, title: "English + Hinglish", desc: "Reply the way your customers actually write." },
              { icon: Zap, title: "Tone & length control", desc: "Professional, friendly, empathetic — your call." },
              { icon: Sparkles, title: "Custom instructions", desc: "Save your brand voice once. Use it forever." },
              { icon: ShieldCheck, title: "Edit before posting", desc: "AI drafts. You stay in control." },
              { icon: Star, title: "Built for Indian SMBs", desc: "Restaurants, salons, clinics, D2C — we get it." },
            ].map((f) => (
              <Card key={f.title} className="border-border/60">
                <CardContent className="p-5">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAKE REVIEWS SHOWCASE */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Real-world reviews, AI-perfect replies</h2>
            <p className="mt-3 text-muted-foreground">A peek at the kind of reviews Replix handles every day.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FAKE_REVIEWS.map((r) => (
              <Card key={r.name} className="border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <img src={r.img} alt={r.name} className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                    <div>
                      <p className="text-sm font-semibold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.city}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-star text-star" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-foreground/90">"{r.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-t border-border bg-card/40 py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Simple, honest pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade only when you love it.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((p) => (
              <Card key={p.id} className={`relative border-border/60 ${p.id === "starter" ? "ring-2 ring-primary shadow-pop" : ""}`}>
                {p.badge && (
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
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-success" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className={`mt-6 w-full ${p.id === "starter" ? "brand-gradient text-primary-foreground" : ""}`} variant={p.id === "starter" ? "default" : "outline"}>
                    <Link to="/auth" search={{ mode: "signup" }}>{p.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Replix.ai · Built for businesses that care.
      </footer>
    </div>
  );
}
