const KEY = "replix_demo_count";
export const DEMO_LIMIT = 2;

export function getDemoCount() {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(KEY) ?? "0");
}
export function incDemoCount() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, String(getDemoCount() + 1));
}
