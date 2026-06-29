import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  Check, Camera, Users, Briefcase, Baby, Heart, Smile,
  Package, Video, Star, ArrowRight, Phone, Tag, X,
} from "lucide-react";

const getIcon = (cat: string) => {
  const c = cat.toLowerCase();
  if (c.includes("wedding")) return Heart;
  if (c.includes("portrait")) return Camera;
  if (c.includes("event") || c.includes("coverage")) return Users;
  if (c.includes("product")) return Package;
  if (c.includes("maternity")) return Baby;
  if (c.includes("kid") || c.includes("child")) return Smile;
  if (c.includes("corporate")) return Briefcase;
  if (c.includes("video")) return Video;
  if (c.includes("combo")) return Star;
  return Camera;
};

export const Route = createFileRoute("/pricing")({
  validateSearch: (s: Record<string, unknown>) => ({
    highlight: typeof s.highlight === "string" ? s.highlight : undefined,
    category:  typeof s.category  === "string" ? s.category  : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pricing — Tann Media" },
      { name: "description", content: "Transparent pricing for weddings, portraits, events, videography and combo packages." },
    ],
  }),
  component: Pricing,
});

const looseMatch = (a?: string | null, b?: string | null) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

function Pricing() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [bookingModal, setBookingModal] = useState<{ pkg: any; pricing: any } | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { highlight, category } = Route.useSearch();

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: async () =>
      (await supabase.from("packages").select("*").eq("is_active", true)
        .order("category_sort_order").order("category").order("sort_order")).data ?? [],
  });

  const { data: activePromo } = useQuery({
    queryKey: ["active-promo-pricing"],
    queryFn: async () => {
      const { data } = await supabase.from("promotions").select("*")
        .eq("is_active", true).gt("ends_at", new Date().toISOString())
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const { data: addons = [] } = useQuery({
    queryKey: ["addons-active"],
    queryFn: async () =>
      (await supabase.from("add_ons").select("id, label, price")
        .eq("is_active", true).order("sort_order")).data ?? [],
  });

  // When ?category= arrives, switch tab
  useEffect(() => {
    if (category) setActiveTab(category);
  }, [category]);

  // When ?highlight= arrives, find the exact package (matched by category + name),
  // switch to its tab, scroll to it and flash it
  useEffect(() => {
    if (!highlight || isLoading || packages.length === 0) return;

    // Match by package_id first (most reliable), then name+category
    const pkg = packages.find((p: any) =>
      p.id === highlight ||
      (looseMatch(p.name, highlight) && (category ? looseMatch(p.category, category) : true))
    );

    if (!pkg) return; // no match — do nothing, don't crash

    setActiveTab(pkg.category);
    setHighlightedId(pkg.id);

    const t1 = setTimeout(() => {
      const el = document.getElementById(`pkg-${pkg.id}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightedId(null), 3000);
    }, 400);

    return () => clearTimeout(t1);
  }, [highlight, category, isLoading, packages]);

  const grouped: { cat: string; items: typeof packages }[] = [];
  packages.forEach((p: any) => {
    const g = grouped.find(x => x.cat === p.category);
    if (g) g.items.push(p);
    else grouped.push({ cat: p.category, items: [p] });
  });

  const categories = grouped.map(g => g.cat);
  const currentTab = activeTab ?? categories[0] ?? null;
  const activeGroup = grouped.find(g => g.cat === currentTab);

  const getEffectivePricing = (p: any) => {
    const promoHits = activePromo?.sale_price != null && (
      (activePromo.package_id && activePromo.package_id === p.id) ||
      (!activePromo.package_id &&
        looseMatch(activePromo.package_name, p.name) &&
        looseMatch(activePromo.package_category, p.category))
    );
    if (promoHits) {
      return {
        price: Number(activePromo.sale_price),
        originalPrice: Number(p.price),
        onSale: true,
        savings: Number(p.price) - Number(activePromo.sale_price),
      };
    }
    if (p.is_on_sale && p.sale_price != null) {
      return {
        price: Number(p.sale_price),
        originalPrice: Number(p.price),
        onSale: true,
        savings: Number(p.price) - Number(p.sale_price),
      };
    }
    return { price: Number(p.price), originalPrice: null, onSale: false, savings: null };
  };

  const handleBookClick = (p: any) => {
    const pricing = getEffectivePricing(p);
    if (addons.length > 0) {
      setBookingModal({ pkg: p, pricing });
    } else {
      navigate({ to: "/contact", search: { category: p.category, package: p.name } as any, hash: "booking-form" });
    }
  };

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20 text-center">
        <span className="eyebrow inline-flex">Pricing Plans</span>
        <h1 className="font-display text-5xl md:text-7xl font-bold mt-4">
          Transparent pricing<br />
          <span className="text-gradient-warm">no hidden costs.</span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-sm">
          Choose your service type below. All prices exclude transport and service fee.
          Custom packages available on request.
        </p>
      </section>

      {categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-5 lg:px-8 mt-12">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(cat => {
              const Icon = getIcon(cat);
              const isActive = cat === currentTab;
              return (
                <button key={cat} onClick={() => setActiveTab(cat)}
                  className={"px-5 py-2.5 rounded-full text-sm border transition-all inline-flex items-center gap-2 " +
                    (isActive
                      ? "bg-primary text-primary-foreground border-primary font-semibold"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50")}>
                  <Icon size={14} />{cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-5 lg:px-8 mt-10 pb-20">
        {isLoading && <div className="text-center text-muted-foreground py-20">Loading packages...</div>}

        {!isLoading && activeGroup && (
          <section>
            <CategoryHeader cat={activeGroup.cat} />
            <div className={"grid gap-5 " +
              (activeGroup.items.length === 1 ? "max-w-sm" :
                activeGroup.items.length === 2 ? "md:grid-cols-2 max-w-3xl" :
                  "md:grid-cols-2 lg:grid-cols-3")}>
              {activeGroup.items.map((p: any) => (
                <PackageCard
                  key={p.id}
                  p={p}
                  pricing={getEffectivePricing(p)}
                  isHighlighted={highlightedId === p.id}
                  onBook={() => handleBookClick(p)}
                />
              ))}
            </div>
            <p className="mt-8 text-xs text-muted-foreground">
              Excludes transport and service fee. Video lengths are approximate and may vary depending on event and available footage.
            </p>
          </section>
        )}

        {!isLoading && grouped.length === 0 && (
          <div className="panel p-8 text-center text-muted-foreground">No packages available yet. Check back soon.</div>
        )}

        <div className="mt-20 panel p-8 lg:p-12 text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Not sure which package?</h2>
          <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto">
            Tell us about your event and we will recommend the best option for your budget and needs. Custom packages always available.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link to="/contact" search={{ category: undefined, package: undefined }} hash="booking-form"
              className="btn-lime px-6 py-3 rounded-md text-sm font-semibold inline-flex items-center gap-2">
              Get a custom quote <ArrowRight size={16} />
            </Link>
            <a href="https://wa.me/27815051466" target="_blank" rel="noreferrer"
              className="px-6 py-3 rounded-md text-sm border border-border hover:border-primary transition-colors inline-flex items-center gap-2">
              <Phone size={14} /> WhatsApp us
            </a>
          </div>
          <div className="mt-6 pt-6 border-t border-border text-xs text-muted-foreground space-y-1">
            <div>071 496 7968 | 081 505 1466 | tannphotography23@gmail.com</div>
            <div>Gauteng, South Africa</div>
          </div>
        </div>
      </div>

      {bookingModal && (
        <AddOnsModal
          pkg={bookingModal.pkg}
          pricing={bookingModal.pricing}
          addons={addons}
          onClose={() => setBookingModal(null)}
          onConfirm={(selectedAddons) => {
            setBookingModal(null);
            navigate({
              to: "/contact",
              search: {
                category: bookingModal.pkg.category,
                package: bookingModal.pkg.name,
                addons: selectedAddons.join(",") || undefined,
              } as any,
              hash: "booking-form",
            });
          }}
        />
      )}
    </Layout>
  );
}

function AddOnsModal({ pkg, pricing, addons, onClose, onConfirm }: {
  pkg: any;
  pricing: any;
  addons: any[];
  onClose: () => void;
  onConfirm: (selected: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const addonTotal = selected.reduce((s, label) => {
    const a = addons.find((x: any) => x.label === label);
    return s + (a?.price ?? 0);
  }, 0);

  const total = pricing.price + addonTotal;

  const toggle = (label: string) =>
    setSelected(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="panel p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-bold">Customise your booking</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{pkg.name} · {pkg.category}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="mb-5 p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{pkg.name}</span>
            <div className="text-right">
              {pricing.onSale ? (
                <>
                  <div className="text-xs text-muted-foreground line-through">R{pricing.originalPrice.toLocaleString()}</div>
                  <div className="font-display text-xl font-bold text-orange-500">R{pricing.price.toLocaleString()}</div>
                </>
              ) : (
                <div className="font-display text-xl font-bold">R{pricing.price.toLocaleString()}</div>
              )}
            </div>
          </div>
          {pricing.onSale && (
            <div className="mt-1 text-xs text-orange-400 bg-orange-500/10 rounded px-2 py-1 inline-block">
              🔥 Sale price — you save R{pricing.savings?.toLocaleString()}!
            </div>
          )}
        </div>

        <div className="mb-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
            Add-ons (optional)
          </div>
          <div className="space-y-2">
            {addons.map((a: any) => {
              const on = selected.includes(a.label);
              return (
                <label key={a.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    on ? "border-primary bg-primary/10" : "border-border bg-secondary/40 hover:border-primary/40"
                  }`}>
                  <span className="flex items-center gap-2 text-sm">
                    <span className={`w-5 h-5 rounded grid place-items-center border shrink-0 ${on ? "bg-primary border-primary" : "border-border"}`}>
                      {on && <Check size={12} className="text-primary-foreground" />}
                    </span>
                    {a.label}
                  </span>
                  <span className="font-semibold text-sm shrink-0 text-primary">+R{Number(a.price).toLocaleString()}</span>
                  <input type="checkbox" checked={on} onChange={() => toggle(a.label)} className="sr-only" />
                </label>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated total</span>
            <span className="font-display text-2xl font-bold">R{total.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">50% deposit to confirm</span>
            <span className="text-sm font-semibold text-primary">R{Math.round(total / 2).toLocaleString()}</span>
          </div>
          {selected.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Includes: {selected.join(", ")}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-md text-sm border border-border hover:bg-secondary">
            Cancel
          </button>
          <button onClick={() => onConfirm(selected)}
            className="flex-1 btn-lime px-4 py-2 rounded-md text-sm font-semibold inline-flex items-center justify-center gap-2">
            Continue to booking <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryHeader({ cat }: { cat: string }) {
  const Icon = getIcon(cat);
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground grid place-items-center shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1">Tann Media</div>
        <h2 className="font-display text-3xl md:text-4xl font-bold">
          {cat}<span className="text-muted-foreground font-normal text-xl ml-2">packages</span>
        </h2>
      </div>
    </div>
  );
}

function PackageCard({ p, pricing, isHighlighted, onBook }: {
  p: any;
  pricing: any;
  isHighlighted?: boolean;
  onBook: () => void;
}) {
  const Icon = getIcon(p.category);
  const mediaUrl = p.media_url || p.cover_image_url || null;
  const isVideo = p.media_type === "video" || (mediaUrl && /\.(mp4|webm|mov)/.test(mediaUrl));
  const { onSale, price, originalPrice } = pricing;

  const deliverableLines: string[] = p.deliverables
    ? p.deliverables.includes("\n")
      ? p.deliverables.split("\n").filter((d: string) => d.trim())
      : p.deliverables.split(",").map((d: string) => d.trim()).filter(Boolean)
    : [];

  const perfectForLines: string[] = p.perfect_for
    ? p.perfect_for.includes("\n")
      ? p.perfect_for.split("\n").filter((d: string) => d.trim())
      : p.perfect_for.split(",").map((d: string) => d.trim()).filter(Boolean)
    : [];

  const features: string[] = Array.isArray(p.features) ? p.features : [];

  return (
    <div
      id={`pkg-${p.id}`}
      className={[
        "panel flex flex-col overflow-hidden transition-all relative hover:shadow-lg hover:-translate-y-0.5",
        isHighlighted
          ? "ring-2 ring-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.35)] scale-[1.01]"
          : "",
        onSale && !isHighlighted
          ? "border-orange-500/60 ring-1 ring-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.15)]"
          : "",
        p.is_popular && !onSale && !isHighlighted
          ? "border-primary ring-1 ring-primary"
          : "",
      ].filter(Boolean).join(" ")}
    >
      {onSale && (
        <div className="absolute top-3 left-3 z-20 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
          <Tag size={10} /> SALE
        </div>
      )}
      {p.is_popular && !onSale && (
        <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest py-1.5 text-center z-10">
          Most Popular
        </div>
      )}

      <div className={"w-full bg-gradient-to-br from-secondary to-background relative overflow-hidden " +
        (mediaUrl ? "aspect-video" : "h-20") + (p.is_popular ? " mt-6" : "")}>
        {mediaUrl && isVideo ? (
          <video src={mediaUrl} muted loop playsInline autoPlay preload="metadata"
            poster={p.cover_image_url ?? undefined} className="w-full h-full object-cover" />
        ) : mediaUrl ? (
          <img src={mediaUrl} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground/20"><Icon size={36} /></div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="font-display text-xl font-bold">{p.name}</div>

        <div className="mt-3 flex items-end gap-2 flex-wrap">
          {onSale ? (
            <>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm line-through">R{originalPrice?.toLocaleString()}</span>
                <span className="font-display text-4xl font-bold text-orange-500">R{price.toLocaleString()}</span>
              </div>
              <span className="text-muted-foreground text-sm mb-1">/ {p.duration}</span>
            </>
          ) : (
            <>
              <span className="font-display text-4xl font-bold text-primary">R{price.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm mb-1">/ {p.duration}</span>
            </>
          )}
        </div>

        {p.additional_hour_rate && (
          <div className="text-xs text-primary/70 mt-1">+ R{Number(p.additional_hour_rate).toLocaleString()} per extra hour</div>
        )}

        <div className="mt-5 flex-1 space-y-4">
          {features.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Includes</div>
              <ul className="space-y-1.5">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check size={14} className="text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {deliverableLines.length > 0 && (
            <div className="border-t border-border pt-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Deliverables</div>
              <ul className="space-y-1.5">
                {deliverableLines.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check size={14} className="text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {perfectForLines.length > 0 && (
            <div className="border-t border-border pt-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Perfect For</div>
              <ul className="space-y-1.5">
                {perfectForLines.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5 shrink-0">✦</span>
                    <span className="text-muted-foreground">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button onClick={onBook}
          className={"mt-6 text-center px-5 py-3 rounded-md text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 " +
            (onSale
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : p.is_popular
                ? "bg-primary text-primary-foreground hover:bg-primary/90 pulse-cta"
                : "btn-lime")}>
          Book this package <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}