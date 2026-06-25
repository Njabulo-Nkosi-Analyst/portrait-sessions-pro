import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Check, ArrowRight, Sparkles, Tag, ChevronDown, ChevronUp } from "lucide-react";

export function QuoteCalculator({ embedded = false }: { embedded?: boolean }) {
  // Use "*" to avoid Supabase TypeScript type-checking blocking specific columns
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["packages-active-quote"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: addons = [] } = useQuery({
    queryKey: ["addons-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("add_ons")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data ?? [];
    },
  });

  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [packageId, setPackageId] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);

  // Unique sorted categories from active packages
  const categories = useMemo(
    () => Array.from(new Set(packages.map((p: any) => p.category))).filter(Boolean).sort() as string[],
    [packages]
  );

  const filtered = useMemo(
    () => packages.filter((p: any) => p.category === category),
    [packages, category]
  );

  const pkg = packages.find((p: any) => p.id === packageId) as any | undefined;

  // Use sale price when on sale
  const basePrice = pkg
    ? (pkg.is_on_sale && pkg.sale_price ? Number(pkg.sale_price) : Number(pkg.price))
    : 0;

  const addonTotal = selectedAddons.reduce((s, id) => {
    const a = addons.find((x: any) => x.id === id) as any;
    return s + (a?.price ?? 0);
  }, 0);

  const total = basePrice + addonTotal;
  const deposit = Math.round(total / 2);

  const hasExpress = selectedAddons.some(id => {
    const a = addons.find((x: any) => x.id === id) as any;
    return a?.label?.toLowerCase().includes("express");
  });
  const turnaround = hasExpress ? "Next-day delivery" : "4–5 day turnaround";
  const activeCategory = isCustom ? customCategory : category;

  return (
    <section className={embedded
      ? "max-w-7xl mx-auto px-5 lg:px-8 mt-24"
      : "max-w-4xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20"
    }>
      <span className="eyebrow">— Get a quote</span>
      <h2 className="font-display text-4xl md:text-6xl font-bold mt-3">
        Instant quote. <span className="text-gradient-warm">No waiting.</span>
      </h2>
      <p className="text-muted-foreground mt-3 max-w-xl">
        Build your shoot in 3 steps. The total updates live, no email required.
      </p>

      <div className="mt-8 grid lg:grid-cols-[1fr_340px] gap-6">
        {/* ── Left panel ── */}
        <div className="panel p-6 lg:p-8 space-y-6">

          {/* Step 1 — Category */}
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
              Step 1 · Pick a category
            </div>

            {isLoading ? (
              <div className="h-10 bg-secondary/50 rounded-md animate-pulse" />
            ) : (
              <>
                {/* Category pills */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {categories.map(c => (
                    <button key={c} onClick={() => {
                      setIsCustom(false);
                      setCategory(c);
                      setPackageId("");
                      setSelectedAddons([]);
                    }}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        !isCustom && category === c
                          ? "bg-primary text-primary-foreground border-primary font-semibold"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                      }`}>
                      {c}
                    </button>
                  ))}
                  <button onClick={() => {
                    setIsCustom(true);
                    setCategory("");
                    setPackageId("");
                    setSelectedAddons([]);
                  }}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      isCustom
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                    }`}>
                    ✏️ Custom / Other
                  </button>
                </div>

                {isCustom && (
                  <input
                    type="text"
                    placeholder="Describe your shoot e.g. Lobola shoot, Corporate headshots…"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="mt-2 w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm"
                    autoFocus
                  />
                )}
              </>
            )}
          </div>

          {/* Step 2 — Packages */}
          {!isCustom && category && (
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                Step 2 · Choose a package
              </div>
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">No packages for this category yet.</p>
              ) : (
                <div className="space-y-3">
                  {filtered.map((p: any) => {
                    const isOnSale = p.is_on_sale && p.sale_price != null;
                    const displayPrice = isOnSale ? Number(p.sale_price) : Number(p.price);
                    const selected = packageId === p.id;
                    const expanded = expandedPkg === p.id;

                    const features: string[] = Array.isArray(p.features) ? p.features : [];
                    const deliverables: string[] = p.deliverables
                      ? p.deliverables.split("\n").filter((d: string) => d.trim())
                      : [];
                    const perfectFor: string[] = p.perfect_for
                      ? p.perfect_for.split("\n").filter((d: string) => d.trim())
                      : [];

                    return (
                      <div key={p.id}
                        className={`rounded-xl border transition-all overflow-hidden ${
                          selected
                            ? isOnSale
                              ? "border-orange-500 ring-1 ring-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                              : "border-primary ring-1 ring-primary/30"
                            : isOnSale
                            ? "border-orange-500/30 hover:border-orange-500/60"
                            : "border-border hover:border-primary/40"
                        } ${isOnSale ? "bg-orange-500/5" : "bg-secondary/30"}`}>

                        {/* Package header row — click to select */}
                        <button
                          onClick={() => { setPackageId(p.id); setSelectedAddons([]); }}
                          className="w-full text-left p-4 relative">

                          {/* Sale badge */}
                          {isOnSale && (
                            <div className="absolute top-3 right-10 bg-orange-500 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Tag size={8} /> ON SALE
                            </div>
                          )}
                          {p.is_popular && !isOnSale && (
                            <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                              Popular
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-2 pr-8">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm">{p.name}</div>
                              {p.duration && (
                                <div className="text-xs text-muted-foreground mt-0.5">{p.duration}</div>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              {isOnSale ? (
                                <>
                                  <div className="text-xs text-muted-foreground line-through">
                                    R{Number(p.price).toLocaleString()}
                                  </div>
                                  <div className="font-display text-xl font-bold text-orange-500">
                                    R{displayPrice.toLocaleString()}
                                  </div>
                                </>
                              ) : (
                                <div className="font-display text-xl font-bold">
                                  R{displayPrice.toLocaleString()}
                                </div>
                              )}
                              {p.additional_hour_rate && (
                                <div className="text-[10px] text-muted-foreground">
                                  +R{Number(p.additional_hour_rate).toLocaleString()}/hr
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick feature preview */}
                          {features.length > 0 && !expanded && (
                            <ul className="mt-2 space-y-0.5">
                              {features.slice(0, 2).map((f: string, i: number) => (
                                <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Check size={10} className={isOnSale ? "text-orange-500" : "text-primary"} shrink-0 />
                                  {f}
                                </li>
                              ))}
                              {features.length > 2 && (
                                <li className="text-xs text-muted-foreground/60">+{features.length - 2} more…</li>
                              )}
                            </ul>
                          )}
                        </button>

                        {/* Expand/collapse button */}
                        {(features.length > 0 || deliverables.length > 0 || perfectFor.length > 0) && (
                          <button
                            onClick={() => setExpandedPkg(expanded ? null : p.id)}
                            className="w-full px-4 py-1.5 text-[11px] text-muted-foreground hover:text-foreground border-t border-border/50 flex items-center justify-center gap-1 transition-colors">
                            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {expanded ? "Show less" : "View full details"}
                          </button>
                        )}

                        {/* Expanded details */}
                        {expanded && (
                          <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                            {features.length > 0 && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">Includes</div>
                                <ul className="space-y-1">
                                  {features.map((f: string, i: number) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                      <Check size={11} className={`shrink-0 mt-0.5 ${isOnSale ? "text-orange-500" : "text-primary"}`} />
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {deliverables.length > 0 && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">Deliverables</div>
                                <ul className="space-y-1">
                                  {deliverables.map((d: string, i: number) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                      <Check size={11} className={`shrink-0 mt-0.5 ${isOnSale ? "text-orange-500" : "text-primary"}`} />
                                      {d}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {perfectFor.length > 0 && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">Perfect For</div>
                                <ul className="space-y-1">
                                  {perfectFor.map((d: string, i: number) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                      <span className={`shrink-0 mt-0.5 ${isOnSale ? "text-orange-500" : "text-primary"}`}>✦</span>
                                      {d}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Custom message */}
          {isCustom && customCategory && (
            <div className="panel p-4 border-primary/40 bg-primary/5 text-sm text-muted-foreground">
              💬 You'll get a custom quote for{" "}
              <span className="text-foreground font-semibold">"{customCategory}"</span>.
              Click <span className="text-primary font-semibold">Book This Now</span> and we'll reply within 24hrs.
            </div>
          )}

          {/* Step 3 — Add-ons */}
          {(packageId || (isCustom && customCategory)) && addons.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                Step 3 · Add-ons <span className="normal-case font-normal">(optional)</span>
              </div>
              <div className="space-y-2">
                {addons.map((a: any) => {
                  const on = selectedAddons.includes(a.id);
                  return (
                    <label key={a.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        on ? "border-primary bg-primary/10" : "border-border bg-secondary/30 hover:border-primary/40"
                      }`}>
                      <span className="flex items-center gap-2 text-sm">
                        <span className={`w-5 h-5 rounded grid place-items-center border shrink-0 transition-colors ${
                          on ? "bg-primary border-primary" : "border-border"
                        }`}>
                          {on && <Check size={12} className="text-primary-foreground" />}
                        </span>
                        {a.label}
                      </span>
                      <span className="font-semibold text-sm shrink-0 text-primary">
                        +R{Number(a.price).toLocaleString()}
                      </span>
                      <input type="checkbox" checked={on}
                        onChange={() => setSelectedAddons(
                          on ? selectedAddons.filter(x => x !== a.id) : [...selectedAddons, a.id]
                        )}
                        className="sr-only" />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Live Quote panel ── */}
        <aside className="panel p-6 h-fit lg:sticky lg:top-24 bg-gradient-to-br from-primary/10 via-background to-background border-primary/40">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
            <Sparkles size={14} /> Live quote
          </div>

          {(pkg || (isCustom && customCategory)) ? (
            <>
              <div className="mt-4 space-y-2">
                {pkg && (
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="text-muted-foreground truncate">{pkg.name}</span>
                    <span className="shrink-0 font-semibold">
                      {pkg.is_on_sale && pkg.sale_price ? (
                        <span className="text-orange-500">R{Number(pkg.sale_price).toLocaleString()}</span>
                      ) : (
                        `R${Number(pkg.price).toLocaleString()}`
                      )}
                    </span>
                  </div>
                )}
                {isCustom && (
                  <div className="text-sm text-muted-foreground">Custom: {customCategory}</div>
                )}
                {selectedAddons.map(id => {
                  const a = addons.find((x: any) => x.id === id) as any;
                  if (!a) return null;
                  return (
                    <div key={id} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">+ {a.label}</span>
                      <span className="text-primary">+R{Number(a.price).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>

              {!isCustom && (
                <>
                  <div className="my-4 h-px bg-border" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Total</span>
                    <span className="font-display text-3xl font-bold">R{total.toLocaleString()}</span>
                  </div>
                  {pkg?.is_on_sale && pkg?.sale_price && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-orange-400 font-medium bg-orange-500/10 rounded-md px-2 py-1">
                      <Tag size={10} />
                      Sale! Save R{(Number(pkg.price) - Number(pkg.sale_price)).toLocaleString()}
                    </div>
                  )}
                  <div className="flex justify-between items-baseline mt-3">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">50% deposit</span>
                    <span className="font-display text-xl font-bold text-primary">R{deposit.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    ⏱ {turnaround}
                  </div>
                </>
              )}

              <Link
                to="/contact"
                search={{ category: activeCategory, package: pkg?.name } as any}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 btn-lime px-5 py-3 rounded-md text-sm font-semibold">
                Book This Now <ArrowRight size={14} />
              </Link>

              {pkg?.is_on_sale && (
                <p className="text-[10px] text-orange-400/70 text-center mt-2">
                  🔥 Sale price — limited availability
                </p>
              )}
            </>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">Pick a category and package to see your live quote.</p>
              {isLoading && (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-4 bg-secondary/50 rounded animate-pulse" />)}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}