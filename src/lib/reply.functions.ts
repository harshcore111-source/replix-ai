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
  const signer = (i.businessName ?? "").trim() || "The Team";
  return `You are writing a public reply to a customer review on behalf of "${i.businessName ?? "the business"}".

Rules:
- Language: ${i.language}. If Hinglish, mix natural Hindi-in-Roman-script with English; keep it simple and warm.
- Tone: ${i.tone}.
- Length: ${lengthHint}. No greetings longer than one short sentence.
- Personalise using the review's specifics. NEVER write generic templated text.
- ${negative ? "Apologise sincerely, acknowledge the specific issue, and invite them to contact support privately." : "Thank them warmly and reference what they liked."}
- Do not invent facts. Do not use emojis unless tone is Casual or Friendly.
- Output ONLY the reply text. No preface, no quotes.
- End with a short closing line that matches the sentiment and tone:
  ${negative ? `- Negative reviews — pick one (or combine two short ones) from: We're sorry / We are really sorry / Sincere apologies / We apologize for the inconvenience / This isn't the experience we aim to provide / We take full responsibility / We regret this issue / We're working to fix this / Our team is addressing this right away / We're taking steps to improve / Please contact us so we can make this right / Share your details, we will resolve it / We'd like to discuss and fix this / Your feedback helps us improve / We value your feedback / We'll do better next time / We will follow up with you shortly / Expect an update from us soon / Thank you for bringing this to our attention / Thanks for your patience / We appreciate your understanding.` : `- Positive reviews — pick one (or combine two short ones) from: Thank you / Thank you so much / Thanks a lot / We truly appreciate it / We appreciate your support / Thanks for choosing us / We're grateful to have you with us / We look forward to seeing you again / Hope to serve you again soon / See you again soon / Have a great day / Have a wonderful day ahead / Wishing you the best / Feel free to recommend us / Your feedback means a lot to us / Best regards / Warm regards / Cheers.`}
- After the closing line, add a signature line on a new line with the responder's name: "— ${signer}".
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
