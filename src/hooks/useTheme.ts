import { useEffect, useState } from "react";

const KEY = "replix_theme";
type Theme = "light" | "dark";

function apply(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme | null) ?? "light";
    setTheme(stored);
    apply(stored);
  }, []);
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(KEY, next);
    apply(next);
  };
  return { theme, toggle };
}
