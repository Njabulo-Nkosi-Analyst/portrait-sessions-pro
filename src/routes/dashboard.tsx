import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LogOut, ArrowRight, ImageIcon, Star, Tag, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Your dashboard — Tann Media" }] }),
  component: Dashboard,
});

const reviewSchema = z.object({
  quote: z.string().trim().min(10, "Please write at least 10 characters").max(500),
  rating: z.number().min(1).max(5),
});
type ReviewForm = z.infer<typeof reviewSchema>;

function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => { if (!loading && !user) nav({ to: "/sign-in" }); }, [user, loading, nav]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => user ? (await supabase.from("profiles").select("*").eq("id", user.id).single()).data : null,
    enabled: !!user,
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ["my-inquiries", user?.id],
    queryFn: async () => user
      ? (await supabase.from("inquiries").select("*").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? []
      : [],
    enabled: !!user,
  });

  // Fetch bookings to show sale price info
  const { data: bookings = [] } = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => user
      ? (await supabase.from("bookings").select("*").eq("user_id", user.id).order("confirmed_at", { ascending: false })).data ?? []
      : [],
    enabled: !!user,
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["packages-cover"],
    queryFn: async () =>
      (await supabase.from("packages").select("id, name, category, cover_image_url, price, sale_price, is_on_sale, duration").eq("is_active", true)).data ?? [],
  });
  const pkgByName = new Map(packages.map((p: any) => [p.name, p]));

  // Map bookings by inquiry_id for quick lookup
  const bookingByInquiryId = new Map(bookings.map((b: any) => [b.inquiry_id, b]));

  const { data: myReviews = [] } = useQuery({
    queryKey: ["my-reviews", user?.id],
    queryFn: async () => user
      ? (await supabase.from("testimonials").select("*").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? []
      : [],
    enabled: !!user,
  });

  const { data: galleryByCategory = {} } = useQuery({
    queryKey: ["gallery-by-cat"],
    queryFn: async () => {
      const { data } = await supabase.from("gallery_images").select("category, url").order("sort_order");
      const map: Record<string, string> = {};
      (data ?? []).forEach((g: any) => { if (!map[g.category]) map[g.category] = g.url; });
      return map;
    },
  });

  const { register: regProfile, handleSubmit: handleProfile, reset: resetProfile } =
    useForm<{ full_name: string; whatsapp: string; phone: string }>();
  useEffect(() => { if (profile) resetProfile(profile as any); }, [profile, resetProfile]);

  const saveProfile = async (d: any) => {
    const { error } = await supabase.from("profiles").update(d).eq("id", user!.id);
    if (error) toast.error(error.message); else toast.success("Profile updated ✓");
  };

  const { register: regReview, handleSubmit: handleReview, reset: resetReview,
    setValue: setReviewValue, watch: watchReview, formState: { errors: reviewErrors, isSubmitting: reviewSubmitting } } =
    useForm<ReviewForm>({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 5 } });

  const currentRating = watchReview("rating");

  const submitReview = async (d: ReviewForm) => {
    const { error } = await supabase.from("testimonials").insert({
      user_id: user!.id,
      client_name: profile?.full_name ?? user!.email,
      quote: d.quote,
      rating: d.rating,
      is_approved: false,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Review submitted! It will appear on the site once approved.");
    resetReview({ rating: 5, quote: "" });
    setShowReviewForm(false);
    qc.invalidateQueries({ queryKey: ["my-reviews", user?.id] });
  };

  if (!user) return null;

  const coverFor = (i: any): string | null => {
    const pkg = pkgByName.get(i.package_interest ?? "");
    if ((pkg as any)?.cover_image_url) return (pkg as any).cover_image_url;
    const cat = i.category ?? "";
    return galleryByCategory[cat] ?? null;
  };

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20 pb-20">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">
              Hi, <span className="text-gradient-warm">{profile?.full_name ?? user.email}</span>
            </h1>
          </div>
          <button onClick={() => { signOut(); nav({ to: "/" }); }}
            className="btn-ghost-dark px-4 py-2 rounded-md text-sm flex items-center gap-2">
            <LogOut size={14} /> Sign out
          </button>
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          {/* ── Left: Bookings + Review ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Bookings */}
            <div className="panel p-6">
              <h2 className="font-display text-xl font-bold mb-4">Your bookings</h2>
              {inquiries.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  No inquiries yet.{" "}
                  <Link to="/contact" search={{} as any} className="text-primary">Book a session →</Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {inquiries.map((i: any) => {
                    const cover = coverFor(i);
                    const pkg = pkgByName.get(i.package_interest ?? "") as any;
                    const booking = bookingByInquiryId.get(i.id) as any;

                    // Show confirmed booking price (which may include discount)
                    // If package is on sale, show sale price
                    const displayPrice = booking
                      ? Number(booking.final_price)
                      : pkg?.is_on_sale && pkg?.sale_price
                      ? Number(pkg.sale_price)
                      : pkg ? Number(pkg.price) : null;

                    const originalPrice = booking
                      ? Number(booking.package_price)
                      : pkg ? Number(pkg.price) : null;

                    const isSalePrice = booking
                      ? booking.discount_amount > 0
                      : pkg?.is_on_sale && pkg?.sale_price;

                    const savings = isSalePrice && originalPrice && displayPrice
                      ? originalPrice - displayPrice
                      : null;

                    return (
                      <li key={i.id} className="flex gap-4 p-4 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary shrink-0 grid place-items-center">
                          {cover
                            ? <img src={cover} alt={i.category ?? ""} className="w-full h-full object-cover" />
                            : <ImageIcon size={20} className="text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="min-w-0">
                              <div className="font-semibold truncate">
                                {i.category ?? "General"} · {i.package_interest ?? "Custom"}
                              </div>
                              {pkg && (
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {isSalePrice && originalPrice && displayPrice ? (
                                    <>
                                      <span className="text-xs text-muted-foreground line-through">
                                        R{originalPrice.toLocaleString()}
                                      </span>
                                      <span className="text-sm font-bold text-orange-500">
                                        R{displayPrice.toLocaleString()}
                                      </span>
                                      {savings && savings > 0 && (
                                        <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-semibold">
                                          Save R{savings.toLocaleString()}
                                        </span>
                                      )}
                                    </>
                                  ) : displayPrice ? (
                                    <span className="text-xs text-muted-foreground">
                                      R{displayPrice.toLocaleString()} · {pkg.duration}
                                    </span>
                                  ) : null}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                Preferred: {i.preferred_date ?? "Any date"} · Sent {new Date(i.created_at).toLocaleDateString()}
                              </div>
                              {booking?.session_date && (
                                <div className="text-xs text-primary mt-0.5">
                                  Session: {new Date(booking.session_date + "T00:00:00").toLocaleDateString("en-ZA", {
                                    weekday: "short", day: "numeric", month: "short", year: "numeric"
                                  })}
                                  {booking.session_time ? ` · ${String(booking.session_time).slice(0, 5)}` : ""}
                                </div>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap shrink-0 ${
                              i.status === "booked" ? "bg-primary/20 text-primary" :
                              i.status === "new" ? "bg-orange-500/20 text-orange-300" :
                              "bg-secondary text-muted-foreground"
                            }`}>
                              {i.status === "booked" ? "✓ Confirmed" : i.status}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* ── Leave a Review ── */}
            <div className="panel p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">Leave a review</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your review will appear on the website once approved by our team.
                  </p>
                </div>
                {!showReviewForm && (
                  <button onClick={() => setShowReviewForm(true)}
                    className="btn-lime px-4 py-2 rounded-md text-sm font-semibold inline-flex items-center gap-2">
                    <Star size={14} /> Write a review
                  </button>
                )}
              </div>

              {/* Review form */}
              {showReviewForm && (
                <form onSubmit={handleReview(submitReview)} className="space-y-4 border border-border rounded-xl p-4 bg-secondary/20">
                  {/* Star rating */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-2 font-medium">Your rating</div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setReviewValue("rating", star)}
                          className="transition-transform hover:scale-110">
                          <Star
                            size={28}
                            className={`transition-colors ${
                              star <= (hoverRating || currentRating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {reviewErrors.rating && (
                      <div className="text-xs text-destructive mt-1">{reviewErrors.rating.message}</div>
                    )}
                  </div>

                  {/* Review text */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5 font-medium">Your experience</div>
                    <textarea
                      {...regReview("quote")}
                      rows={4}
                      placeholder="Tell us about your experience with Tann Media..."
                      className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm resize-none"
                    />
                    {reviewErrors.quote && (
                      <div className="text-xs text-destructive mt-1">{reviewErrors.quote.message}</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 rounded-md text-sm border border-border hover:bg-secondary transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={reviewSubmitting}
                      className="btn-lime px-5 py-2 rounded-md text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2">
                      {reviewSubmitting ? "Submitting…" : <><CheckCircle2 size={14} /> Submit review</>}
                    </button>
                  </div>
                </form>
              )}

              {/* Past reviews */}
              {myReviews.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Your reviews</div>
                  {myReviews.map((r: any) => (
                    <div key={r.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12}
                              className={i < (r.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
                          ))}
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          r.is_approved ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                        }`}>
                          {r.is_approved ? "✓ Published" : "Pending approval"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">"{r.quote}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Explore more */}
            <div className="panel p-6">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="font-semibold">Explore more sessions</h3>
                <Link to="/gallery" className="text-xs text-primary inline-flex items-center gap-1">
                  View gallery <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(galleryByCategory).slice(0, 8).map(([cat, url]) => (
                  <Link key={cat} to="/contact" search={{ category: cat } as any}
                    className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={url as string} alt={cat}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-1.5 left-2 right-2 text-xs font-semibold text-white truncate">{cat}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Profile ── */}
          <form onSubmit={handleProfile(saveProfile)} className="panel p-6 space-y-3 h-fit">
            <h2 className="font-display text-xl font-bold mb-2">Your profile</h2>
            <div>
              <div className="text-xs text-muted-foreground mb-1.5 font-medium">Full name</div>
              <input {...regProfile("full_name")} className="input" placeholder="Full name" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1.5 font-medium">WhatsApp</div>
              <input {...regProfile("whatsapp")} className="input" placeholder="+27 ..." />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1.5 font-medium">Phone</div>
              <input {...regProfile("phone")} className="input" placeholder="Phone number" />
            </div>
            <button className="w-full btn-lime px-4 py-2.5 rounded-md text-sm font-semibold">Save profile</button>

            <div className="pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Quick links</div>
              <div className="space-y-2">
                <Link to="/gallery" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowRight size={12} /> Browse gallery
                </Link>
                <Link to="/pricing" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowRight size={12} /> View pricing
                </Link>
                <Link to="/contact" search={{} as any} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                  <ArrowRight size={12} /> Book another session
                </Link>
              </div>
            </div>
          </form>
        </div>
      </section>
      <style>{`.input{width:100%;background:var(--input);color:var(--foreground);border:1px solid var(--border);border-radius:var(--radius-md);padding:.65rem .85rem;font-size:.875rem}.input:focus{outline:2px solid var(--primary);outline-offset:2px}`}</style>
    </Layout>
  );
}