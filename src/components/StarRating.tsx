import { Star } from "lucide-react";

export function StarRating({ value, onChange, size = 22 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          disabled={!onChange}
          className="transition-transform hover:scale-110 disabled:hover:scale-100"
          aria-label={`${n} stars`}
        >
          <Star
            style={{ width: size, height: size }}
            className={n <= value ? "fill-star text-star" : "text-muted-foreground/40"}
          />
        </button>
      ))}
    </div>
  );
}
