import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Check, ArrowRight, Sparkles } from "lucide-react";

interface AddOn { id: string; label: string; price: number }
const ADDONS: AddOn[] = [
  { id: "express", label: "Next-day express delivery", price: 1000 },
  { id: "extra_images", label: "Extra edited images (+20)", price: 500 },
  { id: "reel", label: "Reel add-on (30s vertical edit)", price: 2000 },
];

export function QuoteCalculator({ embedded = false }: { embedded?: boolean }) {
  const { data: packages = [] } = useQuery({
    queryKey: ["packages-active-quote"],
    queryFn: async () =>
      (await supabase.from("packages").select("id, name, category, price, duration").eq("is_active", true).order("category").order("sort_order")).data ?? [],
  });

  const [category, setCategory] = useState<string>("");
  const [packageId, setPackageId] = useState<string>("");
  const [addons, setAddons] = useState<string[]>([]);

  const categories = useMemo(() => Array.from(new Set(packages.map(p => p.category))), [packages]);
  const filtered = useMemo(() => packages.filter(p => p.category === category), [packages, category]);
  const pkg = packages.find(p => p.id === packageId);
  const addonTotal = addons.reduce((s, id) => s + (ADDONS.find(a => a.id === id)?.price ?? 0), 0);
  const total = Number(pkg?.price ?? 0) + addonTotal;
  const deposit = Math.round(total / 2);
  const turnaround = addons.includes("express") ? "Next-day delivery" : "4–5 day turnaround";

  return (
    <section className={embedded ? "max-w-7xl mx-auto px-5 lg:px-8 mt-24" : "max-w-4xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20"}>
      <span className="eyebrow">— Get a quote</span>
      <h2 className="font-display text-4xl md:text-6xl font-bold mt-3">
        Instant quote. <span className="text-gradient-warm">No waiting.</span>
      </h2>
      <p className="text-muted-foreground mt-3 max-w-xl">Build your shoot in 3 steps. The total updates live, no email required.</p>

      <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="panel p-6 lg:p-8 space-y-6">
          {/* Step 1 */}
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Step 1 · Pick a category</div>
            <select value={category} onChange={e => { setCategory(e.target.value); setPackageId(""); }}
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm">
              <option value="">Choose a category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Step 2 */}
          {category && (
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Step 2 · Choose a package</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {filtered.map(p => (
                  <button key={p.id} onClick={() => setPackageId(p.id)}
                    className={`text-left p-4 rounded-lg border transition-colors ${packageId === p.id ? "border-primary bg-primary/10" : "border-border bg-secondary/40 hover:border-primary/50"}`}>
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.duration}</div>
                    <div className="font-display text-xl font-bold mt-2">R{Number(p.price).toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {packageId && (
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Step 3 · Add-ons (optional)</div>
              <div className="space-y-2">
                {ADDONS.map(a => {
                  const on = addons.includes(a.id);
                  return (
                    <label key={a.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${on ? "border-primary bg-primary/10" : "border-border bg-secondary/40 hover:border-primary/40"}`}>
                      <span className="flex items-center gap-2 text-sm">
                        <span className={`w-5 h-5 rounded grid place-items-center border ${on ? "bg-primary border-primary" : "border-border"}`}>
                          {on && <Check size={12} className="text-primary-foreground" />}
                        </span>
                        {a.label}
                      </span>
                      <span className="font-semibold text-sm">+R{a.price.toLocaleString()}</span>
                      <input type="checkbox" checked={on} onChange={() => setAddons(on ? addons.filter(x => x !== a.id) : [...addons, a.id])} className="sr-only" />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Live quote */}
        <aside className="panel p-6 h-fit lg:sticky lg:top-24 bg-gradient-to-br from-primary/10 via-background to-background border-primary/40">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
            <Sparkles size={14} /> Live quote
          </div>
          {pkg ? (
            <>
              <div className="mt-4 text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">{pkg.name}</span><span>R{Number(pkg.price).toLocaleString()}</span></div>
                {addons.map(id => {
                  const a = ADDONS.find(x => x.id === id)!;
                  return <div key={id} className="flex justify-between text-xs"><span className="text-muted-foreground">+ {a.label}</span><span>R{a.price.toLocaleString()}</span></div>;
                })}
              </div>
              <div className="my-4 h-px bg-border" />
              <div className="flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Total</span>
                <span className="font-display text-3xl font-bold">R{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline mt-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">50% deposit</span>
                <span className="font-display text-xl font-bold text-destructive">R{deposit.toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">⏱ {turnaround}</div>
              <Link to="/contact" search={{ category, package: pkg.name } as any}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 px-5 py-3 rounded-md text-sm font-semibold">
                Book This Now <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-3">Pick a category and package to see your quote.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
