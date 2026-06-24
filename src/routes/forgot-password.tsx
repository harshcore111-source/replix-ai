import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({ email: z.string().email("Enter a valid email") });

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — Replix.ai" }, { name: "description", content: "Reset your Replix.ai password." }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const onSubmit = handleSubmit(async ({ email }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error("Could not send reset link", { description: error.message });
    setSent(true);
  });
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/40 px-4">
      <Link to="/" className="mb-6"><Logo className="h-10 md:h-12" /></Link>
      <Card className="w-full max-w-md border-border/60 shadow-soft">
        <CardContent className="p-6">
          {sent ? (
            <div className="space-y-3 text-center">
              <MailCheck className="mx-auto h-10 w-10 text-success" />
              <h2 className="text-xl font-semibold">Check your email</h2>
              <p className="text-sm text-muted-foreground">We sent a reset link. Open it on this device to continue.</p>
              <Button asChild variant="outline" className="mt-4"><Link to="/auth"><ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in</Link></Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold">Forgot password</h1>
                <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting} className="brand-gradient h-11 w-full text-primary-foreground shadow-pop">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send reset link
              </Button>
              <p className="text-center text-sm"><Link to="/auth" className="text-muted-foreground hover:text-foreground">Back to sign in</Link></p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
