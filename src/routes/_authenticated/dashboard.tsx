import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, Check, Sparkles, Filter, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Navbar } from "@/components/Navbar";
import { StarRating } from "@/components/StarRating";
import { ReplyGenerator } from "@/components/ReplyGenerator";
import { addReview, deleteReview, listReplies, listReviews, markReplied } from "@/lib/reviews.functions";
import { getProfile, getUsage } from "@/lib/profile.functions";
import { PLAN_LIMITS } from "@/lib/plans";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Replix.ai" }] }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const listFn = useServerFn(listReviews);
  const addFn = useServerFn(addReview);
  const markFn = useServerFn(markReplied);
  const delFn = useServerFn(deleteReview);
  const profileFn = useServerFn(getProfile);
  const usageFn = useServerFn(getUsage);
  const repliesFn = useServerFn(listReplies);

  const { data: reviews = [] } = useQuery({ queryKey: ["reviews"], queryFn: () => listFn() });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const { data: usage } = useQuery({ queryKey: ["usage"], queryFn: () => usageFn() });
  const { data: replies = [] } = useQuery({ queryKey: ["replies"], queryFn: () => repliesFn() });


  const used = usage?.replies_used ?? 0;
  const plan = (usage?.plan_type ?? "free") as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[plan];

  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filtered = reviews.filter(
    (r) => (ratingFilter === "all" || r.rating === Number(ratingFilter)) && (statusFilter === "all" || r.status === statusFilter)
  );

  const stats = {
    total: reviews.length,
    replied: reviews.filter((r) => r.status === "replied").length,
    pending: reviews.filter((r) => r.status === "pending").length,
  };
  const responseRate = stats.total ? Math.round((stats.replied / stats.total) * 100) : 0;

  const mark = useMutation({
    mutationFn: (id: string) => markFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">
              {profile?.business_name ? `Hello, ${profile.business_name}!` : "Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">Manage and reply to your customer reviews.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="brand-gradient text-primary-foreground shadow-pop">
              <Link to="/home"><Sparkles className="mr-2 h-4 w-4" /> Generate reply</Link>
            </Button>
            <AddReviewDialog onAdded={() => qc.invalidateQueries({ queryKey: ["reviews"] })} addFn={addFn} />
          </div>
        </div>

        {/* Analytics */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total reviews" value={stats.total} />
          <Stat label="Replied" value={stats.replied} accent="success" />
          <Stat label="Pending" value={stats.pending} accent="star" />
          <Stat label="Response rate" value={`${responseRate}%`} />
        </div>
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span>{used} / {limit} replies — {plan} plan</span>
            {used / limit >= 0.8 && (
              <Link to="/pricing" className="text-primary hover:underline">Upgrade <ArrowRight className="inline h-3 w-3" /></Link>
            )}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="brand-gradient h-full" style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Rating" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={String(r)}>{r} stars</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews list */}
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No reviews yet</p>
              <p className="text-sm text-muted-foreground">Add your first review to start generating replies.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const isNew = Date.now() - new Date(r.created_at).getTime() < 1000 * 60 * 60 * 24;
              const isLow = r.rating <= 2;
              return (
                <Card key={r.id} className={`border-border/60 ${isLow ? "border-l-4 border-l-destructive" : isNew ? "border-l-4 border-l-primary" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{r.customer_name || "Anonymous"}</p>
                          <StarRating value={r.rating} size={16} />
                          {r.status === "replied" ? (
                            <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Replied</span>
                          ) : (
                            <span className="rounded-full bg-star/15 px-2 py-0.5 text-xs font-medium text-foreground">Pending</span>
                          )}
                          {isNew && r.status === "pending" && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">New</span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-foreground/90">{r.review_text}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {r.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => mark.mutate(r.id)}>
                            <Check className="mr-1 h-3.5 w-3.5" /> Mark replied
                          </Button>
                        )}
                        <ReplyDialog
                          review={r}
                          profile={profile}
                          onReplied={() => qc.invalidateQueries({ queryKey: ["reviews"] })}
                        />
                        <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)} aria-label="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* History */}
        <div className="mt-10">
          <h2 className="mb-3 text-xl font-semibold md:text-2xl">Reply history</h2>
          {replies.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Copied replies will appear here.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {replies.map((r) => {
                const rev = (r as { review?: { customer_name: string | null; rating: number; review_text: string } | null }).review;
                return (
                  <Card key={r.id} className="border-border/60">
                    <CardContent className="space-y-3 p-4">
                      {rev && (
                        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{rev.customer_name || "Anonymous"}</p>
                            <StarRating value={rev.rating} size={14} />
                          </div>
                          <p className="mt-1 text-muted-foreground">{rev.review_text}</p>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm">{r.reply_text}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function Stat({ label, value, accent }: { label: string; value: number | string; accent?: "success" | "star" }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${accent === "success" ? "text-success" : accent === "star" ? "text-foreground" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function AddReviewDialog({ onAdded, addFn }: { onAdded: () => void; addFn: ReturnType<typeof useServerFn<typeof addReview>> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const mutation = useMutation({
    mutationFn: () => addFn({ data: { customer_name: name || undefined, rating, review_text: text } }),
    onSuccess: () => {
      toast.success("Review added");
      setName(""); setText(""); setRating(5); setOpen(false); onAdded();
    },
    onError: (e: Error) => toast.error("Could not add", { description: e.message }),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a review</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Customer name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label>Rating</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="space-y-1.5">
            <Label>Review</Label>
            <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <Button onClick={() => mutation.mutate()} disabled={!text.trim() || mutation.isPending} className="w-full brand-gradient text-primary-foreground">
            Save review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReplyDialog({
  review,
  profile,
  onReplied,
}: {
  review: { id: string; rating: number; review_text: string; customer_name: string | null };
  profile: { default_language?: string | null; default_tone?: string | null; default_length?: string | null; custom_instruction?: string | null; business_name?: string | null } | null | undefined;
  onReplied: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="brand-gradient text-primary-foreground"><Sparkles className="mr-1 h-3.5 w-3.5" /> Reply</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Generate reply</DialogTitle></DialogHeader>
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p className="font-medium">{review.customer_name || "Anonymous"} · {review.rating}★</p>
          <p className="mt-1 text-muted-foreground">{review.review_text}</p>
        </div>
        <ReplyGenerator
          mode="auth"
          defaults={{
            language: profile?.default_language ?? undefined,
            tone: profile?.default_tone ?? undefined,
            length: profile?.default_length ?? undefined,
            customInstruction: profile?.custom_instruction ?? undefined,
            businessName: profile?.business_name ?? undefined,
          }}
          onSaved={onReplied}
        />
      </DialogContent>
    </Dialog>
  );
}
