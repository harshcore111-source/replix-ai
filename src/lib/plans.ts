export type PlanType = "free" | "starter" | "growth";

export const PLAN_LIMITS: Record<PlanType, number> = {
  free: 30,
  starter: 400,
  growth: 1000,
};

export const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: "₹0",
    cadence: "/month",
    blurb: "Try Replix risk-free",
    features: ["30 replies / month", "English + Hinglish", "All tones & lengths", "Smart negative reply handling", "Edit & copy"],
    cta: "Start free",
  },
  {
    id: "starter" as const,
    name: "Starter",
    price: "₹199",
    cadence: "/month",
    perDay: "₹6.6/day",
    blurb: "Most popular — for consistent brands",
    badge: "Best Value",
    features: ["400 replies / month", "Saved custom instructions", "Faster AI", "Dashboard filters", "Basic analytics"],
    cta: "Upgrade to Starter",
  },
  {
    id: "growth" as const,
    name: "Growth",
    price: "₹399",
    cadence: "/month",
    blurb: "Scale your reputation",
    features: ["1000 replies / month", "Advanced tone control", "Custom instruction presets", "Priority AI speed", "Full analytics", "Priority support"],
    cta: "Upgrade to Growth",
  },
];
