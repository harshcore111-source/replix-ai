import logo from "@/assets/replix-logo.asset.json";

export function Logo({ className = "h-10 md:h-12 lg:h-14 w-auto" }: { className?: string }) {
  return <img src={logo.url} alt="Replix.ai" className={className} loading="eager" />;
}
