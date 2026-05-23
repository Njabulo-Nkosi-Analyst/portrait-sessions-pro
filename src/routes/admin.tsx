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
  Image as ImageLucide, Tag, Trash2, Plus, Target, Percent, Activity, Wallet,
  Bell, Fuel, UserPlus, Receipt, X, TrendingDown, PiggyBank,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — TANN Photography" }] }),
  component: Admin,
});

const PIE_COLORS = ["#c4f04a", "#ff8a65", "#ffb74d", "#7c9cff", "#e879f9", "#34d399", "#fb7185"];
type Tab = "overview" | "bookings" | "finance" | "alerts" | "packages" | "hero" | "gallery" | "promo";

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [confirmFor, setConfirmFor] = useState<any | null>(null);

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
  const { data: bookings = [] } = useQuery({
    queryKey: ["all-bookings"],
    queryFn: async () => (await supabase.from("bookings").select("*").order("confirmed_at", { ascending: false })).data ?? [],
    enabled: isAdmin,
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ["all-expenses"],
    queryFn: async () => (await supabase.from("booking_expenses").select("*")).data ?? [],
    enabled: isAdmin,
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ["all-notifications"],
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
    enabled: isAdmin,
  });

  // ───── Analytics ─────
  const priceMap = useMemo(() => new Map(packages.map(p => [p.name, Number(p.price)])), [packages]);
  const expensesByBooking = useMemo(() => {
    const m = new Map<string, number>();
    expenses.forEach(e => m.set(e.booking_id, (m.get(e.booking_id) ?? 0) + Number(e.amount)));
    return m;
  }, [expenses]);

  const stats = useMemo(() => {
    const grossRevenue = bookings.reduce((s, b) => s + Number(b.package_price), 0);
    const netRevenue = bookings.reduce((s, b) => s + Number(b.final_price), 0);
    const totalDiscounts = bookings.reduce((s, b) => s + Number(b.discount_amount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const netProfit = netRevenue - totalExpenses;
    const aov = bookings.length ? netRevenue / bookings.length : 0;
    const margin = netRevenue ? (netProfit / netRevenue) * 100 : 0;
    const discountImpact = grossRevenue ? (totalDiscounts / grossRevenue) * 100 : 0;
    const pipelineValue = inquiries.filter(i => i.status !== "booked").reduce((s, i) => s + (priceMap.get(i.package_interest ?? "") ?? 0), 0);
    const conversion = inquiries.length ? (bookings.length / inquiries.length) * 100 : 0;
    const newCount = inquiries.filter(i => i.status === "new").length;
    const avgRating = testimonials.length ? testimonials.reduce((s, t) => s + (t.rating ?? 0), 0) / testimonials.length : 0;
    const now = Date.now();
    const week = 7 * 86400000;
    const last7 = inquiries.filter(i => now - new Date(i.created_at).getTime() < week).length;
    const prev7 = inquiries.filter(i => { const d = now - new Date(i.created_at).getTime(); return d >= week && d < 2 * week; }).length;
    const growth = prev7 ? ((last7 - prev7) / prev7) * 100 : last7 ? 100 : 0;
    const last30Revenue = bookings.filter(b => now - new Date(b.confirmed_at).getTime() < 30 * 86400000).reduce((s, b) => s + Number(b.final_price), 0);
    // top expense category
    const catTotals: Record<string, number> = {};
    expenses.forEach(e => { catTotals[e.type] = (catTotals[e.type] ?? 0) + Number(e.amount); });
    const topExpense = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0] ?? ["—", 0];

    return { grossRevenue, netRevenue, totalDiscounts, totalExpenses, netProfit, aov, margin,
      discountImpact, pipelineValue, conversion, newCount, avgRating, last7, growth,
      projected: last30Revenue, bookings: bookings.length, topExpense };
  }, [bookings, expenses, inquiries, priceMap, testimonials]);

  const trend = useMemo(() => {
    const days: Record<string, { date: string; inquiries: number; bookings: number; revenue: number; profit: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      days[k] = { date: k.slice(5), inquiries: 0, bookings: 0, revenue: 0, profit: 0 };
    }
    inquiries.forEach(i => { const k = (i.created_at as string).slice(0, 10); if (days[k]) days[k].inquiries++; });
    bookings.forEach(b => {
      const k = (b.confirmed_at as string).slice(0, 10);
      if (days[k]) {
        days[k].bookings++;
        days[k].revenue += Number(b.final_price);
        days[k].profit += Number(b.final_price) - (expensesByBooking.get(b.id) ?? 0);
      }
    });
    return Object.values(days);
  }, [inquiries, bookings, expensesByBooking]);

  const revenueByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    bookings.forEach(b => { const c = b.category ?? "Other"; m[c] = (m[c] ?? 0) + Number(b.final_price); });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [bookings]);

  const byStatus = useMemo(() => {
    const m: Record<string, number> = { new: 0, read: 0, contacted: 0, booked: 0 };
    inquiries.forEach(i => { m[i.status] = (m[i.status] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [inquiries]);

  const topPackages = useMemo(() => {
    const m: Record<string, number> = {};
    bookings.forEach(b => { const p = b.package_name ?? "Custom"; m[p] = (m[p] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [bookings]);

  const unreadAlerts = notifications.filter(n => !n.is_read).length;

  // ───── Mutations ─────
  const refresh = (...keys: string[]) => keys.forEach(k => qc.invalidateQueries({ queryKey: [k] }));

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); refresh("all-inquiries"); }
  };
  const togglePackage = async (id: string, field: "is_active" | "is_popular", val: boolean) => {
    const patch = field === "is_active" ? { is_active: val } : { is_popular: val };
    const { error } = await supabase.from("packages").update(patch).eq("id", id);
    if (error) toast.error(error.message); else refresh("all-packages");
  };
  const updatePackageField = async (id: string, patch: Record<string, any>) => {
    const { error } = await supabase.from("packages").update(patch as any).eq("id", id);
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

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "bookings", label: "Bookings", badge: stats.newCount || undefined },
    { id: "finance", label: "Finance" },
    { id: "alerts", label: "Alerts", badge: unreadAlerts || undefined },
    { id: "packages", label: "Packages" },
    { id: "hero", label: "Hero" },
    { id: "gallery", label: "Gallery" },
    { id: "promo", label: "Promo" },
  ];

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20 pb-20">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="eyebrow">Owner Dashboard</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">Studio <span className="text-gradient-warm">control</span></h1>
          </div>
          <div className="flex flex-wrap gap-1 p-1 bg-secondary rounded-full">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative px-3 py-2 text-xs uppercase tracking-wider rounded-full transition-all ${tab === t.id ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
                {t.label}
                {t.badge ? <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full px-1 grid place-items-center font-bold">{t.badge}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {tab === "overview" && (
          <>
            {/* KPI cards */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <KPI icon={<PiggyBank size={18}/>} label="Net profit" value={`R${stats.netProfit.toLocaleString()}`} accent />
              <KPI icon={<DollarSign size={18}/>} label="Net revenue" value={`R${stats.netRevenue.toLocaleString()}`} />
              <KPI icon={<TrendingDown size={18}/>} label="Expenses" value={`R${stats.totalExpenses.toLocaleString()}`} />
              <KPI icon={<Percent size={18}/>} label="Avg margin" value={`${stats.margin.toFixed(1)}%`} />
              <KPI icon={<Tag size={18}/>} label="Discount impact" value={`-R${stats.totalDiscounts.toLocaleString()} (${stats.discountImpact.toFixed(1)}%)`} />
              <KPI icon={<Target size={18}/>} label="Avg order value" value={`R${Math.round(stats.aov).toLocaleString()}`} />
              <KPI icon={<Activity size={18}/>} label="Pipeline value" value={`R${stats.pipelineValue.toLocaleString()}`} />
              <KPI icon={<TrendingUp size={18}/>} label="30d revenue" value={`R${stats.projected.toLocaleString()}`} />
              <KPI icon={<CheckCircle2 size={18}/>} label="Confirmed bookings" value={stats.bookings.toString()} />
              <KPI icon={<Percent size={18}/>} label="Conversion" value={`${stats.conversion.toFixed(1)}%`} />
              <KPI icon={<Inbox size={18}/>} label="Total inquiries" value={inquiries.length.toString()} />
              <KPI icon={<Star size={18}/>} label="Avg rating" value={stats.avgRating.toFixed(2)} />
            </div>

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
                <h2 className="font-display text-xl font-bold mb-4">Revenue vs profit — 30 days</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="date" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} />
                    <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 8 }} formatter={(v: any) => `R${Number(v).toLocaleString()}`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke="#c4f04a" strokeWidth={2.5} dot={false} name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={2.5} dot={false} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

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
                <h2 className="font-display text-xl font-bold mb-4">Top booked packages</h2>
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
                  <div>This week: <span className="text-foreground font-semibold">{stats.last7}</span> inquiries</div>
                  <div>WoW: <span className={`font-semibold ${stats.growth >= 0 ? "text-primary" : "text-orange-400"}`}>{stats.growth >= 0 ? "+" : ""}{stats.growth.toFixed(0)}%</span></div>
                  <div>Top expense: <span className="text-foreground font-semibold capitalize">{stats.topExpense[0]} (R{Number(stats.topExpense[1]).toLocaleString()})</span></div>
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
            <div className="p-4 border-b border-border text-sm text-muted-foreground">
              Confirm an inquiry → it becomes a booking and KPIs update. For custom rates / discounts, fill them in the dialog.
            </div>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Name</th><th className="text-left p-3">Category</th><th className="text-left p-3">Package</th><th className="text-left p-3">Preferred</th><th className="text-left p-3">Contact</th><th className="text-left p-3">Status</th><th className="text-left p-3">Action</th></tr>
              </thead>
              <tbody>
                {inquiries.map(i => (
                  <tr key={i.id} className="border-b border-border/50">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(i.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-semibold">{i.name}</td>
                    <td className="p-3">{i.category ?? "—"}</td>
                    <td className="p-3">{i.package_interest ?? "Custom"}</td>
                    <td className="p-3 text-muted-foreground">{i.preferred_date ?? "—"}</td>
                    <td className="p-3 text-xs">{i.email}<br/>{i.whatsapp}</td>
                    <td className="p-3">
                      <select value={i.status} onChange={e => updateStatus(i.id, e.target.value)}
                        className="bg-input border border-border rounded px-2 py-1 text-xs">
                        {["new","read","contacted","booked"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      {i.status !== "booked" ? (
                        <button onClick={() => setConfirmFor(i)} className="btn-lime px-3 py-1.5 rounded text-xs font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 size={12}/> Confirm
                        </button>
                      ) : (
                        <span className="text-xs text-primary inline-flex items-center gap-1"><CheckCircle2 size={12}/> Booked</span>
                      )}
                    </td>
                  </tr>
                ))}
                {inquiries.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No inquiries yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "finance" && <FinanceTab bookings={bookings} expenses={expenses} expensesByBooking={expensesByBooking} stats={stats} qc={qc} />}
        {tab === "alerts" && <AlertsTab notifications={notifications} qc={qc} />}

        {tab === "packages" && (
          <div className="mt-8 panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr><th className="text-left p-3">Category</th><th className="text-left p-3">Name</th><th className="text-left p-3">Price (R)</th><th className="text-left p-3">Cover image</th><th className="text-left p-3">Video URL</th><th className="text-left p-3">Active</th><th className="text-left p-3">Popular</th></tr>
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
                        <input defaultValue={p.cover_image_url ?? ""} onBlur={e => { if (e.target.value !== (p.cover_image_url ?? "")) updatePackageField(p.id, { cover_image_url: e.target.value || null }); }} className="bg-input border border-border rounded px-2 py-1 w-48 text-xs" placeholder="https://..." />
                      </div>
                    </td>
                    <td className="p-3">
                      <input defaultValue={(p as any).video_url ?? ""} onBlur={e => { if (e.target.value !== ((p as any).video_url ?? "")) updatePackageField(p.id, { video_url: e.target.value || null }); }} className="bg-input border border-border rounded px-2 py-1 w-48 text-xs" placeholder="YouTube/Vimeo/MP4 URL" />
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

      {confirmFor && (
        <ConfirmDialog inquiry={confirmFor} packages={packages} onClose={() => setConfirmFor(null)} onDone={() => { setConfirmFor(null); refresh("all-inquiries", "all-bookings", "all-notifications"); }} />
      )}
    </Layout>
  );
}

// ─────────── KPI / Empty ───────────
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
  return <div className="text-center text-muted-foreground text-sm py-12">No data yet — will appear here as activity comes in.</div>;
}

// ─────────── Confirm Booking Dialog ───────────
function ConfirmDialog({ inquiry, packages, onClose, onDone }: { inquiry: any; packages: any[]; onClose: () => void; onDone: () => void }) {
  const matched = packages.find(p => p.name === inquiry.package_interest);
  const [packagePrice, setPackagePrice] = useState<number>(matched ? Number(matched.price) : 0);
  const [discount, setDiscount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState("");
  const [sessionDate, setSessionDate] = useState<string>(inquiry.preferred_date ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const isCustom = !matched;
  const final = Math.max(0, packagePrice - discount);

  const save = async () => {
    if (packagePrice <= 0) return toast.error("Set a package price");
    if (discount > 0 && !discountReason.trim()) return toast.error("Add a reason for the discount");
    setSaving(true);
    const { error: bErr } = await supabase.from("bookings").insert({
      inquiry_id: inquiry.id,
      user_id: inquiry.user_id,
      client_name: inquiry.name,
      client_email: inquiry.email,
      client_whatsapp: inquiry.whatsapp,
      category: inquiry.category,
      package_name: inquiry.package_interest ?? "Custom",
      package_price: packagePrice,
      discount_amount: discount,
      discount_reason: discount > 0 ? discountReason : null,
      final_price: final,
      session_date: sessionDate || null,
      notes: notes || null,
    });
    if (bErr) { setSaving(false); return toast.error(bErr.message); }
    await supabase.from("inquiries").update({ status: "booked" }).eq("id", inquiry.id);
    toast.success(`Booking confirmed — R${final.toLocaleString()}`);
    setSaving(false);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="panel p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="eyebrow">Confirm booking</span>
            <h2 className="font-display text-2xl font-bold mt-1">{inquiry.name}</h2>
            <div className="text-xs text-muted-foreground mt-1">{inquiry.category ?? "—"} · {inquiry.package_interest ?? "Custom"} {isCustom && <span className="text-orange-400">(custom)</span>}</div>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X size={20}/></button>
        </div>
        <div className="space-y-3">
          <Lbl t="Package price (R)"><input type="number" value={packagePrice} onChange={e => setPackagePrice(Number(e.target.value))} className="inp" /></Lbl>
          <div className="grid grid-cols-2 gap-3">
            <Lbl t="Discount (R)"><input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="inp" /></Lbl>
            <Lbl t="Session date"><input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} className="inp" /></Lbl>
          </div>
          {discount > 0 && (
            <Lbl t={`Discount reason (required) — feeds the "Discount Impact" metric`}>
              <input value={discountReason} onChange={e => setDiscountReason(e.target.value)} placeholder="e.g. Repeat client, off-peak, package bundle" className="inp" />
            </Lbl>
          )}
          <Lbl t="Internal notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="inp" /></Lbl>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Final price</span>
              <span className="font-display text-3xl font-bold text-primary">R{final.toLocaleString()}</span>
            </div>
            {discount > 0 && <div className="text-xs text-orange-300 mt-1">−R{discount.toLocaleString()} discount</div>}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-lime px-5 py-2 rounded text-sm font-semibold disabled:opacity-50">
              {saving ? "Confirming…" : "Confirm booking"}
            </button>
          </div>
        </div>
        <style>{`.inp{width:100%;background:var(--input);color:var(--foreground);border:1px solid var(--border);border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem}.inp:focus{outline:2px solid var(--primary);outline-offset:2px}`}</style>
      </div>
    </div>
  );
}
function Lbl({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-xs text-muted-foreground mb-1.5 font-medium">{t}</div>{children}</label>;
}

// ─────────── Finance Tab ───────────
function FinanceTab({ bookings, expenses, expensesByBooking, stats, qc }: { bookings: any[]; expenses: any[]; expensesByBooking: Map<string, number>; stats: any; qc: any }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={<PiggyBank size={18}/>} label="Money kept (net profit)" value={`R${stats.netProfit.toLocaleString()}`} accent />
        <KPI icon={<DollarSign size={18}/>} label="Net revenue" value={`R${stats.netRevenue.toLocaleString()}`} />
        <KPI icon={<TrendingDown size={18}/>} label="Total expenses" value={`R${stats.totalExpenses.toLocaleString()}`} />
        <KPI icon={<Percent size={18}/>} label="Margin" value={`${stats.margin.toFixed(1)}%`} />
      </div>

      <div className="panel p-4 lg:p-6">
        <h2 className="font-display text-xl font-bold mb-1 flex items-center gap-2"><Wallet size={18}/> Per-booking finances</h2>
        <p className="text-sm text-muted-foreground mb-5">Log petrol, wages, and other costs. The "Money Left" card updates live.</p>

        {bookings.length === 0 && <Empty/>}
        <div className="space-y-3">
          {bookings.map(b => {
            const spent = expensesByBooking.get(b.id) ?? 0;
            const kept = Number(b.final_price) - spent;
            const isOpen = openId === b.id;
            return (
              <div key={b.id} className="bg-secondary/40 rounded-xl border border-border overflow-hidden">
                <button onClick={() => setOpenId(isOpen ? null : b.id)} className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-secondary/70 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{b.client_name} <span className="text-muted-foreground font-normal text-sm">· {b.package_name}</span></div>
                    <div className="text-xs text-muted-foreground">{new Date(b.confirmed_at).toLocaleDateString()} · {b.category ?? "—"}{b.session_date ? ` · session ${b.session_date}` : ""}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">Revenue</div>
                    <div className="font-semibold">R{Number(b.final_price).toLocaleString()}</div>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="text-xs text-muted-foreground">Expenses</div>
                    <div className="font-semibold text-orange-300">−R{spent.toLocaleString()}</div>
                  </div>
                  <div className={`text-right shrink-0 px-3 py-2 rounded-lg ${kept >= 0 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                    <div className="text-[10px] uppercase tracking-wider">Money left</div>
                    <div className="font-display font-bold">R{kept.toLocaleString()}</div>
                  </div>
                </button>
                {isOpen && (
                  <BookingExpenses booking={b} items={expenses.filter(e => e.booking_id === b.id)} qc={qc} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────── Per-booking expenses panel ───────────
function BookingExpenses({ booking, items, qc }: { booking: any; items: any[]; qc: any }) {
  const [km, setKm] = useState("");
  const [rate, setRate] = useState("2.50");
  const [wageName, setWageName] = useState("");
  const [wageAmount, setWageAmount] = useState("");
  const [otherLabel, setOtherLabel] = useState("");
  const [otherAmount, setOtherAmount] = useState("");

  const reload = () => qc.invalidateQueries({ queryKey: ["all-expenses"] });

  const addPetrol = async () => {
    const k = Number(km), r = Number(rate);
    if (!k || !r) return toast.error("Enter km and rate");
    const amount = +(k * r).toFixed(2);
    const { error } = await supabase.from("booking_expenses").insert({ booking_id: booking.id, type: "petrol", label: `${k} km × R${r}`, km: k, rate_per_km: r, amount });
    if (error) toast.error(error.message); else { setKm(""); reload(); }
  };
  const addWage = async () => {
    if (!wageName.trim() || !Number(wageAmount)) return toast.error("Assistant + amount required");
    const { error } = await supabase.from("booking_expenses").insert({ booking_id: booking.id, type: "wage", label: wageName, amount: Number(wageAmount) });
    if (error) toast.error(error.message); else { setWageName(""); setWageAmount(""); reload(); }
  };
  const addOther = async () => {
    if (!otherLabel.trim() || !Number(otherAmount)) return toast.error("Label + amount required");
    const { error } = await supabase.from("booking_expenses").insert({ booking_id: booking.id, type: "other", label: otherLabel, amount: Number(otherAmount) });
    if (error) toast.error(error.message); else { setOtherLabel(""); setOtherAmount(""); reload(); }
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("booking_expenses").delete().eq("id", id);
    if (error) toast.error(error.message); else reload();
  };

  return (
    <div className="border-t border-border p-4 grid lg:grid-cols-3 gap-4 bg-background/30">
      {/* Add forms */}
      <div className="space-y-3">
        <div className="panel p-3">
          <div className="text-xs font-semibold flex items-center gap-1.5 mb-2"><Fuel size={13}/> Add petrol</div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input value={km} onChange={e => setKm(e.target.value)} type="number" placeholder="km" className="exp-inp" />
            <input value={rate} onChange={e => setRate(e.target.value)} type="number" step="0.01" placeholder="R/km" className="exp-inp" />
            <button onClick={addPetrol} className="btn-lime px-3 rounded text-xs"><Plus size={12}/></button>
          </div>
          {Number(km) > 0 && Number(rate) > 0 && <div className="text-xs text-muted-foreground mt-1.5">= R{(Number(km) * Number(rate)).toFixed(2)}</div>}
        </div>
        <div className="panel p-3">
          <div className="text-xs font-semibold flex items-center gap-1.5 mb-2"><UserPlus size={13}/> Add wage</div>
          <div className="space-y-2">
            <input value={wageName} onChange={e => setWageName(e.target.value)} placeholder="Assistant name" className="exp-inp w-full" />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input value={wageAmount} onChange={e => setWageAmount(e.target.value)} type="number" placeholder="Amount R" className="exp-inp" />
              <button onClick={addWage} className="btn-lime px-3 rounded text-xs"><Plus size={12}/></button>
            </div>
          </div>
        </div>
        <div className="panel p-3">
          <div className="text-xs font-semibold flex items-center gap-1.5 mb-2"><Receipt size={13}/> Other cost</div>
          <div className="space-y-2">
            <input value={otherLabel} onChange={e => setOtherLabel(e.target.value)} placeholder="e.g. Props, parking" className="exp-inp w-full" />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input value={otherAmount} onChange={e => setOtherAmount(e.target.value)} type="number" placeholder="Amount R" className="exp-inp" />
              <button onClick={addOther} className="btn-lime px-3 rounded text-xs"><Plus size={12}/></button>
            </div>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="lg:col-span-2 panel p-3">
        <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Logged expenses</div>
        {items.length === 0 ? (
          <div className="text-xs text-muted-foreground py-6 text-center">Nothing logged yet — add costs on the left.</div>
        ) : (
          <div className="space-y-1.5">
            {items.map(it => (
              <div key={it.id} className="flex items-center gap-2 text-sm bg-secondary/50 rounded px-3 py-2">
                <span className={`text-xs px-1.5 py-0.5 rounded uppercase font-bold ${it.type === "petrol" ? "bg-orange-500/20 text-orange-300" : it.type === "wage" ? "bg-blue-500/20 text-blue-300" : "bg-muted text-muted-foreground"}`}>{it.type}</span>
                <span className="flex-1 truncate">{it.label}</span>
                <span className="font-semibold">−R{Number(it.amount).toLocaleString()}</span>
                <button onClick={() => remove(it.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={13}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`.exp-inp{background:var(--input);color:var(--foreground);border:1px solid var(--border);border-radius:.375rem;padding:.4rem .55rem;font-size:.8rem;width:100%}.exp-inp:focus{outline:1px solid var(--primary)}`}</style>
    </div>
  );
}

// ─────────── Alerts Tab ───────────
function AlertsTab({ notifications, qc }: { notifications: any[]; qc: any }) {
  const refresh = () => qc.invalidateQueries({ queryKey: ["all-notifications"] });
  const markRead = async (id: string) => { await supabase.from("notifications").update({ is_read: true }).eq("id", id); refresh(); };
  const markAll = async () => { await supabase.from("notifications").update({ is_read: true }).eq("is_read", false); refresh(); toast.success("All marked read"); };
  const remove = async (id: string) => { await supabase.from("notifications").delete().eq("id", id); refresh(); };

  const iconFor = (k: string) => k === "inquiry" ? <Inbox size={14}/> : k === "booking" ? <CheckCircle2 size={14}/> : k === "review" ? <Star size={14}/> : k === "quote" ? <DollarSign size={14}/> : <Bell size={14}/>;

  return (
    <div className="mt-8 panel p-4 lg:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold flex items-center gap-2"><Bell size={18}/> Notifications</h2>
        {notifications.some(n => !n.is_read) && (
          <button onClick={markAll} className="text-xs text-muted-foreground hover:text-foreground underline">Mark all read</button>
        )}
      </div>
      {notifications.length === 0 ? <Empty/> : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg ${n.is_read ? "bg-secondary/30" : "bg-primary/5 border border-primary/20"}`}>
              <span className={`mt-0.5 w-7 h-7 rounded-full grid place-items-center shrink-0 ${n.is_read ? "bg-secondary text-muted-foreground" : "bg-primary/20 text-primary"}`}>{iconFor(n.kind)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</div>}
                <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                {!n.is_read && <button onClick={() => markRead(n.id)} className="text-xs text-primary hover:underline">Mark read</button>}
                <button onClick={() => remove(n.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={13}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────── Hero / Gallery / Promo Managers (unchanged from previous) ───────────
function HeroManager({ hero, qc }: { hero: any[]; qc: any }) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const add = async () => {
    if (!url.trim() || !label.trim()) return toast.error("URL and label required");
    const { error } = await supabase.from("hero_images").insert({ url, category_label: label, video_url: videoUrl || null, sort_order: (hero.at(-1)?.sort_order ?? 0) + 1 } as any);
    if (error) toast.error(error.message); else { toast.success("Added"); setUrl(""); setLabel(""); setVideoUrl(""); qc.invalidateQueries({ queryKey: ["all-hero"] }); qc.invalidateQueries({ queryKey: ["hero-active"] }); }
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
        <div className="grid md:grid-cols-2 gap-3">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Image URL (https://...)" className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Category label (e.g. Weddings)" className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="(Optional) Video URL — overrides image" className="bg-input border border-border rounded px-3 py-2 text-sm md:col-span-2" />
          <button onClick={add} className="btn-lime px-4 py-2 rounded text-sm inline-flex items-center justify-center gap-1 md:col-span-2"><Plus size={14}/> Add hero</button>
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
                {(h as any).video_url && <div className="text-[10px] text-primary mt-1">▶ Video</div>}
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
      title: promo.title ?? "", description: promo.description ?? "", discount_label: promo.discount_label ?? "",
      ends_at: promo.ends_at ? new Date(promo.ends_at).toISOString().slice(0, 16) : "", is_active: promo.is_active,
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
    qc.invalidateQueries({ queryKey: ["any-promo"] }); qc.invalidateQueries({ queryKey: ["active-promo"] });
  };
  return (
    <div className="mt-8 panel p-6 max-w-2xl">
      <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Tag size={18}/> Sale promotion (shows at top of Gallery)</h2>
      <div className="space-y-3">
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="bg-input border border-border rounded px-3 py-2 text-sm w-full" />
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
