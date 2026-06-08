import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Check, Camera, Users, Briefcase, Baby, Heart, Smile, Package, Play } from "lucide-react";

const ICONS: Record<string, any> = {
  Wedding: Heart, Portrait: Camera, Events: Users, Product: Package,
  Maternity: Baby, Kids: Smile, Corporate: Briefcase,
  Photography: Camera, Videography: Play,
};

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Trope Photography" },
      { name: "description", content: "Transparent pricing for weddings, portraits, events, product, maternity, kids and corporate photography." },
      { property: "og:title", content: "Pricing — Trope Photography" },
      { property: "og:description", content: "Transparent pricing. No hidden costs. Pick a package or build a custom shoot." },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const { data: packages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: async () =>
      (await supabase.from("packages").select("*").eq("is_active", true).order("category_sort_order").order("category").order("sort_order")).data ?? [],
  });

  // Group preserving first-seen order (sorted by category_sort_order from query)
  const grouped: { cat: string; items: typeof packages }[] = [];
  packages.forEach(p => {
    const g = grouped.find(x => x.cat === p.category);
    if (g) g.items.push(p); else grouped.push({ cat: p.category, items: [p] });
  });

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20 text-center">
        <span className="eyebrow inline-flex">Pricing Plan</span>
        <h1 className="font-display text-5xl md:text-7xl font-bold mt-4">
          Transparent pricing —<br /><span className="text-gradient-warm">no hidden costs.</span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Pick a session below. Custom packages available on request.</p>
      </section>

      <div className="max-w-7xl mx-auto px-5 lg:px-8 mt-16 space-y-20 pb-20">
        {grouped.map(({ cat, items }) => {
          const Icon = ICONS[cat] ?? Camera;
          return (
            <section key={cat}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">— {cat}</span>
              </div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground grid place-items-center"><Icon size={20} /></div>
                <h2 className="font-display text-3xl md:text-4xl font-bold">{cat} <span className="text-muted-foreground font-normal text-xl">packages</span></h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {items.map(p => (
                  <PackageCard key={p.id} p={p} Icon={Icon} />
                ))}
              </div>
            </section>
          );
        })}
        {grouped.length === 0 && (
          <div className="panel p-8 text-center text-muted-foreground">Packages will appear here.</div>
        )}
      </div>

      <p className="max-w-2xl mx-auto text-center text-sm text-muted-foreground mb-20 px-5">
        All prices include VAT. Travel outside 30km billed separately. Custom packages available — just ask.
      </p>
    </Layout>
  );
}

function PackageCard({ p, Icon }: { p: any; Icon: any }) {
  const mediaType = p.media_type ?? (p.media_url ? "image" : "none");
  const mediaUrl = p.media_url || p.cover_image_url || (p.video_url && /(mp4|webm|mov)$/i.test(p.video_url) ? p.video_url : null);

  return (
    <div className={`panel flex flex-col overflow-hidden ${p.is_popular ? "border-destructive ring-1 ring-destructive" : ""}`}>
      {/* Media header */}
      <div className="aspect-video w-full bg-gradient-to-br from-secondary to-background relative overflow-hidden">
        {mediaUrl && mediaType === "video" ? (
          <video src={mediaUrl} muted loop playsInline autoPlay preload="metadata" poster={p.cover_image_url ?? undefined}
            className="w-full h-full object-cover" />
        ) : mediaUrl ? (
          <img src={mediaUrl} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground/40">
            <Icon size={48} />
          </div>
        )}
        {p.is_popular && (
          <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
            Most popular
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="font-display text-xl font-bold">{p.name}</div>
        <div className="mt-3 font-display text-4xl font-bold">
          R{Number(p.price).toLocaleString()}<span className="text-base text-muted-foreground font-normal"> / {p.duration}</span>
        </div>
        {p.additional_hour_rate && (
          <div className="text-xs text-muted-foreground mt-1">+ R{Number(p.additional_hour_rate).toLocaleString()} per extra hour</div>
        )}
        <ul className="mt-5 space-y-2 text-sm flex-1">
          {((p.features as string[]) ?? []).map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check size={16} className="text-primary shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
        {p.deliverables && (
          <div className="mt-3 text-xs text-muted-foreground border-t border-border pt-3">
            <span className="text-foreground font-semibold">Deliverables: </span>{p.deliverables}
          </div>
        )}
        <Link to="/contact" search={{ category: p.category, package: p.name } as any}
          className={`mt-6 text-center px-5 py-3 rounded-md text-sm ${p.is_popular ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "btn-lime"}`}>
          Book this package
        </Link>
      </div>
    </div>
  );
}
