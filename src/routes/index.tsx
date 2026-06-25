import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { QuoteCalculator } from "@/components/QuoteCalculator";
import { ArrowRight, Play, Star, Phone, MessageCircle, Instagram, Camera } from "lucide-react";

const TikTokIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.15 8.15 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/>
  </svg>
);

const FALLBACK_HERO = [
  { id: "1", url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80", category_label: "Weddings" },
  { id: "2", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1600&q=80", category_label: "Portraits" },
  { id: "3", url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80", category_label: "Events" },
];

const STATS = [
  { n: "5+", l: "Years shooting" },
  { n: "500+", l: "Sessions delivered" },
  { n: "4.98", l: "Avg rating", star: true },
];

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Tann Media — Your moments, cinematically told" }] }),
  component: Home,
});

function Home() {
  // ✅ Testimonials from admin (approved only)
  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery({
    queryKey: ["testimonials-approved"],
    queryFn: async () =>
      (await supabase.from("testimonials").select("*").eq("is_approved", true).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: hero = FALLBACK_HERO } = useQuery({
    queryKey: ["hero-images"],
    queryFn: async () => {
      const { data } = await supabase.from("hero_images").select("*").eq("is_active", true).order("sort_order");
      return data && data.length > 0 ? data : FALLBACK_HERO;
    },
  });

  // ✅ Top 10 real photos only — no fallbacks
  const { data: featuredImages, isLoading: galleryLoading } = useQuery({
    queryKey: ["gallery-featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gallery_images")
        .select("url, category, media_type")
        .order("sort_order")
        .limit(10);
      if (!data || data.length === 0) return [];
      return data.filter(item => {
        if (item.media_type === "video") return false;
        const url = item.url?.toLowerCase() ?? "";
        return !url.includes("/video/") && !/\.(mp4|mov|webm)/.test(url);
      });
    },
  });

  const [activeCat, setActiveCat] = useState(0);

  useEffect(() => {
    if (hero.length < 2) return;
    const id = setInterval(() => setActiveCat(c => (c + 1) % hero.length), 3500);
    return () => clearInterval(id);
  }, [hero.length]);

  return (
    <Layout>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[85vh]">
        <div className="absolute inset-0">
          {hero.map((c, i) => (
            <img
              key={c.id}
              src={c.url}
              alt={c.category_label}
              loading={i === 0 ? "eager" : "lazy"}
              className={
                "absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 " +
                (i === activeCat ? "opacity-100" : "opacity-0")
              }
            />
          ))}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.60) 50%, rgba(0,0,0,0.10) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.30) 0%, transparent 70%, rgba(0,0,0,0.05) 100%)" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-16 lg:pt-28 pb-20 lg:pb-32">
          <div className="max-w-xl lg:max-w-3xl">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              <span className="w-10 h-px bg-muted-foreground/60" />
              Tann Media{hero[activeCat]?.category_label ? " · " + hero[activeCat].category_label : ""}
            </div>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95]">
              Your moments<br />
              <span className="italic text-gradient-warm">cinematically</span><br />
              told<span className="text-primary">.</span>
            </h1>
            <p className="mt-4 text-xs sm:text-sm uppercase tracking-[0.3em] text-primary/90 font-semibold">
              Your Moments. Cinematically Told.
            </p>
            <p className="mt-5 text-sm md:text-lg text-muted-foreground max-w-xl">
              At Tann Media, we capture the true essence of life through our lens — from joyous weddings
              to graduations, matric dances and memorable events, we create timeless visuals you will treasure forever.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact" search={{ category: undefined, package: undefined }}
                className="btn-lime px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2">
                Book a Session <ArrowRight size={16} />
              </Link>
              <Link to="/gallery"
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-sm bg-secondary/80 backdrop-blur border border-border inline-flex items-center gap-2 hover:bg-secondary">
                <Play size={14} className="fill-current" /> View Gallery
              </Link>
            </div>
            {hero.length > 1 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {hero.map((c, i) => (
                  <button key={c.id} onClick={() => setActiveCat(i)}
                    className={"px-3 py-1.5 rounded-full text-xs border transition-all " +
                      (i === activeCat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/60 backdrop-blur border-border text-muted-foreground hover:text-foreground")}>
                    {c.category_label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-12 lg:mt-16">
        <div className="grid grid-cols-3 gap-4 border-y border-border py-8">
          {STATS.map(s => (
            <div key={s.l}>
              <div className="font-display text-2xl sm:text-3xl md:text-5xl font-bold flex items-center gap-1">
                {s.n}
                {s.star && <Star size={18} className="fill-primary text-primary" />}
              </div>
              <div className="mt-2 text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recent Work — top 10 real photos ── */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-16 sm:mt-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <span className="eyebrow">Recent Work</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold mt-3">
              A glimpse of <span className="text-gradient-warm">our craft</span>
            </h2>
          </div>
          <Link to="/gallery" className="btn-lime px-5 py-3 rounded-md text-sm whitespace-nowrap inline-flex items-center gap-2">
            See full gallery <ArrowRight size={14} />
          </Link>
        </div>

        {/* Skeleton loader */}
        {galleryLoading && (
          <div className="columns-2 md:columns-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`mb-3 break-inside-avoid rounded-xl bg-secondary/50 animate-pulse ${i % 3 === 0 ? "h-72" : "h-48"}`} />
            ))}
          </div>
        )}

        {/* Top 10 real Cloudinary photos */}
        {!galleryLoading && featuredImages && featuredImages.length > 0 && (
          <>
            <div className="columns-2 md:columns-3 gap-3 [column-fill:_balance]">
              {featuredImages.map((img, i) => (
                <Link key={i} to="/gallery"
                  className="mb-3 block break-inside-avoid overflow-hidden rounded-xl bg-secondary group">
                  <img
                    src={img.url}
                    alt={img.category}
                    loading="lazy"
                    className="w-full h-auto block group-hover:scale-105 transition-transform duration-700"
                  />
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/gallery"
                className="btn-lime px-6 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2">
                View all photos & videos <ArrowRight size={14} />
              </Link>
            </div>
          </>
        )}

        {/* Empty state */}
        {!galleryLoading && (!featuredImages || featuredImages.length === 0) && (
          <div className="text-center py-20 text-muted-foreground">
            <Camera size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">No photos uploaded yet.</p>
            <p className="text-xs mt-1 opacity-60">Upload photos in the admin gallery to display them here.</p>
          </div>
        )}
      </section>

      {/* ── Quote Calculator ── */}
      <QuoteCalculator embedded />

      {/* ── Testimonials — from admin ── */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <span className="eyebrow">Testimonials</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold mt-3">
              Client <span className="text-gradient-warm">Feedback</span>
            </h2>
          </div>
          {testimonials.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">
                {(testimonials.reduce((s, t) => s + (t.rating ?? 0), 0) / testimonials.length).toFixed(1)}
              </span>
              avg from {testimonials.length} review{testimonials.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Skeleton */}
        {testimonialsLoading && (
          <div className="grid md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="panel p-6 animate-pulse space-y-3">
                <div className="flex gap-1">{Array.from({ length: 5 }).map((_, j) => <div key={j} className="w-3 h-3 rounded bg-secondary" />)}</div>
                <div className="h-16 bg-secondary rounded" />
                <div className="h-4 bg-secondary rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!testimonialsLoading && testimonials.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map(t => (
              <div key={t.id} className="panel p-6 flex flex-col">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < (t.rating ?? 0) ? "fill-amber-400 text-amber-400" : "fill-secondary text-secondary"} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.quote}"</p>
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-bold shrink-0">
                    {t.client_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.client_name}</div>
                    {t.category && <div className="text-xs text-muted-foreground">{t.category}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!testimonialsLoading && testimonials.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Star size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No testimonials yet — they appear here once approved in admin.</p>
          </div>
        )}
      </section>

      {/* ── CTA + Auth ── */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-24 mb-16">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="panel p-8 lg:p-12">
            <h2 className="font-display text-3xl md:text-5xl font-bold">
              Ready to <span className="text-gradient-warm">create?</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Preserve your most valuable moments with Tann Media, where every shot tells your story.
            </p>
            <Link to="/contact" search={{ category: undefined, package: undefined }}
              className="mt-6 inline-flex btn-lime px-6 py-3 rounded-md text-sm">
              Start your booking
            </Link>
            <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a href="tel:0714967968" className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-xs">
                <Phone size={16} className="text-primary" />071 496 7968
              </a>
              <a href="https://wa.me/27815051466" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-xs">
                <MessageCircle size={16} className="text-primary" />WhatsApp
              </a>
              <a href="https://instagram.com/tannphotography" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-xs">
                <Instagram size={16} className="text-primary" />Instagram
              </a>
              <a href="https://www.tiktok.com/@tann.media" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-xs">
                <TikTokIcon />TikTok
              </a>
            </div>
          </div>
          <HomeAuthPanel />
        </div>
      </section>
    </Layout>
  );
}

function HomeAuthPanel() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <div className="panel p-8 lg:p-12 flex flex-col justify-center text-center">
        <h3 className="font-display text-2xl font-bold">Welcome back</h3>
        <p className="text-sm text-muted-foreground mt-2">Manage your bookings, favourites and gallery from your dashboard.</p>
        <Link to="/dashboard" className="mt-6 inline-flex self-center btn-lime px-5 py-2.5 rounded-md text-sm">Open dashboard</Link>
      </div>
    );
  }

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error("Couldn't sign in with Google");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else { toast.success("Welcome back"); nav({ to: "/dashboard" }); }
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/dashboard" },
      });
      if (error) toast.error(error.message);
      else toast.success("Account created — check your email to confirm.");
    }
    setBusy(false);
  };

  return (
    <div className="panel p-8 lg:p-12">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="font-display text-2xl font-bold">{mode === "in" ? "Sign in" : "Create account"}</h3>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="text-xs text-primary hover:underline">
          {mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Save your favourites and re-book in one click.</p>
      <button onClick={google} className="w-full panel border-border hover:border-primary transition-colors px-4 py-2.5 rounded-md text-sm flex items-center justify-center gap-2">
        <svg width="16" height="16" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 01-11.3 8 12 12 0 110-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1024 44a20 20 0 0019.6-23.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0124 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 006.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3A12 12 0 0112.7 28l-6.5 5A20 20 0 0024 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 01-4.1 5.5l6.3 5.3C42.3 36 44 30.5 44 24c0-1.2-.1-2.3-.4-3.5z" />
        </svg>
        Continue with Google
      </button>
      <div className="flex items-center gap-3 my-4 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="flex-1 h-px bg-border" />or email<span className="flex-1 h-px bg-border" />
      </div>
      <form onSubmit={submit} className="space-y-2.5">
        {mode === "up" && (
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required
            className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm" />
        )}
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" required
          className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm" />
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" required minLength={6}
          className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm" />
        <button disabled={busy} className="w-full btn-lime px-4 py-2.5 rounded-md text-sm font-semibold disabled:opacity-50">
          {busy ? "Please wait..." : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}