import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { PLAN_LIMITS } from "./plans";

const GenInput = z.object({
  reviewText: z.string().min(3).max(2000),
  rating: z.number().int().min(1).max(5),
  customerName: z.string().max(80).optional(),
  tone: z.enum(["Professional", "Friendly", "Empathetic", "Casual", "Formal"]).default("Professional"),
  language: z.enum(["English", "Hinglish", "Hindi"]).default("English"),
  length: z.enum(["Short", "Medium", "Long"]).default("Medium"),
  customInstruction: z.string().max(500).optional(),
  businessName: z.string().max(80).optional(),
  isRegenerate: z.boolean().optional(),
});

function buildPrompt(i: z.infer<typeof GenInput>) {
  const lengthHint = i.length === "Short" ? "1-2 sentences" : i.length === "Long" ? "4-5 sentences" : "2-3 sentences";
  const negative = i.rating <= 2;
  return `You are writing a public reply to a customer review on behalf of "${i.businessName ?? "the business"}".

Rules:
- Language: ${i.language}. If Hinglish, mix natural Hindi-in-Roman-script with English; keep it simple and warm.
- Tone: ${i.tone}.
- Length: ${lengthHint}. No greetings longer than one short sentence.
- Personalise using the review's specifics. NEVER write generic templated text.
- ${negative ? "Apologise sincerely, acknowledge the specific issue, and invite them to contact support privately." : "Thank them warmly and reference what they liked."}
- Do not invent facts. Do not use emojis unless tone is Casual or Friendly.
- Output ONLY the reply text. No preface, no quotes, no signature.
${i.customInstruction ? `- Additional instruction: ${i.customInstruction}` : ""}

Customer name: ${i.customerName || "the customer"}
Star rating: ${i.rating}/5
Review:
"""
${i.reviewText}
"""`;
}

export const generateReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenInput.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");

    // Check usage
    const { data: usage } = await context.supabase
      .from("usage")
      .select("replies_used, plan_type, billing_cycle_start")
      .eq("user_id", context.userId)
      .maybeSingle();

    const plan = (usage?.plan_type ?? "free") as keyof typeof PLAN_LIMITS;
    const limit = PLAN_LIMITS[plan];
    if ((usage?.replies_used ?? 0) >= limit) {
      throw new Error(`LIMIT_REACHED:${plan}`);
    }

    const gateway = createLovableAiGatewayProvider(key);
    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt: buildPrompt(data),
        temperature: 0.4,
      });

      // Increment usage only for first generation, not regenerations
      const currentUsed = usage?.replies_used ?? 0;
      const newUsed = data.isRegenerate ? currentUsed : currentUsed + 1;
      if (!data.isRegenerate) {
        await context.supabase
          .from("usage")
          .update({ replies_used: newUsed, updated_at: new Date().toISOString() })
          .eq("user_id", context.userId);
      }

      return { reply: text.trim(), used: newUsed, limit, plan };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("429")) throw new Error("RATE_LIMIT");
      if (msg.includes("402")) throw new Error("CREDITS_EXHAUSTED");
      throw e;
    }
  });
