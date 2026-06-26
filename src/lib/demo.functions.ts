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
- Do not invent facts.
- Output ONLY the reply text. No preface, no quotes.
- End with a short closing line that matches the sentiment and tone:
  ${negative ? `- Negative reviews — pick one (or combine two short ones) from: We're sorry / We are really sorry / Sincere apologies / We apologize for the inconvenience / This isn't the experience we aim to provide / We take full responsibility / We regret this issue / We're working to fix this / Our team is addressing this right away / We're taking steps to improve / Please contact us so we can make this right / Share your details, we will resolve it / We'd like to discuss and fix this / Your feedback helps us improve / We value your feedback / We'll do better next time / We will follow up with you shortly / Expect an update from us soon / Thank you for bringing this to our attention / Thanks for your patience / We appreciate your understanding.` : `- Positive reviews — pick one (or combine two short ones) from: Thank you / Thank you so much / Thanks a lot / We truly appreciate it / We appreciate your support / Thanks for choosing us / We're grateful to have you with us / We look forward to seeing you again / Hope to serve you again soon / See you again soon / Have a great day / Have a wonderful day ahead / Wishing you the best / Feel free to recommend us / Your feedback means a lot to us / Best regards / Warm regards / Cheers.`}
- After the closing line, add a signature line on a new line with the responder's name: "— The Team".

Review:
"""
${data.reviewText}
"""`;
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
      temperature: 0.4,
    });
    return { reply: text.trim() };
  });
