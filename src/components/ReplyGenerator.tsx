import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Copy, RefreshCw, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/StarRating";
import { toast } from "sonner";
import { generateReply } from "@/lib/reply.functions";
import { generateDemoReply } from "@/lib/demo.functions";
import { DEMO_LIMIT, getDemoCount, incDemoCount } from "@/lib/demo";

import { saveGeneratedReply } from "@/lib/reviews.functions";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  mode: "auth" | "demo";
  defaults?: {
    language?: string;
    tone?: string;
    length?: string;
    customInstruction?: string;
    businessName?: string;
  };
  onSaved?: () => void;
};

export function ReplyGenerator({ mode, defaults, onSaved }: Props) {

  const [reviewText, setReviewText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(5);
  const [tone, setTone] = useState(defaults?.tone ?? "Professional");
  const [language, setLanguage] = useState(defaults?.language ?? "English");
  const [length, setLength] = useState(defaults?.length ?? "Medium");
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState(false);

  const genAuth = useServerFn(generateReply);
  const genDemo = useServerFn(generateDemoReply);

  const mutation = useMutation({
    mutationFn: async (opts?: { isRegenerate?: boolean }) => {
      if (mode === "demo") {
        if (getDemoCount() >= DEMO_LIMIT) throw new Error("DEMO_LIMIT");
        const out = await genDemo({ data: { reviewText, rating, tone, language } });
        if (!opts?.isRegenerate) incDemoCount();
        return out;
      }
      return await genAuth({
        data: {
          reviewText,
          rating,
          customerName: customerName || undefined,
          tone: tone as never,
          language: language as never,
          length: length as never,
          customInstruction: defaults?.customInstruction || undefined,
          businessName: defaults?.businessName || undefined,
          isRegenerate: opts?.isRegenerate ?? false,
        },
      });
    },
    onSuccess: (out) => setReply(out.reply),
    onError: (e: Error) => {
      if (e.message === "DEMO_LIMIT")
        toast.error("Demo limit reached", { description: "Sign up to keep generating replies." });
      else if (e.message.startsWith("LIMIT_REACHED"))
        toast.error("Monthly limit reached", { description: "Upgrade your plan to keep generating." });
      else if (e.message === "RATE_LIMIT") toast.error("Too many requests. Please wait a moment.");
      else if (e.message === "CREDITS_EXHAUSTED") toast.error("AI credits exhausted. Please upgrade.");
      else toast.error("Could not generate reply", { description: e.message });
    },
  });

  const copy = async () => {
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    if (mode === "auth") setReply(""); // clear after use per spec
  };

  return (
    <Card className="border-border/60 shadow-soft">
      <CardContent className="space-y-5 p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="review">Customer review</Label>
            <Textarea
              id="review"
              rows={5}
              placeholder="Paste the customer review here..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          {mode === "auth" && (
            <div className="space-y-2">
              <Label htmlFor="cname">Customer name (optional)</Label>
              <Input id="cname" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Hinglish">Hinglish</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Professional", "Friendly", "Empathetic", "Casual", "Formal"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "auth" && (
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Short", "Medium", "Long"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button
          onClick={() => mutation.mutate({ isRegenerate: false })}
          disabled={!reviewText.trim() || mutation.isPending}
          className="brand-gradient h-11 w-full text-primary-foreground shadow-pop"
        >
          {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Generate reply
        </Button>

        {reply && (
          <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
            <Textarea
              rows={6}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="bg-background"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={copy} variant="default" size="sm">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy reply"}
              </Button>
              <Button onClick={() => mutation.mutate({ isRegenerate: true })} variant="outline" size="sm" disabled={mutation.isPending}>
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
              </Button>
            </div>
          </div>
        )}
        {mode === "demo" && (
          <p className="text-center text-xs text-muted-foreground">
            Free demo: 2 generations, no signup required.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
