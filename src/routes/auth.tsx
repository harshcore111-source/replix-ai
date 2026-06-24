import { createFileRoute, Link, redirect, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

const search = z.object({ mode: z.enum(["login", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/home" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — Replix.ai" },
      { name: "description", content: "Sign in or create your Replix.ai account to reply to customer reviews with AI." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Min 6 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});

function AuthPage() {
  const { mode } = useSearch({ from: "/auth" });
  const [tab, setTab] = useState<"login" | "signup">(mode ?? "login");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/40 px-4 py-10">
      <Link to="/" className="mb-6"><Logo className="h-10 md:h-12" /></Link>
      <Card className="w-full max-w-md border-border/60 shadow-soft">
        <CardContent className="p-6">
          <div className="mb-5 flex rounded-lg bg-muted p-1">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          {tab === "login" ? <LoginForm /> : <SignupForm />}
          <GoogleButton />
          {tab === "login" && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });
  const onSubmit = handleSubmit(async (values) => {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) return toast.error("Sign in failed", { description: error.message });
    toast.success("Welcome back");
    navigate({ to: "/home" });
  });
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" {...register("password")} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="brand-gradient h-11 w-full text-primary-foreground shadow-pop">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
      </Button>
    </form>
  );
}

function SignupForm() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(signupSchema),
  });
  const onSubmit = handleSubmit(async (values) => {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: `${window.location.origin}/home` },
    });
    if (error) return toast.error("Sign up failed", { description: error.message });
    toast.success("Account created", { description: "You're signed in." });
    navigate({ to: "/onboarding" });
  });
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-password">Password</Label>
        <div className="relative">
          <Input id="su-password" type={show ? "text" : "password"} autoComplete="new-password" {...register("password")} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-confirm">Confirm password</Label>
        <Input id="su-confirm" type={show ? "text" : "password"} autoComplete="new-password" {...register("confirm")} />
        {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="brand-gradient h-11 w-full text-primary-foreground shadow-pop">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
      </Button>
    </form>
  );
}

function GoogleButton() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/home" });
    setLoading(false);
    if (res.error) return toast.error("Google sign-in failed", { description: res.error.message });
    if (!res.redirected) navigate({ to: "/home" });
  };
  return (
    <>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" className="h-11 w-full" onClick={onClick} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.9c-.26 1.4-1.04 2.58-2.22 3.37v2.8h3.59c2.1-1.94 3.23-4.79 3.23-8.2z"/><path fill="#34A853" d="M12 23c3 0 5.52-.99 7.36-2.69l-3.59-2.8c-1 .67-2.27 1.07-3.77 1.07-2.9 0-5.36-1.96-6.24-4.59H2.06v2.88A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.76 14a6.6 6.6 0 0 1 0-4.2V6.92H2.06a11 11 0 0 0 0 10.16L5.76 14z"/><path fill="#EA4335" d="M12 5.38c1.63 0 3.1.56 4.25 1.66l3.18-3.18C17.5 2.1 14.98 1 12 1 7.7 1 3.98 3.47 2.06 6.92l3.7 2.88C6.64 7.34 9.1 5.38 12 5.38z"/></svg>
        )}
        Continue with Google
      </Button>
    </>
  );
}
