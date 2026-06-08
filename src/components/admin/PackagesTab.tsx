import { useState, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Upload, X, Search, Save, Play, Tag, Image as ImageIcon } from "lucide-react";

type Pkg = any;

export function PackagesTab() {
  const qc = useQueryClient();
  const { data: packages = [] } = useQuery({
    queryKey: ["all-packages"],
    queryFn: async () =>
      (await supabase.from("packages").select("*").order("category_sort_order").order("category").order("sort_order")).data ?? [],
  });

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [edits, setEdits] = useState<Record<string, Partial<Pkg>>>({});
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCat, setNewCat] = useState("");

  const cats = useMemo(() => Array.from(new Set(packages.map(p => p.category))), [packages]);
  const filtered = packages.filter(p => {
    if (filterCat && p.category !== filterCat) return false;
    if (search && !`${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped: { cat: string; items: Pkg[] }[] = [];
  filtered.forEach(p => {
    const g = grouped.find(x => x.cat === p.category);
    if (g) g.items.push(p); else grouped.push({ cat: p.category, items: [p] });
  });

  const refresh = () => { qc.invalidateQueries({ queryKey: ["all-packages"] }); qc.invalidateQueries({ queryKey: ["packages"] }); qc.invalidateQueries({ queryKey: ["packages-active"] }); };
  const setEdit = (id: string, patch: Partial<Pkg>) => setEdits(e => ({ ...e, [id]: { ...e[id], ...patch } }));

  const saveRow = async (p: Pkg) => {
    const patch = edits[p.id];
    if (!patch) return;
    const { error } = await supabase.from("packages").update(patch as any).eq("id", p.id);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); setEdits(e => { const c = { ...e }; delete c[p.id]; return c; }); refresh(); }
  };

  const saveAll = async () => {
    const ids = Object.keys(edits);
    if (ids.length === 0) return toast.info("No changes");
    for (const id of ids) {
      await supabase.from("packages").update(edits[id] as any).eq("id", id);
    }
    setEdits({});
    refresh();
    toast.success(`Saved ${ids.length} row(s)`);
  };

  const addRow = async (category: string) => {
    const { data, error } = await supabase.from("packages").insert({
      category, name: "New package", duration: "1 hour", price: 0, features: [], is_active: false, is_popular: false,
      sort_order: (packages.filter(p => p.category === category).at(-1)?.sort_order ?? 0) + 1,
    } as any).select().single();
    if (error) toast.error(error.message); else { refresh(); setEdits(e => ({ ...e, [data.id]: {} })); }
  };

  const duplicate = async (p: Pkg) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, ...copy } = p;
    const { error } = await supabase.from("packages").insert({ ...copy, name: `${p.name} (copy)`, is_popular: false } as any);
    if (error) toast.error(error.message); else { refresh(); toast.success("Duplicated"); }
  };

  const remove = async (p: Pkg) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("packages").delete().eq("id", p.id);
    if (error) toast.error(error.message); else { refresh(); toast.success("Deleted"); }
  };

  const toggle = async (id: string, field: "is_active" | "is_popular", val: boolean) => {
    const patch: any = { [field]: val };
    await supabase.from("packages").update(patch).eq("id", id);
    refresh();
  };

  const move = async (p: Pkg, dir: -1 | 1) => {
    const next = (p.sort_order ?? 0) + dir;
    await supabase.from("packages").update({ sort_order: next }).eq("id", p.id);
    refresh();
  };

  const saveNewCat = async () => {
    if (!newCat.trim()) return;
    await supabase.from("packages").insert({
      category: newCat.trim(), name: "Sample package", duration: "1 hour", price: 0, features: [],
      is_active: false, is_popular: false,
      category_sort_order: cats.length, sort_order: 1,
    } as any);
    setNewCat(""); setNewCatOpen(false); refresh(); toast.success("Category added");
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search packages…"
            className="w-full bg-input border border-border rounded-md pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="bg-input border border-border rounded-md px-3 py-2 text-sm">
          <option value="">All categories</option>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => setNewCatOpen(true)} className="btn-ghost-dark px-3 py-2 rounded-md text-xs inline-flex items-center gap-1.5">
          <Plus size={14}/> New category
        </button>
        <button onClick={saveAll} disabled={Object.keys(edits).length === 0}
          className="btn-lime px-4 py-2 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40">
          <Save size={14}/> Save all changes {Object.keys(edits).length > 0 && `(${Object.keys(edits).length})`}
        </button>
      </div>

      {/* Tables per category */}
      {grouped.map(({ cat, items }) => (
        <div key={cat} className="panel overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/30">
            <div className="text-xs uppercase tracking-widest font-semibold">— {cat}</div>
            <button onClick={() => addRow(cat)} className="text-xs inline-flex items-center gap-1 text-primary hover:underline">
              <Plus size={12}/> Add row
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/20">
                <tr>
                  <th className="text-left p-2 w-8">#</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2 w-24">Price R</th>
                  <th className="text-left p-2 w-28">Duration</th>
                  <th className="text-left p-2">Deliverables</th>
                  <th className="text-left p-2 w-24">+hr rate</th>
                  <th className="text-left p-2 w-32">Media</th>
                  <th className="text-center p-2 w-16">Popular</th>
                  <th className="text-center p-2 w-16">Active</th>
                  <th className="text-right p-2 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, idx) => {
                  const e = edits[p.id] ?? {};
                  const cur = { ...p, ...e };
                  const dirty = Object.keys(e).length > 0;
                  return (
                    <tr key={p.id} className={`border-t border-border/50 ${dirty ? "bg-primary/5" : ""}`}>
                      <td className="p-2 text-muted-foreground text-xs">
                        <div className="flex flex-col">
                          <button onClick={() => move(p, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">▲</button>
                          <button onClick={() => move(p, 1)} disabled={idx === items.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">▼</button>
                        </div>
                      </td>
                      <td className="p-2">
                        <input value={cur.name ?? ""} onChange={ev => setEdit(p.id, { name: ev.target.value })}
                          className="w-full bg-transparent border-0 focus:bg-input focus:border focus:border-border rounded px-2 py-1 font-semibold" />
                      </td>
                      <td className="p-2">
                        <input type="number" value={cur.price ?? 0} onChange={ev => setEdit(p.id, { price: Number(ev.target.value) })}
                          className="w-full bg-input border border-border rounded px-2 py-1" />
                      </td>
                      <td className="p-2">
                        <input value={cur.duration ?? ""} onChange={ev => setEdit(p.id, { duration: ev.target.value })}
                          className="w-full bg-input border border-border rounded px-2 py-1" />
                      </td>
                      <td className="p-2">
                        <input value={cur.deliverables ?? ""} onChange={ev => setEdit(p.id, { deliverables: ev.target.value })}
                          placeholder="e.g. 50 edited photos, online gallery"
                          className="w-full bg-input border border-border rounded px-2 py-1 text-xs" />
                      </td>
                      <td className="p-2">
                        <input type="number" value={cur.additional_hour_rate ?? ""} onChange={ev => setEdit(p.id, { additional_hour_rate: ev.target.value ? Number(ev.target.value) : null })}
                          className="w-full bg-input border border-border rounded px-2 py-1" />
                      </td>
                      <td className="p-2">
                        <MediaCell pkg={p} onSaved={() => refresh()} />
                      </td>
                      <td className="p-2 text-center">
                        <Toggle on={cur.is_popular} onChange={v => toggle(p.id, "is_popular", v)} />
                      </td>
                      <td className="p-2 text-center">
                        <Toggle on={cur.is_active} onChange={v => toggle(p.id, "is_active", v)} />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center justify-end gap-1">
                          {dirty && <button onClick={() => saveRow(p)} className="p-1.5 text-primary hover:bg-primary/10 rounded" title="Save row"><Save size={13}/></button>}
                          <button onClick={() => duplicate(p)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded" title="Duplicate"><Copy size={13}/></button>
                          <button onClick={() => remove(p)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded" title="Delete"><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={10} className="p-6 text-center text-muted-foreground text-xs">No packages in this category yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* New category modal */}
      {newCatOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={() => setNewCatOpen(false)}>
          <div className="panel p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold">New category</h3>
              <button onClick={() => setNewCatOpen(false)}><X size={18}/></button>
            </div>
            <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="e.g. Videography" autoFocus
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm mb-3" />
            <div className="text-xs text-muted-foreground mb-4">Creates a starter package in the new category — edit or delete it from the table.</div>
            <button onClick={saveNewCat} className="w-full btn-lime px-5 py-2.5 rounded-md text-sm font-semibold">Save category</button>
          </div>
        </div>
      )}

      <PromoCodesPanel />
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className={`w-9 h-5 rounded-full relative transition-colors ${on ? "bg-primary" : "bg-secondary border border-border"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

function MediaCell({ pkg, onSaved }: { pkg: Pkg; onSaved: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    const isVideo = file.type.startsWith("video/");
    const ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
    const path = `packages/${pkg.id}-${Date.now()}.${ext}`;
    const { error: uErr } = await supabase.storage.from("gallery").upload(path, file, { upsert: true, contentType: file.type });
    if (uErr) { toast.error(uErr.message); setBusy(false); return; }
    const { data: pub } = supabase.storage.from("gallery").getPublicUrl(path);
    const { error } = await supabase.from("packages").update({
      media_url: pub.publicUrl,
      media_type: isVideo ? "video" : "image",
    }).eq("id", pkg.id);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Uploaded"); onSaved(); }
  };

  const clear = async () => {
    await supabase.from("packages").update({ media_url: null, media_type: "none" }).eq("id", pkg.id);
    onSaved();
  };

  if (pkg.media_url) {
    return (
      <div className="relative w-20 h-14 rounded overflow-hidden border border-border group">
        {pkg.media_type === "video" ? (
          <div className="w-full h-full bg-secondary grid place-items-center"><Play size={16} className="text-primary fill-current"/></div>
        ) : (
          <img src={pkg.media_url} alt="" className="w-full h-full object-cover" />
        )}
        <button onClick={clear} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-destructive text-white grid place-items-center opacity-0 group-hover:opacity-100">
          <X size={10}/>
        </button>
      </div>
    );
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*,video/mp4,video/quicktime,video/webm" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      <button onClick={() => inputRef.current?.click()} disabled={busy}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary border border-border rounded px-2 py-1.5">
        {busy ? <span className="text-[10px]">…</span> : <><Upload size={11}/> Upload</>}
      </button>
    </div>
  );
}

// ───────────────────── PROMO CODES ─────────────────────
function PromoCodesPanel() {
  const qc = useQueryClient();
  const { data: codes = [] } = useQuery({
    queryKey: ["all-promo-codes"],
    queryFn: async () => (await supabase.from("promo_codes").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["all-promo-codes"] });

  const add = async () => {
    const code = prompt("Promo code (e.g. MATRIC2026):")?.trim().toUpperCase();
    if (!code) return;
    const { error } = await supabase.from("promo_codes").insert({ code, discount_type: "percent", discount_value: 10, is_active: true } as any);
    if (error) toast.error(error.message); else refresh();
  };

  const update = async (id: string, patch: any) => { await supabase.from("promo_codes").update(patch).eq("id", id); refresh(); };
  const remove = async (id: string) => { if (!confirm("Delete this promo code?")) return; await supabase.from("promo_codes").delete().eq("id", id); refresh(); };

  return (
    <div className="panel">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/30">
        <div className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2"><Tag size={13}/> Promo codes</div>
        <button onClick={add} className="text-xs inline-flex items-center gap-1 text-primary hover:underline"><Plus size={12}/> Add code</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/20">
            <tr>
              <th className="text-left p-2">Code</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Value</th>
              <th className="text-left p-2">Expires</th>
              <th className="text-left p-2">Max uses</th>
              <th className="text-left p-2">Used</th>
              <th className="text-center p-2">Active</th>
              <th className="text-right p-2"></th>
            </tr>
          </thead>
          <tbody>
            {codes.map(c => (
              <tr key={c.id} className="border-t border-border/50">
                <td className="p-2 font-mono font-semibold">{c.code}</td>
                <td className="p-2">
                  <select defaultValue={c.discount_type} onChange={e => update(c.id, { discount_type: e.target.value })}
                    className="bg-input border border-border rounded px-2 py-1 text-xs">
                    <option value="percent">% off</option><option value="fixed">R off</option>
                  </select>
                </td>
                <td className="p-2">
                  <input type="number" defaultValue={c.discount_value} onBlur={e => update(c.id, { discount_value: Number(e.target.value) })}
                    className="w-20 bg-input border border-border rounded px-2 py-1" />
                </td>
                <td className="p-2">
                  <input type="date" defaultValue={c.expiry_date ?? ""} onBlur={e => update(c.id, { expiry_date: e.target.value || null })}
                    className="bg-input border border-border rounded px-2 py-1 text-xs" />
                </td>
                <td className="p-2">
                  <input type="number" defaultValue={c.max_uses ?? ""} placeholder="∞" onBlur={e => update(c.id, { max_uses: e.target.value ? Number(e.target.value) : null })}
                    className="w-16 bg-input border border-border rounded px-2 py-1" />
                </td>
                <td className="p-2 text-muted-foreground">{c.uses_count ?? 0}</td>
                <td className="p-2 text-center"><Toggle on={c.is_active} onChange={v => update(c.id, { is_active: v })}/></td>
                <td className="p-2 text-right"><button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={13}/></button></td>
              </tr>
            ))}
            {codes.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground text-xs">No promo codes yet. Click "Add code" to create one.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
