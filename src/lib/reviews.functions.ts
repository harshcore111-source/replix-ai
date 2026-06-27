import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reviews")
      .select("id, customer_name, rating, review_text, status, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const addSchema = z.object({
  customer_name: z.string().max(80).optional(),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().min(3).max(2000),
});

export const addReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => addSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("reviews")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const markReplied = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("reviews")
      .update({ status: "replied" })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("reviews")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

const saveGeneratedSchema = z.object({
  customer_name: z.string().max(80).optional(),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().min(1).max(2000),
  reply_text: z.string().min(1).max(4000),
});

export const saveGeneratedReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => saveGeneratedSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: review, error: rErr } = await context.supabase
      .from("reviews")
      .insert({
        user_id: context.userId,
        customer_name: data.customer_name,
        rating: data.rating,
        review_text: data.review_text,
        status: "replied",
      })
      .select()
      .single();
    if (rErr) throw rErr;
    const { error: pErr } = await context.supabase
      .from("replies")
      .insert({ user_id: context.userId, review_id: review.id, reply_text: data.reply_text });
    if (pErr) throw pErr;
    return { ok: true };
  });

export const listReplies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("replies")
      .select("id, reply_text, created_at, review:reviews(id, customer_name, rating, review_text)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });

