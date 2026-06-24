import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { getProfile, updateProfile } from "@/lib/profile.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Replix.ai" }] }),
  component: Onboarding,
});

const schema = z.object({
  business_name: z.string().min(2, "Required").max(80),
  business_type: z.string().min(2, "Required").max(80),
  default_language: z.string(),
  default_tone: z.string(),
});

function Onboarding() {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const updateFn = useServerFn(updateProfile);

  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { default_language: "English", default_tone: "Professional" },
  });

  useEffect(() => {
    if (profile?.onboarded) navigate({ to: "/home" });
    if (profile) reset({
      business_name: profile.business_name ?? "",
      business_type: profile.business_type ?? "",
      default_language: profile.default_language ?? "English",
      default_tone: profile.default_tone ?? "Professional",
    });
  }, [profile, navigate, reset]);

  const mutation = useMutation({
    mutationFn: (vals: z.infer<typeof schema>) => updateFn({ data: { ...vals, onboarded: true } }),
    onSuccess: () => {
      toast.success("All set!");
      navigate({ to: "/home" });
    },
    onError: (e: Error) => toast.error("Could not save", { description: e.message }),
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/40 px-4 py-10">
      <Logo className="mb-6 h-10 md:h-12" />
      <Card className="w-full max-w-lg border-border/60 shadow-soft">
        <CardContent className="space-y-5 p-6">
          <div>
            <h1 className="text-2xl font-bold">Tell us about your business</h1>
            <p className="mt-1 text-sm text-muted-foreground">We'll personalise every reply using these defaults.</p>
          </div>
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bn">Business name</Label>
              <Input id="bn" placeholder="e.g. Sharma Sweets" {...register("business_name")} />
              {errors.business_name && <p className="text-xs text-destructive">{errors.business_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bt">Business type</Label>
              <Input id="bt" placeholder="e.g. Restaurant, Salon, Clinic" {...register("business_type")} />
              {errors.business_type && <p className="text-xs text-destructive">{errors.business_type.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Default language</Label>
                <Select value={watch("default_language")} onValueChange={(v) => setValue("default_language", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["English", "Hinglish", "Hindi"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Default tone</Label>
                <Select value={watch("default_tone")} onValueChange={(v) => setValue("default_tone", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Professional", "Friendly", "Empathetic", "Casual", "Formal"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={mutation.isPending} className="brand-gradient h-11 w-full text-primary-foreground shadow-pop">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Continue to dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
