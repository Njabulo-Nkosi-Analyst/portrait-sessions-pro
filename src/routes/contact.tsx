import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Mail, Instagram, MessageCircle, Check, ArrowDown, Shield, Star, Camera, Zap, Tag, ChevronDown, Phone } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  whatsapp: z.string().trim().max(40).optional(),
  category: z.string().max(40).optional(),
  package_interest: z.string().max(80).optional(),
  preferred_date: z.string().optional(),
  preferred_time: z.string().optional(),
  message: z.string().trim().max(2000).optional(),
});
type FormData = z.infer<typeof schema>;

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const Route = createFileRoute("/contact")({
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s.category === "string" ? s.category : undefined,
    package: typeof s.package === "string" ? s.package : undefined,
    promo: s.promo === true || s.promo === "true" ? true : undefined,
  }),
  head: () => ({ meta: [{ title: "Book a Session — Tann Media" }] }),
  component: Contact,
});

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getDayStatus(iso: string, todayISO: string, blocksMap: Record<string, any>, workingDays: Record<string, boolean>) {
  if (iso < todayISO) return "past";
  const block = blocksMap[iso];
  if (block) return block.is_available ? "available" : "blocked";
  const d = new Date(iso + "T00:00:00");
  const dayKey = DAY_KEYS[(d.getDay() + 6) % 7];
  return workingDays[dayKey] ? "available" : "blocked";
}

function getNextAvailableDate(fromISO: string, blocksMap: Record<string, any>, workingDays: Record<string, boolean>, todayISO: string): string | null {
  const start = new Date(fromISO + "T00:00:00");
  start.setDate(start.getDate() + 1);
  for (let i = 0; i < 60; i++) {
    const iso = start.toISOString().slice(0, 10);
    const status = getDayStatus(iso, todayISO, blocksMap, workingDays);
    if (status === "available") return iso;
    start.setDate(start.getDate() + 1);
  }
  return null;
}

function AvailabilityCalendar({ blocks, workingDays, onSelectDate, selectedDate }: {
  blocks: any[]; workingDays: Record<string, boolean>; onSelectDate: (date: string) => void; selectedDate: string;
}) {
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const blocksMap = useMemo(() => Object.fromEntries(blocks.map((b: any) => [b.block_date, b])), [blocks]);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = (() => { const d = new Date(calYear, calMonth, 1).getDay(); return (d + 6) % 7; })();
  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };
  const isPrevDisabled = calYear === today.getFullYear() && calMonth === today.getMonth();

  return (
    <div className="border border-border rounded-lg p-4 bg-background/50 mb-3">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} disabled={isPrevDisabled}
          className="w-7 h-7 rounded-full border border-border grid place-items-center hover:border-primary transition-colors text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
        <span className="text-sm font-semibold">{MONTH_NAMES[calMonth]} {calYear}</span>
        <button type="button" onClick={nextMonth}
          className="w-7 h-7 rounded-full border border-border grid place-items-center hover:border-primary transition-colors text-muted-foreground">›</button>
      </div>
      <div className="flex flex-wrap gap-3 mb-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary/60 inline-block" />Available</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-destructive/40 inline-block" />Unavailable</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block ring-2 ring-primary" />Selected</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_LABELS.map(d => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = toISO(calYear, calMonth, day);
          const status = getDayStatus(iso, todayISO, blocksMap, workingDays);
          const isSelected = iso === selectedDate;
          const isToday = iso === todayISO;
          const isPast = status === "past";
          const isBlocked = status === "blocked";
          return (
            <button key={iso} type="button" disabled={isPast || isBlocked} onClick={() => onSelectDate(iso)}
              className={`aspect-square rounded-md text-[11px] font-medium transition-all relative
                ${isPast ? "opacity-20 cursor-not-allowed text-muted-foreground" : ""}
                ${isBlocked && !isPast ? "bg-destructive/15 text-destructive/60 cursor-not-allowed" : ""}
                ${status === "available" && !isSelected ? "bg-primary/20 hover:bg-primary/50 text-foreground cursor-pointer hover:scale-105" : ""}
                ${isSelected ? "bg-primary text-white ring-2 ring-primary ring-offset-1 ring-offset-background scale-110 z-10" : ""}
                ${isToday && !isSelected ? "ring-1 ring-primary/70" : ""}`}>
              {day}
              {isToday && !isSelected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
      {selectedDate && (() => {
        const status = getDayStatus(selectedDate, todayISO, blocksMap, workingDays);
        const nextAvail = status !== "available" ? getNextAvailableDate(selectedDate, blocksMap, workingDays, todayISO) : null;
        const block = blocksMap[selectedDate];
        const reason = block?.note || "Not available this day";
        return (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {status === "available" ? (
              <div className="text-xs text-center">
                <span className="text-primary font-semibold">✓ Available — </span>
                <span className="text-muted-foreground">{new Date(selectedDate + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-center text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  ✗ Not available on {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })} — {reason}
                </div>
                {nextAvail && (
                  <div className="text-xs text-center bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
                    <span className="text-muted-foreground">Next available: </span>
                    <button type="button" onClick={() => { onSelectDate(nextAvail); const d = new Date(nextAvail + "T00:00:00"); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}
                      className="text-primary font-semibold hover:underline">
                      {new Date(nextAvail + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function Contact() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const [promoCode, setPromoCode] = useState("");
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string; discount: number; type: string } | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);

  const { data: packages = [] } = useQuery({
    queryKey: ["packages-active"],
    queryFn: async () =>
      (await supabase.from("packages").select("*").eq("is_active", true).order("category").order("sort_order")).data ?? [],
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => (await supabase.from("site_settings").select("*")).data ?? [],
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["public-availability-blocks"],
    queryFn: async () => (await supabase.from("availability_blocks").select("*")).data ?? [],
  });

  const workingDays = useMemo(() => {
    try { return JSON.parse(settings.find((s: any) => s.key === "working_days")?.value ?? "{}"); }
    catch { return {}; }
  }, [settings]);

  const defaultSlots = useMemo(() => {
    try { return JSON.parse(settings.find((s: any) => s.key === "default_slots")?.value ?? "{}"); }
    catch { return {}; }
  }, [settings]);

  const packageCategories = useMemo(
    () => Array.from(new Set(packages.map((p: any) => p.category))).filter(Boolean).sort() as string[],
    [packages]
  );

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: search.category, package_interest: search.package },
  });

  const watchedCategory = watch("category");
  const selectedDate = watch("preferred_date");
  const selectedTime = watch("preferred_time");

  useEffect(() => {
    if (!watchedCategory) return;
    const currentPkg = watch("package_interest");
    const belongs = packages.some((p: any) => p.name === currentPkg && p.category === watchedCategory);
    if (!belongs) setValue("package_interest", "");
  }, [watchedCategory]);

  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  useEffect(() => {
    if (!selectedDate) { setBookedTimes([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("bookings").select("session_time, status")
        .eq("session_date", selectedDate).in("status", ["pending", "confirmed", "completed"]);
      if (cancelled) return;
      setBookedTimes((data ?? []).map((b: any) => String(b.session_time ?? "").slice(0, 5)).filter(Boolean));
    })();
    const ch = supabase.channel("contact-slots")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `session_date=eq.${selectedDate}` },
        async () => {
          const { data } = await supabase.from("bookings").select("session_time, status")
            .eq("session_date", selectedDate).in("status", ["pending", "confirmed", "completed"]);
          if (!cancelled) setBookedTimes((data ?? []).map((b: any) => String(b.session_time ?? "").slice(0, 5)).filter(Boolean));
        }).subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [selectedDate]);

  const blocksMap = useMemo(() => Object.fromEntries(blocks.map((b: any) => [b.block_date, b])), [blocks]);

  const slotInfoForDate = (dateStr: string) => {
    if (!dateStr) return { slots: [] as string[], blocked: false, reason: "" };
    const todayISO = new Date().toISOString().slice(0, 10);
    const d = new Date(dateStr + "T00:00:00");
    if (dateStr < todayISO) return { slots: [], blocked: true, reason: "Past date" };
    const dayKey = DAY_KEYS[(d.getDay() + 6) % 7];
    const override = blocksMap[dateStr];
    let slots: string[] = defaultSlots[dayKey] ?? [];
    let available = workingDays[dayKey] ?? false;
    if (override) {
      available = override.is_available;
      try { const s = JSON.parse(override.slots ?? "[]"); if (s.length > 0) slots = s; } catch { }
    }
    if (!available) return { slots: [], blocked: true, reason: override?.note || "Not available this day" };
    return { slots, blocked: false, reason: "" };
  };

  const slotInfo = slotInfoForDate(selectedDate ?? "");

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("full_name, email, whatsapp").eq("id", user.id).single().then(({ data }) => {
        if (data) reset({ ...data, category: search.category, package_interest: search.package } as any);
      });
    }
  }, [user, reset, search.category, search.package]);

  useEffect(() => { if (search.promo) setPromoOpen(true); }, [search.promo]);

  const pickPackage = (cat: string, name: string) => {
    setValue("category", cat);
    setValue("package_interest", name);
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    const code = promoCode.trim().toUpperCase();
    const { data } = await supabase.from("promo_codes").select("*").eq("code", code).eq("is_active", true).maybeSingle();
    if (!data) { setPromoMsg({ ok: false, text: "Invalid or expired code", discount: 0, type: "" }); return; }
    if (data.expiry_date && new Date(data.expiry_date) < new Date()) { setPromoMsg({ ok: false, text: "Code expired", discount: 0, type: "" }); return; }
    if (data.max_uses && (data.uses_count ?? 0) >= data.max_uses) { setPromoMsg({ ok: false, text: "Code fully redeemed", discount: 0, type: "" }); return; }
    const text = data.discount_type === "percent"
      ? `${data.discount_value}% off applied`
      : `R${Number(data.discount_value).toLocaleString()} off applied`;
    setPromoMsg({ ok: true, text: `✓ ${text} (${code})`, discount: Number(data.discount_value), type: data.discount_type });
  };

  const linkedPackage = useMemo(() => {
    if (!search.package) return null;
    return packages.find((p: any) => p.name === search.package) ?? null;
  }, [packages, search.package]);

  const promoSalePrice = useMemo(() => {
    if (!linkedPackage || !promoMsg?.ok || !promoMsg.discount) return null;
    const orig = Number(linkedPackage.price);
    const discounted = promoMsg.type === "percent"
      ? orig - (orig * promoMsg.discount) / 100
      : orig - promoMsg.discount;
    return Math.max(0, discounted);
  }, [linkedPackage, promoMsg]);

  const onSubmit = async (d: FormData) => {
    const { error } = await supabase.from("inquiries").insert({
      name: d.name, email: d.email, whatsapp: d.whatsapp, category: d.category,
      package_interest: d.package_interest, preferred_date: d.preferred_date || null,
      message: d.preferred_time
        ? `${d.message ?? ""}\n\nPreferred time: ${d.preferred_time}${promoMsg?.ok ? `\nPromo: ${promoCode.trim().toUpperCase()}` : ""}`
        : (d.message ?? "") + (promoMsg?.ok ? `\n\nPromo: ${promoCode.trim().toUpperCase()}` : ""),
      user_id: user?.id ?? null, status: "new",
    });
    if (error) { toast.error("Couldn't send. Please try again."); return; }
    toast.success("Inquiry sent! We'll be in touch within 24 hours.");
    reset(); setPromoCode(""); setPromoMsg(null);
  };

  const grouped = packages.reduce<Record<string, typeof packages>>((acc, p) => {
    (acc[p.category] ??= []).push(p); return acc;
  }, {});

  const packagesForCategory = useMemo(
    () => watchedCategory ? packages.filter((p: any) => p.category === watchedCategory) : packages,
    [packages, watchedCategory]
  );

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20">
        <span className="eyebrow">Book a Session</span>
        <h1 className="font-display text-5xl md:text-7xl font-bold mt-3">
          Choose a package, <span className="text-gradient-warm">we'll do the rest.</span>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl">
          Pick from our offers below — or scroll past and tell us about a custom shoot.
        </p>

        {/* Package cards with deliverables + perfect for */}
        <div className="mt-10 space-y-10">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="font-display text-2xl font-bold mb-4">{cat}</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {items.map((p: any) => {
                  const isOnSale = p.is_on_sale && p.sale_price != null;
                  const deliverableLines: string[] = p.deliverables
                    ? p.deliverables.split("\n").filter((d: string) => d.trim())
                    : [];
                  const perfectForLines: string[] = p.perfect_for
                    ? p.perfect_for.split("\n").filter((d: string) => d.trim())
                    : [];
                  const features: string[] = Array.isArray(p.features) ? p.features : [];

                  return (
                    <div key={p.id} className={`panel p-6 flex flex-col relative ${
                      isOnSale ? "border-orange-500/60 ring-1 ring-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.12)]" :
                      p.is_popular ? "border-primary ring-1 ring-primary" : ""
                    }`}>
                      {isOnSale && (
                        <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Tag size={9}/> SALE
                        </div>
                      )}
                      {p.is_popular && !isOnSale && (
                        <div className="mb-2 text-xs font-semibold text-primary uppercase tracking-widest">Most popular</div>
                      )}
                      <div className="font-display text-lg font-bold">{p.name}</div>

                      {/* Price */}
                      <div className="mt-2">
                        {isOnSale ? (
                          <>
                            <div className="text-sm text-muted-foreground line-through">R{Number(p.price).toLocaleString()}</div>
                            <div className="font-display text-3xl font-bold text-orange-500">
                              R{Number(p.sale_price).toLocaleString()}
                              <span className="text-sm text-muted-foreground font-normal"> / {p.duration}</span>
                            </div>
                          </>
                        ) : (
                          <div className="font-display text-3xl font-bold">
                            R{Number(p.price).toLocaleString()}
                            <span className="text-sm text-muted-foreground font-normal"> / {p.duration}</span>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      {features.length > 0 && (
                        <ul className="mt-4 space-y-1.5 text-sm">
                          {features.map((f: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check size={14} className="text-primary shrink-0 mt-1" />
                              <span className="text-muted-foreground">{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Deliverables */}
                      {deliverableLines.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">Deliverables</div>
                          <ul className="space-y-1">
                            {deliverableLines.map((d: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <Check size={11} className="text-primary shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Perfect For */}
                      {perfectForLines.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">Perfect For</div>
                          <ul className="space-y-1">
                            {perfectForLines.map((d: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <span className="text-primary mt-0.5 shrink-0">✦</span>
                                <span className="text-muted-foreground">{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button onClick={() => pickPackage(cat, p.name)}
                        className={`mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm ${
                          isOnSale ? "bg-orange-500 text-white hover:bg-orange-600" :
                          p.is_popular ? "btn-lime" : "btn-ghost-dark"
                        }`}>
                        Book this <ArrowDown size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {packages.length === 0 && (
            <div className="panel p-6 text-sm text-muted-foreground">
              Packages will appear here. <Link to="/pricing" className="text-primary">See pricing →</Link>
            </div>
          )}
        </div>

        <div id="booking-form" className="mt-16 scroll-mt-24">
          <span className="eyebrow">Tell us about your shoot</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mt-3 mb-8">
            Send your <span className="text-gradient-warm">inquiry</span>
          </h2>

          {/* Promo package highlight */}
          {search.promo && linkedPackage && (
            <div className="mb-6 panel p-5 border-primary bg-primary/5">
              <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3 flex items-center gap-2">
                <Tag size={12} /> Special offer — apply your promo code below to see the discounted price
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <div className="font-display text-lg font-bold">{linkedPackage.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{linkedPackage.category} · {linkedPackage.duration}</div>
                </div>
                <div className="ml-auto text-right">
                  {promoSalePrice !== null ? (
                    <>
                      <div className="text-sm text-muted-foreground line-through">R{Number(linkedPackage.price).toLocaleString()}</div>
                      <div className="font-display text-2xl font-bold text-primary">R{Math.round(promoSalePrice).toLocaleString()}</div>
                      <div className="text-xs text-primary font-semibold">Sale price ✓</div>
                    </>
                  ) : (
                    <>
                      <div className="font-display text-2xl font-bold">R{Number(linkedPackage.price).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Apply promo code to see sale price</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 panel p-6 lg:p-8 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Full name" error={errors.name?.message}>
                  <input {...register("name")} className="input" />
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  <input type="email" {...register("email")} className="input" />
                </Field>
                <Field label="WhatsApp">
                  <input {...register("whatsapp")} className="input" placeholder="+27 ..." />
                </Field>
                <Field label="Category">
                  <select {...register("category")} className="input">
                    <option value="">Choose a category</option>
                    {packageCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Package interest">
                  <select {...register("package_interest")} className="input">
                    <option value="">Choose a package</option>
                    {packagesForCategory.map((p: any) => (
                      <option key={p.id} value={p.name}>
                        {p.name} — R{Number(p.is_on_sale && p.sale_price ? p.sale_price : p.price).toLocaleString()}
                        {p.is_on_sale ? " (SALE)": ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Preferred date">
                <AvailabilityCalendar blocks={blocks} workingDays={workingDays}
                  onSelectDate={(date) => { setValue("preferred_date", date); setValue("preferred_time", ""); }}
                  selectedDate={selectedDate ?? ""} />
                <input type="hidden" {...register("preferred_date")} />
              </Field>

              {selectedDate && !slotInfo.blocked && slotInfo.slots.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2 font-medium">
                    Available time slots for {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slotInfo.slots.map(t => {
                      const isBooked = bookedTimes.includes(t);
                      const isSelected = selectedTime === t;
                      return (
                        <button key={t} type="button" disabled={isBooked} onClick={() => setValue("preferred_time", t)}
                          className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors
                            ${isSelected ? "bg-primary text-primary-foreground border-primary" :
                              isBooked ? "bg-secondary/40 text-muted-foreground border-border line-through cursor-not-allowed opacity-60" :
                              "bg-background text-foreground border-border hover:border-primary"}`}>
                          {t}{isBooked && <span className="ml-1.5 text-[9px] opacity-70">Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <Field label="Message">
                <textarea {...register("message")} rows={5} className="input" placeholder="Tell me about your shoot..." />
              </Field>

              {/* Promo code */}
              <div className="border border-border rounded-md">
                <button type="button" onClick={() => setPromoOpen(o => !o)}
                  className="w-full px-4 py-2.5 text-left flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2"><Tag size={14} /> Have a promo code?</span>
                  <ChevronDown size={14} className={`transition-transform ${promoOpen ? "rotate-180" : ""}`} />
                </button>
                {promoOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-2">
                    <div className="flex gap-2">
                      <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter code e.g. MATRIC2026" className="input flex-1 uppercase" />
                      <button type="button" onClick={applyPromo} className="btn-lime px-4 rounded-md text-sm">Apply</button>
                    </div>
                    {promoMsg && (
                      <div className={`text-xs font-medium px-3 py-2 rounded-md ${promoMsg.ok ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
                        {promoMsg.text}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button disabled={isSubmitting} className="btn-lime px-6 py-3 rounded-md text-sm disabled:opacity-50">
                {isSubmitting ? "Sending..." : "Send inquiry"}
              </button>

              <div className="mt-4 pt-4 border-t border-border space-y-3 text-xs text-muted-foreground">
                <div className="panel p-4 bg-primary/5 border-primary/30">
                  <div className="font-semibold text-foreground mb-1 text-sm">Payment</div>
                  FNB · W. Maluleka · Acc No. 63052599968
                </div>
                <p className="leading-relaxed">
                  <span className="font-semibold text-foreground">Terms:</span> 50% deposit secures your booking. Balance due on completion. Standard turnaround: 4–5 working days. Travel free within 20km. Excludes transport and service fee.
                </p>
              </div>
            </form>

            <aside className="space-y-4">
              <div className="panel p-5 bg-gradient-to-br from-primary/10 via-background to-background border-primary/30">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Replies within ~2 hours
                </div>
                <p className="text-sm text-muted-foreground mt-2">Most inquiries get a personal reply the same day. Weekend bookings get priority.</p>
              </div>

              <div className="panel p-5 space-y-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Why book with us</div>
                {[
                  { icon: <Shield size={16} />, label: "Secure deposit & contract" },
                  { icon: <Camera size={16} />, label: "500+ shoots delivered" },
                  { icon: <Star size={16} />, label: "5-star rated by clients" },
                  { icon: <Zap size={16} />, label: "4–5 day turnaround" },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-8 h-8 rounded-full bg-primary/15 text-primary grid place-items-center shrink-0">{b.icon}</span>
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>

              <a href="https://wa.me/27714967968" target="_blank" rel="noreferrer"
                className="panel p-5 flex items-center gap-3 hover:border-primary transition-colors">
                <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><MessageCircle size={18} /></span>
                <div><div className="text-xs text-muted-foreground">WhatsApp</div><div className="font-semibold text-sm">071 496 7968</div></div>
              </a>
              <a href="https://wa.me/27815051466" target="_blank" rel="noreferrer"
                className="panel p-5 flex items-center gap-3 hover:border-primary transition-colors">
                <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><Phone size={18} /></span>
                <div><div className="text-xs text-muted-foreground">Call / WhatsApp</div><div className="font-semibold text-sm">081 505 1466</div></div>
              </a>
              <a href="mailto:tannphotography23@gmail.com"
                className="panel p-5 flex items-center gap-3 hover:border-primary transition-colors">
                <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><Mail size={18} /></span>
                <div><div className="text-xs text-muted-foreground">Email</div><div className="font-semibold text-sm">tannphotography23@gmail.com</div></div>
              </a>
              <a href="https://instagram.com/tannphotography" target="_blank" rel="noreferrer"
                className="panel p-5 flex items-center gap-3 hover:border-primary transition-colors">
                <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><Instagram size={18} /></span>
                <div><div className="text-xs text-muted-foreground">Instagram</div><div className="font-semibold text-sm">@tannphotography</div></div>
              </a>
            </aside>
          </div>
        </div>
      </section>

      <style>{`
        .input { width:100%; background: var(--input); color: var(--foreground); border:1px solid var(--border); border-radius: var(--radius-md); padding: .65rem .85rem; font-size: .875rem; }
        .input:focus { outline: 2px solid var(--primary); outline-offset: 2px; }
      `}</style>
    </Layout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1.5 font-medium">{label}</div>
      {children}
      {error && <div className="text-xs text-destructive mt-1">{error}</div>}
    </label>
  );
}