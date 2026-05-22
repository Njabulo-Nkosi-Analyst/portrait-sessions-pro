import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  Calendar, DollarSign, Inbox, TrendingUp, Users, CheckCircle2, Clock, Star,
  Image as ImageLucide, Tag, Trash2, Plus, Target, Percent, Activity,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — TANN Photography" }] }),
  component: Admin,
});

const PIE_COLORS = ["#c4f04a", "#ff8a65", "#ffb74d", "#7c9cff", "#e879f9", "#34d399", "#fb7185"];
type Tab = "overview" | "bookings" | "packages" | "hero" | "gallery" | "promo";

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => { if (!loading && !user) nav({ to: "/sign-in" }); }, [user, loading, nav]);

  const { data: inquiries = [] } = useQuery({
    queryKey: ["all-inquiries"],
    queryFn: async () => (await supabase.from("inquiries").select("*").order("created_at", { ascending: false })).data ?? [],
    enabled: isAdmin,
  });
  const { data: packages = [] } = useQuery({
    queryKey: ["all-packages"],
    queryFn: async () => (await supabase.from("packages").select("*").order("category").order("sort_order")).data ?? [],
    enabled: isAdmin,
  });
  const { data: testimonials = [] } = useQuery({
    queryKey: ["all-testimonials"],
    queryFn: async () => (await supabase.from("testimonials").select("*")).data ?? [],
    enabled: isAdmin,
  });
  const { data: hero = [] } = useQuery({
    queryKey: ["all-hero"],
    queryFn: async () => (await supabase.from("hero_images").select("*").order("sort_order")).data ?? [],
    enabled: isAdmin,
  });
  const { data: gallery = [] } = useQuery({
    queryKey: ["all-gallery"],
    queryFn: async () => (await supabase.from("gallery_images").select("*").order("category").order("sort_order")).data ?? [],
    enabled: isAdmin,
  });
  const { data: promo } = useQuery({
    queryKey: ["any-promo"],
    queryFn: async () => (await supabase.from("promotions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
    enabled: isAdmin,
  });

  // ───── Analytics ─────
  const priceMap = useMemo(() => new Map(packages.map(p => [p.name, Number(p.price)])), [packages]);

  const stats = useMemo(() => {
    const booked = inquiries.filter(i => i.status === "booked");
    const revenue = booked.reduce((s, i) => s + (priceMap.get(i.package_interest ?? "") ?? 0), 0);
    const pipelineValue = inquiries.filter(i => i.status !== "booked").reduce((s, i) => s + (priceMap.get(i.package_interest ?? "") ?? 0), 0);
    const aov = booked.length ? revenue / booked.length : 0;
    const conversion = inquiries.length ? (booked.length / inquiries.length) * 100 : 0;
    const newCount = inquiries.filter(i => i.status === "new").length;
    const avgRating = testimonials.length ? testimonials.reduce((s, t) => s + (t.rating ?? 0), 0) / testimonials.length : 0;

    // Week-over-week growth
    const now = Date.now();
    const week = 7 * 86400000;
    const last7 = inquiries.filter(i => now - new Date(i.created_at).getTime() < week).length;
    const prev7 = inquiries.filter(i => {
      const d = now - new Date(i.created_at).getTime();
      return d >= week && d < 2 * week;
    }).length;
    const growth = prev7 ? ((last7 - prev7) / prev7) * 100 : last7 ? 100 : 0;

    // 30-day run-rate projection
    const last30Booked = booked.filter(i => now - new Date(i.created_at).getTime() < 30 * 86400000);
    const last30Revenue = last30Booked.reduce((s, i) => s + (priceMap.get(i.package_interest ?? "") ?? 0), 0);
    const projected = last30Revenue; // monthly run rate

    return { revenue, booked: booked.length, conversion, newCount, avgRating, aov, pipelineValue, growth, last7, projected };
  }, [inquiries, priceMap, testimonials]);

  const trend = useMemo(() => {
    const days: Record<string, { date: string; inquiries: number; bookings: number; revenue: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      days[k] = { date: k.slice(5), inquiries: 0, bookings: 0, revenue: 0 };
    }
    inquiries.forEach(i => {
      const k = (i.created_at as string).slice(0, 10);
      if (days[k]) {
        days[k].inquiries++;
        if (i.status === "booked") {
          days[k].bookings++;
          days[k].revenue += priceMap.get(i.package_interest ?? "") ?? 0;
        }
      }
    });
    return Object.values(days);
  }, [inquiries, priceMap]);

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    inquiries.forEach(i => { const c = i.category ?? "Other"; m[c] = (m[c] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [inquiries]);

  const revenueByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    inquiries.filter(i => i.status === "booked").forEach(i => {
      const c = i.category ?? "Other";
      m[c] = (m[c] ?? 0) + (priceMap.get(i.package_interest ?? "") ?? 0);
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [inquiries, priceMap]);

  const byStatus = useMemo(() => {
    const m: Record<string, number> = { new: 0, read: 0, contacted: 0, booked: 0 };
    inquiries.forEach(i => { m[i.status] = (m[i.status] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [inquiries]);

  const topPackages = useMemo(() => {
    const m: Record<string, number> = {};
    inquiries.forEach(i => { const p = i.package_interest ?? "Custom"; m[p] = (m[p] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [inquiries]);

  // ───── Mutations ─────
  const refresh = (key: string) => qc.invalidateQueries({ queryKey: [key] });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); refresh("all-inquiries"); }
  };
  const togglePackage = async (id: string, field: "is_active" | "is_popular", val: boolean) => {
    const patch = field === "is_active" ? { is_active: val } : { is_popular: val };
    const { error } = await supabase.from("packages").update(patch).eq("id", id);
    if (error) toast.error(error.message); else refresh("all-packages");
  };
  const updatePackageField = async (id: string, patch: { price?: number; cover_image_url?: string | null }) => {
    const { error } = await supabase.from("packages").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Saved"); refresh("all-packages"); }
  };

  if (loading) return <Layout><div className="p-10 text-center text-muted-foreground">Loading…</div></Layout>;
  if (!isAdmin) return (
    <Layout>
      <div className="max-w-md mx-auto p-10 text-center">
        <h1 className="font-display text-2xl font-bold">Admin access required</h1>
        <p className="text-sm text-muted-foreground mt-2">Sign in with an admin account to manage the studio.</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20 pb-20">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="eyebrow">Owner Dashboard</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">Studio <span className="text-gradient-warm">control</span></h1>
          </div>
          <div className="flex flex-wrap gap-1 p-1 bg-secondary rounded-full">
            {(["overview", "bookings", "packages", "hero", "gallery", "promo"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-2 text-xs uppercase tracking-wider rounded-full transition-all ${tab === t ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === "overview" && (
          <>
            {/* KPI cards */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <KPI icon={<DollarSign size={18}/>} label="Revenue (booked)" value={`R${stats.revenue.toLocaleString()}`} accent />
              <KPI icon={<Target size={18}/>} label="Avg order value" value={`R${Math.round(stats.aov).toLocaleString()}`} />
              <KPI icon={<Activity size={18}/>} label="Pipeline value" value={`R${stats.pipelineValue.toLocaleString()}`} />
              <KPI icon={<TrendingUp size={18}/>} label="30d projected" value={`R${stats.projected.toLocaleString()}`} />
              <KPI icon={<Percent size={18}/>} label="Conversion" value={`${stats.conversion.toFixed(1)}%`} />
              <KPI icon={<CheckCircle2 size={18}/>} label="Bookings" value={stats.booked.toString()} />
              <KPI icon={<Inbox size={18}/>} label="Total inquiries" value={inquiries.length.toString()} />
              <KPI icon={<Clock size={18}/>} label="New (unread)" value={stats.newCount.toString()} />
              <KPI icon={<TrendingUp size={18}/>} label="WoW growth" value={`${stats.growth >= 0 ? "+" : ""}${stats.growth.toFixed(0)}%`} />
              <KPI icon={<Star size={18}/>} label="Avg rating" value={stats.avgRating.toFixed(2)} />
            </div>

            {/* Trend + Revenue */}
            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              <div className="panel p-6">
                <h2 className="font-display text-xl font-bold mb-4">Inquiries & bookings — 30 days</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c4f04a" stopOpacity={0.5}/><stop offset="100%" stopColor="#c4f04a" stopOpacity={0}/></linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb923c" stopOpacity={0.5}/><stop offset="100%" stopColor="#fb923c" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="date" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="inquiries" stroke="#c4f04a" strokeWidth={2} fill="url(#g1)" />
                    <Area type="monotone" dataKey="bookings" stroke="#fb923c" strokeWidth={2} fill="url(#g2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="panel p-6">
                <h2 className="font-display text-xl font-bold mb-4">Daily revenue — 30 days</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="date" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} />
                    <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 8 }} formatter={(v: any) => `R${Number(v).toLocaleString()}`} />
                    <Line type="monotone" dataKey="revenue" stroke="#c4f04a" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category + top packages */}
            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              <div className="panel p-6">
                <h2 className="font-display text-xl font-bold mb-4">Revenue by category</h2>
                {revenueByCategory.length === 0 ? <Empty/> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={revenueByCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                        {revenueByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 8 }} formatter={(v: any) => `R${Number(v).toLocaleString()}`} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="panel p-6">
                <h2 className="font-display text-xl font-bold mb-4">Top requested packages</h2>
                {topPackages.length === 0 ? <Empty/> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={topPackages} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis type="number" stroke="#888" fontSize={11} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#888" fontSize={11} width={100} />
                      <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 8 }} />
                      <Bar dataKey="value" fill="#c4f04a" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pipeline + Recent */}
            <div className="mt-6 grid lg:grid-cols-3 gap-6">
              <div className="panel p-6 lg:col-span-1">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Users size={18}/> Pipeline</h2>
                <div className="space-y-3">
                  {byStatus.map(s => (
                    <div key={s.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{s.name}</span>
                        <span className="text-muted-foreground">{s.value}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${inquiries.length ? (s.value / inquiries.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
                  <div>Inquiries this week: <span className="text-foreground font-semibold">{stats.last7}</span></div>
                  <div>Pipeline contains: <span className="text-foreground font-semibold">R{stats.pipelineValue.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="panel p-6 lg:col-span-2">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Calendar size={18}/> Recent inquiries</h2>
                <div className="space-y-2">
                  {inquiries.slice(0, 6).map(i => (
                    <div key={i.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{i.name} <span className="text-muted-foreground font-normal">· {i.category ?? "—"}</span></div>
                        <div className="text-xs text-muted-foreground truncate">{i.email} · {i.package_interest ?? "Custom"}</div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(i.created_at).toLocaleDateString()}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${i.status === "booked" ? "bg-primary/20 text-primary" : i.status === "new" ? "bg-orange-500/20 text-orange-300" : "bg-secondary text-muted-foreground"}`}>{i.status}</span>
                    </div>
                  ))}
                  {inquiries.length === 0 && <Empty/>}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "bookings" && (
          <div className="mt-8 panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Name</th><th className="text-left p-3">Category</th><th className="text-left p-3">Package</th><th className="text-left p-3">Preferred</th><th className="text-left p-3">Contact</th><th className="text-left p-3">Status</th></tr>
              </thead>
              <tbody>
                {inquiries.map(i => (
                  <tr key={i.id} className="border-b border-border/50">
                    <td className="p-3 text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-semibold">{i.name}</td>
                    <td className="p-3">{i.category}</td>
                    <td className="p-3">{i.package_interest}</td>
                    <td className="p-3 text-muted-foreground">{i.preferred_date ?? "—"}</td>
                    <td className="p-3 text-xs">{i.email}<br/>{i.whatsapp}</td>
                    <td className="p-3">
                      <select value={i.status} onChange={e => updateStatus(i.id, e.target.value)}
                        className="bg-input border border-border rounded px-2 py-1 text-xs">
                        {["new","read","contacted","booked"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {inquiries.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No inquiries yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "packages" && (
          <div className="mt-8 panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr><th className="text-left p-3">Category</th><th className="text-left p-3">Name</th><th className="text-left p-3">Price (R)</th><th className="text-left p-3">Cover image URL</th><th className="text-left p-3">Active</th><th className="text-left p-3">Popular</th></tr>
              </thead>
              <tbody>
                {packages.map(p => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="p-3">{p.category}</td>
                    <td className="p-3 font-semibold">{p.name}</td>
                    <td className="p-3"><input type="number" defaultValue={p.price as number} onBlur={e => { const v = Number(e.target.value); if (v !== Number(p.price)) updatePackageField(p.id, { price: v }); }} className="bg-input border border-border rounded px-2 py-1 w-24" /></td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {p.cover_image_url && <img src={p.cover_image_url} alt="" className="w-10 h-10 rounded object-cover" />}
                        <input defaultValue={p.cover_image_url ?? ""} onBlur={e => { if (e.target.value !== (p.cover_image_url ?? "")) updatePackageField(p.id, { cover_image_url: e.target.value || null }); }} className="bg-input border border-border rounded px-2 py-1 w-60 text-xs" placeholder="https://..." />
                      </div>
                    </td>
                    <td className="p-3"><input type="checkbox" checked={p.is_active} onChange={e => togglePackage(p.id, "is_active", e.target.checked)} /></td>
                    <td className="p-3"><input type="checkbox" checked={p.is_popular} onChange={e => togglePackage(p.id, "is_popular", e.target.checked)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "hero" && <HeroManager hero={hero} qc={qc} />}
        {tab === "gallery" && <GalleryManager gallery={gallery} qc={qc} />}
        {tab === "promo" && <PromoManager promo={promo} qc={qc} />}
      </section>
    </Layout>
  );
}

function KPI({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`panel p-4 ${accent ? "border-primary/40" : ""}`}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span className={accent ? "text-primary" : ""}>{icon}</span>
      </div>
      <div className={`mt-2 font-display text-2xl font-bold ${accent ? "text-gradient-warm" : ""}`}>{value}</div>
    </div>
  );
}

function Empty() {
  return <div className="text-center text-muted-foreground text-sm py-12">No data yet — bookings will appear here.</div>;
}

// ─────────────── Hero Images Manager ───────────────
function HeroManager({ hero, qc }: { hero: any[]; qc: any }) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  const add = async () => {
    if (!url.trim() || !label.trim()) return toast.error("URL and label required");
    const { error } = await supabase.from("hero_images").insert({ url, category_label: label, sort_order: (hero.at(-1)?.sort_order ?? 0) + 1 });
    if (error) toast.error(error.message); else { toast.success("Added"); setUrl(""); setLabel(""); qc.invalidateQueries({ queryKey: ["all-hero"] }); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this hero image?")) return;
    const { error } = await supabase.from("hero_images").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["all-hero"] }); }
  };
  const toggle = async (id: string, active: boolean) => {
    await supabase.from("hero_images").update({ is_active: active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["all-hero"] });
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="panel p-6">
        <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><ImageLucide size={18}/> Add a homepage hero image</h2>
        <div className="grid md:grid-cols-[1fr_240px_auto] gap-3">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Image URL (https://...)" className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Category label (e.g. Weddings)" className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <button onClick={add} className="btn-lime px-4 py-2 rounded text-sm inline-flex items-center gap-1"><Plus size={14}/> Add</button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {hero.map(h => (
          <div key={h.id} className="panel overflow-hidden">
            <div className="aspect-video bg-secondary"><img src={h.url} alt={h.category_label} className="w-full h-full object-cover" /></div>
            <div className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{h.category_label}</div>
                <label className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <input type="checkbox" checked={h.is_active} onChange={e => toggle(h.id, e.target.checked)} /> Active
                </label>
              </div>
              <button onClick={() => remove(h.id)} className="text-destructive p-2 hover:bg-destructive/10 rounded"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
        {hero.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12">No hero images yet.</div>}
      </div>
    </div>
  );
}

// ─────────────── Gallery Manager ───────────────
function GalleryManager({ gallery, qc }: { gallery: any[]; qc: any }) {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Weddings");
  const [caption, setCaption] = useState("");

  const categories = Array.from(new Set([...gallery.map(g => g.category), "Weddings", "Portraits", "Events", "Products", "Maternity", "Kids", "Corporate"]));

  const add = async () => {
    if (!url.trim() || !category.trim()) return toast.error("URL and category required");
    const { error } = await supabase.from("gallery_images").insert({ url, category, caption: caption || null, sort_order: 0 });
    if (error) toast.error(error.message); else { toast.success("Added"); setUrl(""); setCaption(""); qc.invalidateQueries({ queryKey: ["all-gallery"] }); qc.invalidateQueries({ queryKey: ["gallery"] }); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["all-gallery"] }); qc.invalidateQueries({ queryKey: ["gallery"] }); }
  };

  const grouped = gallery.reduce<Record<string, any[]>>((acc, g) => { (acc[g.category] ??= []).push(g); return acc; }, {});

  return (
    <div className="mt-8 space-y-6">
      <div className="panel p-6">
        <h2 className="font-display text-xl font-bold mb-4">Add gallery image</h2>
        <div className="grid md:grid-cols-[1fr_180px_180px_auto] gap-3">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Image URL (https://...)" className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <input list="catlist" value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <datalist id="catlist">{categories.map(c => <option key={c} value={c} />)}</datalist>
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)" className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <button onClick={add} className="btn-lime px-4 py-2 rounded text-sm inline-flex items-center gap-1"><Plus size={14}/> Add</button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Tip: upload to the <code>gallery</code> storage bucket first, then paste its public URL here.</p>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="font-display text-lg font-bold mb-3">{cat} <span className="text-muted-foreground font-normal text-sm">({items.length})</span></h3>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {items.map(g => (
              <div key={g.id} className="relative aspect-square rounded-lg overflow-hidden group">
                <img src={g.url} alt={g.caption ?? cat} className="w-full h-full object-cover" />
                <button onClick={() => remove(g.id)} className="absolute top-1.5 right-1.5 bg-destructive/90 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {gallery.length === 0 && <div className="text-center text-muted-foreground py-12">No gallery images yet.</div>}
    </div>
  );
}

// ─────────────── Promotion Manager ───────────────
function PromoManager({ promo, qc }: { promo: any; qc: any }) {
  const [form, setForm] = useState({
    title: promo?.title ?? "",
    description: promo?.description ?? "",
    discount_label: promo?.discount_label ?? "",
    ends_at: promo?.ends_at ? new Date(promo.ends_at).toISOString().slice(0, 16) : "",
    is_active: promo?.is_active ?? true,
  });

  useEffect(() => {
    if (promo) setForm({
      title: promo.title ?? "",
      description: promo.description ?? "",
      discount_label: promo.discount_label ?? "",
      ends_at: promo.ends_at ? new Date(promo.ends_at).toISOString().slice(0, 16) : "",
      is_active: promo.is_active,
    });
  }, [promo]);

  const save = async () => {
    if (!form.title || !form.ends_at) return toast.error("Title and end date required");
    const payload = { ...form, ends_at: new Date(form.ends_at).toISOString() };
    const { error } = promo
      ? await supabase.from("promotions").update(payload).eq("id", promo.id)
      : await supabase.from("promotions").insert(payload);
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["any-promo"] }); qc.invalidateQueries({ queryKey: ["active-promo"] }); }
  };

  const remove = async () => {
    if (!promo || !confirm("Delete promotion?")) return;
    await supabase.from("promotions").delete().eq("id", promo.id);
    qc.invalidateQueries({ queryKey: ["any-promo"] });
    qc.invalidateQueries({ queryKey: ["active-promo"] });
  };

  return (
    <div className="mt-8 panel p-6 max-w-2xl">
      <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Tag size={18}/> Sale promotion (shows at top of Gallery)</h2>
      <div className="space-y-3">
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title (e.g. Winter wedding special)" className="bg-input border border-border rounded px-3 py-2 text-sm w-full" />
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description" rows={3} className="bg-input border border-border rounded px-3 py-2 text-sm w-full" />
        <div className="grid md:grid-cols-2 gap-3">
          <input value={form.discount_label} onChange={e => setForm({ ...form, discount_label: e.target.value })} placeholder="Discount label (e.g. -20%)" className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} className="bg-input border border-border rounded px-3 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        <div className="flex gap-2">
          <button onClick={save} className="btn-lime px-5 py-2 rounded text-sm">{promo ? "Update" : "Create"} promotion</button>
          {promo && <button onClick={remove} className="px-4 py-2 rounded text-sm text-destructive border border-destructive/40 hover:bg-destructive/10 inline-flex items-center gap-1"><Trash2 size={14}/> Delete</button>}
        </div>
      </div>
    </div>
  );
}
