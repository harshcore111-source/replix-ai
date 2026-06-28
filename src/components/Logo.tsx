import { Sparkles } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Sparkles className="h-5 w-5 shrink-0 text-primary md:h-6 md:w-6" />
      <span className="font-display text-lg font-bold tracking-tight text-foreground md:text-xl lg:text-2xl">
        RepliX
      </span>
      <span className="font-display text-lg font-medium tracking-tight text-primary md:text-xl lg:text-2xl">
        AI
      </span>
    </span>
  );
}
