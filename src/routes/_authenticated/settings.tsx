import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { getProfile, getUsage, updateProfile } from "@/lib/profile.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Replix.ai" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const getProfileFn = useServerFn(getProfile);
  const usageFn = useServerFn(getUsage);
  const updateFn = useServerFn(updateProfile);
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const { data: usage } = useQuery({ queryKey: ["usage"], queryFn: () => usageFn() });
  const plan = usage?.plan_type ?? "free";
  const customAllowed = plan !== "free";

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      business_name: "", business_type: "",
      default_language: "English", default_tone: "Professional", default_length: "Medium",
      custom_instruction: "",
    },
  });

  useEffect(() => {
    if (profile) reset({
      business_name: profile.business_name ?? "",
      business_type: profile.business_type ?? "",
      default_language: profile.default_language ?? "English",
      default_tone: profile.default_tone ?? "Professional",
      default_length: profile.default_length ?? "Medium",
      custom_instruction: profile.custom_instruction ?? "",
    });
  }, [profile, reset]);

  type FormVals = {
    business_name: string; business_type: string;
    default_language: string; default_tone: string; default_length: string;
    custom_instruction: string;
  };
  const mutation = useMutation({
    mutationFn: (v: FormVals) => updateFn({ data: v }),
    onSuccess: () => {
      toast.success("Preferences saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error("Could not save", { description: e.message }),
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="mb-6 text-3xl font-bold md:text-4xl">Settings</h1>
        <Card className="border-border/60">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Business name</Label>
                  <Input {...register("business_name")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Business type</Label>
                  <Input {...register("business_type")} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Default language</Label>
                  <Select value={watch("default_language")} onValueChange={(v) => setValue("default_language", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["English", "Hinglish", "Hindi"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Default tone</Label>
                  <Select value={watch("default_tone")} onValueChange={(v) => setValue("default_tone", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Professional", "Friendly", "Empathetic", "Casual", "Formal"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Default length</Label>
                  <Select value={watch("default_length")} onValueChange={(v) => setValue("default_length", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Short", "Medium", "Long"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Custom instruction {!customAllowed && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">Starter+</span>}
                </Label>
                <Textarea
                  rows={4}
                  placeholder={customAllowed ? "e.g. Always sign off as 'Team Sharma Sweets'. Mention free delivery above ₹500." : "Upgrade to save a custom voice for every reply."}
                  disabled={!customAllowed}
                  {...register("custom_instruction")}
                />
              </div>
              <Button type="submit" disabled={mutation.isPending} className="brand-gradient h-11 text-primary-foreground shadow-pop">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save preferences
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
