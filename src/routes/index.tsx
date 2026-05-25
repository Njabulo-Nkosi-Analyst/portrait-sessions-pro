import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Play, Star, Phone, MessageCircle, Instagram, Mail } from "lucide-react";

const FALLBACK_HERO = [
  { id: "1", url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80", category_label: "Weddings" },
  { id: "2", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1600&q=80", category_label: "Portraits" },
  { id: "3", url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80", category_label: "Events" },
];

const FEATURED = [
  "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=80",
];

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "TANN Photography — Your story in natural light" }] }),
  component: Home,
});

function Home() {
  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => (await supabase.from("testimonials").select("*").limit(3)).data ?? [],
  });

  const { data: hero = FALLBACK_HERO } = useQuery({
    queryKey: ["hero-images"],
    queryFn: async () => {
      const { data } = await supabase.from("hero_images").select("*").eq("is_active", true).order("sort_order");
      return data && data.length > 0 ? data : FALLBACK_HERO;
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
      {/* Hero with rotating background (admin-managed) */}
      <section className="relative overflow-hidden min-h-[85vh]">
        <div className="absolute inset-0">
          {hero.map((c, i) => (
            <img key={c.id} src={c.url} alt={c.category_label} loading={i === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === activeCat ? "opacity-100" : "opacity-0"}`} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-16 lg:pt-28 pb-20 lg:pb-32">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              <span className="w-10 h-px bg-muted-foreground/60" />
              TANN Photography · {hero[activeCat]?.category_label}
            </div>
            <h1 className="mt-6 font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95]">
              Your story<br />
              in <span className="italic text-gradient-warm">natural light</span><span className="text-primary">.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl">
              We capture the true essence of life through our lens — joyous weddings, fun lifestyle sessions, sport, and memorable events. Timeless visuals you'll treasure forever.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact" className="btn-lime px-6 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2">
                Book a Session <ArrowRight size={16} />
              </Link>
              <Link to="/gallery" className="px-6 py-3 rounded-full text-sm bg-secondary/80 backdrop-blur border border-border inline-flex items-center gap-2 hover:bg-secondary">
                <Play size={14} className="fill-current" /> View Gallery
              </Link>
            </div>
            {hero.length > 1 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {hero.map((c, i) => (
                  <button key={c.id} onClick={() => setActiveCat(i)}
                    className={`px-4 py-1.5 rounded-full text-xs border transition-all ${i === activeCat ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/60 backdrop-blur border-border text-muted-foreground hover:text-foreground"}`}>
                    {c.category_label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-12 lg:mt-16">
        <div className="grid grid-cols-3 gap-4 border-y border-border py-8">
          {[
            { n: "25+", l: "Years shooting" },
            { n: "1.2K", l: "Sessions delivered" },
            { n: "4.98★", l: "Avg rating" },
          ].map(s => (
            <div key={s.l}>
              <div className="font-display text-3xl md:text-5xl font-bold">{s.n}</div>
              <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Work */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <span className="eyebrow">Recent Work</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold mt-3">
              A glimpse of <span className="text-gradient-warm">my craft</span>
            </h2>
          </div>
          <Link to="/gallery" className="btn-lime px-5 py-3 rounded-md text-sm whitespace-nowrap">See full gallery</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURED.map((src, i) => (
            <div key={i} className={`overflow-hidden rounded-xl bg-secondary ${i % 5 === 0 ? "aspect-[3/4] md:row-span-2 md:aspect-[3/5]" : "aspect-[3/4]"}`}>
              <img src={src} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-24">
        <span className="eyebrow">Testimonial</span>
        <h2 className="font-display text-4xl md:text-6xl font-bold mt-3 mb-10">
          Client <span className="text-gradient-warm">Feedback</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map(t => (
            <div key={t.id} className="panel p-6">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} className="fill-primary text-primary" />)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">"{t.quote}"</p>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="font-semibold text-sm">{t.client_name}</div>
                <div className="text-xs text-muted-foreground">{t.category}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-24">
        <div className="panel p-10 lg:p-16 text-center">
          <h2 className="font-display text-4xl md:text-6xl font-bold">
            Ready to <span className="text-gradient-warm">create?</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Tell me about your vision — I'll get back within 24 hours.</p>
          <Link to="/contact" className="mt-8 inline-flex btn-lime px-6 py-3 rounded-md text-sm">Start your booking</Link>
        </div>
      </section>
    </Layout>
  );
}
