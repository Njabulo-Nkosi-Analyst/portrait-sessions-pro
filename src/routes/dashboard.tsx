import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LogOut, ArrowRight, ImageIcon, Star, X } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Your dashboard — Tann Media" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  useEffect(() => { if (!loading && !user) nav({ to: "/sign-in" }); }, [user, loading, nav]);

  const [reviewFor, setReviewFor] = useState<any | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => user ? (await supabase.from("profiles").select("*").eq("id", user.id).single()).data : null,
    enabled: !!user,
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ["my-inquiries", user?.id],
    queryFn: async () => user ? (await supabase.from("inquiries").select("*").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [] : [],
    enabled: !!user,
  });

  // ✅ Fetch active promo to detect sale packages
  const { data: activePromo } = useQuery({
    queryKey: ["active-promo-dash"],
    queryFn: async () => {
      const { data } = await supabase.from("promotions").select("*")
        .eq("is_active", true).gt("ends_at", new Date().toISOString())
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["packages-cover"],
    queryFn: async () => (await supabase.from("packages").select("id, name, category, cover_image_url, price, sale_price, is_on_sale, duration").eq("is_active", true)).data ?? [],
  });
  const pkgByName = new Map(packages.map(p => [p.name, p]));

  const { data: galleryByCategory = {} } = useQuery({
    queryKey: ["gallery-by-cat"],
    queryFn: async () => {
      const { data } = await supabase.from("gallery_images").select("category, url").order("sort_order");
      const map: Record<string, string> = {};
      (data ?? []).forEach(g => { if (!map[g.category]) map[g.category] = g.url; });
      return map;
    },
  });

  // ✅ Fetch submitted reviews to prevent duplicate
  const { data: myReviews = [] } = useQuery({
    queryKey: ["my-reviews", user?.id],
    queryFn: async () => user
      ? (await supabase.from("testimonials").select("id, category").eq("user_id", user.id)).data ?? []
      : [],
    enabled: !!user,
  });
  const reviewedCategories = new Set(myReviews.map((r: any) => r.category));

  const { register, handleSubmit, reset } = useForm<{ full_name: string; whatsapp: string; phone: string }>();
  useEffect(() => { if (profile) reset(profile as any); }, [profile, reset]);

  const save = async (d: any) => {
    const { error } = await supabase.from("profiles").update(d).eq("id", user!.id);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  if (!user) return null;

  const coverFor = (i: any): string | null => {
    const pkg = pkgByName.get(i.package_interest ?? "");
    if (pkg?.cover_image_url) return pkg.cover_image_url;
    const cat = i.category ?? "";
    return galleryByCategory[cat] ?? galleryByCategory[cat + "s"] ?? null;
  };

  // ✅ Get effective price — check promo auto-sale first, then package is_on_sale
  const getPricing = (i: any) => {
    const pkg = pkgByName.get(i.package_interest ?? "");
    if (!pkg) return null;
    const originalPrice = Number(pkg.price);

    // Auto-sale from active promo
    if (activePromo?.package_name === pkg.name && activePromo?.sale_price) {
      const salePrice = Number(activePromo.sale_price);
      return { originalPrice, salePrice, savings: originalPrice - salePrice, onSale: true, duration: pkg.duration };
    }
    // Manual sale on package
    if (pkg.is_on_sale && pkg.sale_price) {
      const salePrice = Number(pkg.sale_price);
      return { originalPrice, salePrice, savings: originalPrice - salePrice, onSale: true, duration: pkg.duration };
    }
    return { originalPrice, salePrice: null, savings: null, onSale: false, duration: pkg.duration };
  };

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20">
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
          <div className="lg:col-span-2 panel p-6">
            <h2 className="font-display text-xl font-bold mb-4">Your bookings</h2>
            {inquiries.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No inquiries yet. <Link to="/contact" search={{}} className="text-primary">Book a session →</Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {inquiries.map(i => {
                  const cover = coverFor(i);
                  const pricing = getPricing(i);
                  const alreadyReviewed = reviewedCategories.has(i.category);
                  const canReview = i.status === "booked";

                  return (
                    <li key={i.id} className="flex gap-4 p-3 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary shrink-0 grid place-items-center">
                        {cover
                          ? <img src={cover} alt={i.category ?? ""} className="w-full h-full object-cover" />
                          : <ImageIcon size={22} className="text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="font-semibold">{i.category ?? "General"} · {i.package_interest ?? "Custom"}</div>

                            {/* ✅ Show sale price if applicable */}
                            {pricing && (
                              <div className="text-xs mt-0.5">
                                {pricing.onSale ? (
                                  <span className="flex items-center gap-2 flex-wrap">
                                    <span className="text-muted-foreground line-through">R{pricing.originalPrice.toLocaleString()}</span>
                                    <span className="text-orange-400 font-bold">R{pricing.salePrice!.toLocaleString()}</span>
                                    <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                      You saved R{pricing.savings!.toLocaleString()}!
                                    </span>
                                    {pricing.duration && <span className="text-muted-foreground">· {pricing.duration}</span>}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    R{pricing.originalPrice.toLocaleString()} · {pricing.duration}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground mt-1">
                              Preferred: {i.preferred_date ?? "Any date"} · Sent {new Date(i.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                              i.status === "booked" ? "bg-primary/20 text-primary" :
                              i.status === "new" ? "bg-orange-500/20 text-orange-300" :
                              "bg-secondary text-muted-foreground"
                            }`}>{i.status}</span>

                            {/* ✅ Leave a review button */}
                            {canReview && !alreadyReviewed && (
                              <button
                                onClick={() => setReviewFor(i)}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <Star size={11} className="fill-primary" /> Leave a review
                              </button>
                            )}
                            {canReview && alreadyReviewed && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Star size={11} className="fill-amber-400 text-amber-400" /> Review submitted
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-6 pt-5 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Explore more sessions</h3>
                <Link to="/gallery" className="text-xs text-primary inline-flex items-center gap-1">
                  View more categories <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(galleryByCategory).slice(0, 8).map(([cat, url]) => (
                  <Link key={cat} to="/contact" search={{ category: cat.replace(/s$/, "") } as any}
                    className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={url} alt={cat} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-1.5 left-2 right-2 text-xs font-semibold text-white">{cat}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(save)} className="panel p-6 space-y-3 h-fit">
            <h2 className="font-display text-xl font-bold mb-2">Profile</h2>
            <input {...register("full_name")} className="input" placeholder="Full name" />
            <input {...register("whatsapp")} className="input" placeholder="WhatsApp" />
            <input {...register("phone")} className="input" placeholder="Phone" />
            <button className="w-full btn-lime px-4 py-2.5 rounded-md text-sm">Save</button>
          </form>
        </div>
      </section>

      {/* ✅ Review Modal */}
      {reviewFor && (
        <ReviewModal
          inquiry={reviewFor}
          userId={user.id}
          clientName={profile?.full_name ?? user.email ?? ""}
          onClose={() => setReviewFor(null)}
          onDone={() => {
            setReviewFor(null);
            qc.invalidateQueries({ queryKey: ["my-reviews", user.id] });
            toast.success("Review submitted! It will appear on the homepage once approved by admin.");
          }}
        />
      )}

      <style>{`.input{width:100%;background:var(--input);color:var(--foreground);border:1px solid var(--border);border-radius:var(--radius-md);padding:.65rem .85rem;font-size:.875rem}`}</style>
    </Layout>
  );
}

// ✅ Review Modal Component
function ReviewModal({ inquiry, userId, clientName, onClose, onDone }: {
  inquiry: any;
  userId: string;
  clientName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [hovered, setHovered] = useState(0);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!quote.trim()) return toast.error("Please write a short review");
    setBusy(true);
    const { error } = await supabase.from("testimonials").insert({
      user_id: userId,
      client_name: clientName,
      category: inquiry.category ?? inquiry.package_interest ?? "General",
      quote: quote.trim(),
      rating,
      is_approved: false, // admin must approve before it shows
    } as any);
    if (error) toast.error(error.message);
    else onDone();
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="panel p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-bold">Leave a review</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {inquiry.category} · {inquiry.package_interest ?? "Custom"}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        {/* Star rating */}
        <div className="mb-4">
          <div className="text-xs text-muted-foreground mb-2 font-medium">Your rating</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  className={`transition-colors ${n <= (hovered || rating) ? "fill-amber-400 text-amber-400" : "text-border"}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review text */}
        <div className="mb-4">
          <div className="text-xs text-muted-foreground mb-2 font-medium">Your review</div>
          <textarea
            value={quote}
            onChange={e => setQuote(e.target.value)}
            rows={4}
            placeholder="Tell others about your experience with Tann Media..."
            className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm resize-none"
          />
        </div>

        <div className="text-xs text-muted-foreground mb-4 bg-secondary/50 rounded-md px-3 py-2">
          📋 Your review will be visible on the homepage once approved by admin.
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-md text-sm border border-border hover:bg-secondary">Cancel</button>
          <button onClick={submit} disabled={busy}
            className="flex-1 btn-lime px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">
            {busy ? "Submitting..." : "Submit review"}
          </button>
        </div>
      </div>
    </div>
  );
}