import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

const updateSchema = z.object({
  business_name: z.string().max(80).optional(),
  business_type: z.string().max(80).optional(),
  default_language: z.string().max(40).optional(),
  default_tone: z.string().max(40).optional(),
  default_length: z.string().max(40).optional(),
  custom_instruction: z.string().max(500).nullable().optional(),
  onboarded: z.boolean().optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const getUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // monthly reset
    await context.supabase.rpc as unknown; // noop typing
    const { data } = await context.supabase
      .from("usage")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data;
  });
