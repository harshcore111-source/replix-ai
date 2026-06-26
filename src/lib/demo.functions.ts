import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const DemoInput = z.object({
  reviewText: z.string().min(3).max(1000),
  rating: z.number().int().min(1).max(5),
  tone: z.string().default("Professional"),
  language: z.string().default("English"),
});

export const generateDemoReply = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DemoInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");
    const gateway = createLovableAiGatewayProvider(key);
    const negative = data.rating <= 2;
    const prompt = `Write a short, personalised public reply to this ${data.rating}-star review.
- Language: ${data.language} (if Hinglish, mix Hindi-in-Roman script with English)
- Tone: ${data.tone}
- 2-3 sentences. No emojis. No greetings longer than one short clause.
- ${negative ? "Apologise sincerely and invite them to contact support." : "Thank them and reference what they liked."}
- Output ONLY the reply text.

Review:
"""
${data.reviewText}
"""`;
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
      temperature: 0.4,
    });
    return { reply: `${text.trim()}\n\nThank you,\nThe Team` };
  });
