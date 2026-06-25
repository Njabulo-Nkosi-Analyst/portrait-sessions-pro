import { useState, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Upload, X, Search, Save, Play, Tag } from "lucide-react";

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
  const [editCat, setEditCat] = useState<{ old: string; new: string } | null>(null);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);

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

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["all-packages"] });
    qc.invalidateQueries({ queryKey: ["packages"] });
    qc.invalidateQueries({ queryKey: ["packages-active"] });
    qc.invalidateQueries({ queryKey: ["packages-active-quote"] });
  };

  const setEdit = (id: string, patch: Partial<Pkg>) =>
    setEdits(e => ({ ...e, [id]: { ...e[id], ...patch } }));

  const saveRow = async (p: Pkg) => {
    const patch = edits[p.id];
    if (!patch) return;
    const { error } = await supabase.from("packages").update(patch as any).eq("id", p.id);
    if (error) toast.error(error.message);
    else { toast.success("Saved ✓"); setEdits(e => { const c = { ...e }; delete c[p.id]; return c; }); refresh(); }
  };

  const saveAll = async () => {
    const ids = Object.keys(edits);
    if (ids.length === 0) return toast.info("No changes");
    for (const id of ids) await supabase.from("packages").update(edits[id] as any).eq("id", id);
    setEdits({}); refresh(); toast.success(`Saved ${ids.length} row(s)`);
  };

  const addRow = async (category: string) => {
    const { data, error } = await supabase.from("packages").insert({
      category, name: "New package", duration: "1 hour", price: 0, features: [],
      is_active: false, is_popular: false,
      sort_order: (packages.filter(p => p.category === category).at(-1)?.sort_order ?? 0) + 1,
    } as any).select().single();
    if (error) toast.error(error.message);
    else { refresh(); setEdits(e => ({ ...e, [data.id]: {} })); }
  };

  const duplicate = async (p: Pkg) => {
    const { id, created_at, ...copy } = p;
    const { error } = await supabase.from("packages").insert({
      ...copy,
      name: `${p.name} (copy)`,
      is_popular: false,
    } as any);
    if (error) toast.error(error.message); else { refresh(); toast.success("Duplicated"); }
  };

  const remove = async (p: Pkg) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const { error } = await supabase.from("packages").delete().eq("id", p.id);
    if (error) toast.error(error.message); else { refresh(); toast.success("Deleted"); }
  };

  const toggleInstant = async (id: string, field: "is_active" | "is_popular", val: boolean) => {
    await supabase.from("packages").update({ [field]: val } as any).eq("id", id);
    refresh();
  };

  const move = async (p: Pkg, dir: -1 | 1) => {
    await supabase.from("packages").update({ sort_order: (p.sort_order ?? 0) + dir }).eq("id", p.id);
    refresh();
  };

  const saveNewCat = async () => {
    if (!newCat.trim()) return;
    await supabase.from("packages").insert({
      category: newCat.trim(), name: "Sample package", duration: "1 hour", price: 0,
      features: [], is_active: false, is_popular: false,
      category_sort_order: cats.length, sort_order: 1,
    } as any);
    setNewCat(""); setNewCatOpen(false); refresh(); toast.success("Category added");
  };

  const renameCategory = async () => {
    if (!editCat || !editCat.new.trim() || editCat.new === editCat.old) return;
    for (const p of packages.filter(p => p.category === editCat.old))
      await supabase.from("packages").update({ category: editCat.new.trim() }).eq("id", p.id);
    setEditCat(null); refresh();
    toast.success(`Renamed to "${editCat.new.trim()}"`);
  };

  const deleteCategory = async (cat: string) => {
    for (const p of packages.filter(p => p.category === cat))
      await supabase.from("packages").delete().eq("id", p.id);
    setDeleteCatConfirm(null); refresh();
    toast.success(`"${cat}" deleted`);
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
        <button onClick={() => setNewCatOpen(true)}
          className="px-3 py-2 rounded-md text-xs border border-border hover:border-primary inline-flex items-center gap-1.5 transition-colors">
          <Plus size={14}/> New category
        </button>
        <button onClick={saveAll} disabled={Object.keys(edits).length === 0}
          className="btn-lime px-4 py-2 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40">
          <Save size={14}/> Save all {Object.keys(edits).length > 0 && `(${Object.keys(edits).length})`}
        </button>
      </div>

      {/* Tables per category */}
      {grouped.map(({ cat, items }) => (
        <div key={cat} className="panel overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="text-xs uppercase tracking-widest font-semibold">— {cat}</div>
              <button onClick={() => setEditCat({ old: cat, new: cat })}
                className="text-[10px] text-muted-foreground hover:text-primary border border-border rounded px-2 py-0.5">Rename</button>
              <button onClick={() => setDeleteCatConfirm(cat)}
                className="text-[10px] text-muted-foreground hover:text-destructive border border-border rounded px-2 py-0.5">Delete category</button>
            </div>
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
                  <th className="text-left p-2">Perfect For</th>
                  <th className="text-left p-2 w-24">+hr rate</th>
                  <th className="text-left p-2 w-32">Media</th>
                  <th className="text-center p-2 w-16">Popular</th>
                  <th className="text-center p-2 w-16">Active</th>
                  <th className="text-right p-2 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, idx) => {
                  const e = edits[p.id] ?? {};
                  const cur = { ...p, ...e };
                  const dirty = Object.keys(e).length > 0;
                  return (
                    <tr key={p.id} className={`border-t border-border/50 ${dirty ? "bg-primary/5" : ""}`}>
                      <td className="p-2 text-xs">
                        <div className="flex flex-col">
                          <button onClick={() => move(p, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">▲</button>
                          <button onClick={() => move(p, 1)} disabled={idx === items.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">▼</button>
                        </div>
                      </td>
                      <td className="p-2 min-w-[160px]">
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
                        <DeliverablesCell value={cur.deliverables ?? ""} onChange={val => setEdit(p.id, { deliverables: val })} />
                      </td>
                      <td className="p-2">
                        <PerfectForCell value={cur.perfect_for ?? ""} onChange={val => setEdit(p.id, { perfect_for: val })} />
                      </td>
                      <td className="p-2">
                        <input type="number" value={cur.additional_hour_rate ?? ""}
                          onChange={ev => setEdit(p.id, { additional_hour_rate: ev.target.value ? Number(ev.target.value) : null })}
                          className="w-full bg-input border border-border rounded px-2 py-1" />
                      </td>
                      <td className="p-2"><MediaCell pkg={p} onSaved={() => refresh()} /></td>
                      <td className="p-2 text-center">
                        <Toggle on={cur.is_popular} onChange={v => toggleInstant(p.id, "is_popular", v)} />
                      </td>
                      <td className="p-2 text-center">
                        <Toggle on={cur.is_active} onChange={v => toggleInstant(p.id, "is_active", v)} />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center justify-end gap-1">
                          {dirty && (
                            <button onClick={() => saveRow(p)} className="p-1.5 text-primary hover:bg-primary/10 rounded" title="Save">
                              <Save size={13}/>
                            </button>
                          )}
                          <button onClick={() => duplicate(p)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded"><Copy size={13}/></button>
                          <button onClick={() => remove(p)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={11} className="p-6 text-center text-muted-foreground text-xs">No packages yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Modals */}
      {newCatOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={() => setNewCatOpen(false)}>
          <div className="panel p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold">New category</h3>
              <button onClick={() => setNewCatOpen(false)}><X size={18}/></button>
            </div>
            <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="e.g. Videography" autoFocus
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm mb-3"
              onKeyDown={e => e.key === "Enter" && saveNewCat()} />
            <button onClick={saveNewCat} className="w-full btn-lime px-5 py-2.5 rounded-md text-sm font-semibold">Save category</button>
          </div>
        </div>
      )}

      {editCat && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={() => setEditCat(null)}>
          <div className="panel p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold">Rename category</h3>
              <button onClick={() => setEditCat(null)}><X size={18}/></button>
            </div>
            <input value={editCat.new} onChange={e => setEditCat({ ...editCat, new: e.target.value })} autoFocus
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm mb-3"
              onKeyDown={e => e.key === "Enter" && renameCategory()} />
            <button onClick={renameCategory} className="w-full btn-lime px-5 py-2.5 rounded-md text-sm font-semibold">Rename</button>
          </div>
        </div>
      )}

      {deleteCatConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={() => setDeleteCatConfirm(null)}>
          <div className="panel p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold text-destructive">Delete category</h3>
              <button onClick={() => setDeleteCatConfirm(null)}><X size={18}/></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently deletes <span className="font-semibold text-foreground">"{deleteCatConfirm}"</span> and all{" "}
              <span className="text-destructive font-semibold">{packages.filter(p => p.category === deleteCatConfirm).length} packages</span> inside it.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteCatConfirm(null)} className="flex-1 px-4 py-2 rounded text-sm border border-border hover:bg-secondary">Cancel</button>
              <button onClick={() => deleteCategory(deleteCatConfirm)} className="flex-1 px-4 py-2 rounded text-sm bg-destructive text-white font-semibold">Delete everything</button>
            </div>
          </div>
        </div>
      )}

      <AddOnsPanel />
      <PromoCodesPanel />
    </div>
  );
}

// ── Perfect For cell ──
function PerfectForCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const lines = value ? value.split("\n").filter(Boolean) : [];
  return (
    <div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{lines.length > 0 ? `${lines.length} item${lines.length > 1 ? "s" : ""}` : "None"}</span>
        <button onClick={() => setOpen(true)} className="text-[10px] text-primary hover:underline ml-1">Edit</button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={() => setOpen(false)}>
          <div className="panel p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold">Perfect For</h3>
              <button onClick={() => setOpen(false)}><X size={18}/></button>
            </div>
            <div className="text-xs text-muted-foreground mb-2">One item per line e.g:<br/>Gym content<br/>Couple shoots</div>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={8} autoFocus
              placeholder={"Gym content\nPersonal branding\nCouple shoots"}
              className="w-full bg-input border border-border rounded px-3 py-2 text-sm font-mono" />
            <button onClick={() => setOpen(false)} className="mt-3 w-full btn-lime px-4 py-2 rounded text-sm font-semibold">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Deliverables cell ──
function DeliverablesCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const lines = value ? value.split("\n").filter(Boolean) : [];
  return (
    <div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{lines.length > 0 ? `${lines.length} item${lines.length > 1 ? "s" : ""}` : "None"}</span>
        <button onClick={() => setOpen(true)} className="text-[10px] text-primary hover:underline ml-1">Edit</button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={() => setOpen(false)}>
          <div className="panel p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold">Edit deliverables</h3>
              <button onClick={() => setOpen(false)}><X size={18}/></button>
            </div>
            <div className="text-xs text-muted-foreground mb-2">One per line e.g:<br/>50 edited photos<br/>USB delivery</div>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={8} autoFocus
              placeholder={"50 edited photos\nOnline gallery\nUSB delivery"}
              className="w-full bg-input border border-border rounded px-3 py-2 text-sm font-mono" />
            <button onClick={() => setOpen(false)} className="mt-3 w-full btn-lime px-4 py-2 rounded text-sm font-semibold">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Toggle ──
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`w-9 h-5 rounded-full relative transition-colors ${on ? "bg-primary" : "bg-secondary border border-border"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

function MediaCell({ pkg, onSaved }: { pkg: Pkg; onSaved: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const upload = async (file: File) => {
    setProgress(0);
    try {
      const isVideo = file.type.startsWith("video/");
      const url = await uploadToCloudinary(file, isVideo ? "tann-media/packages/videos" : "tann-media/packages/images", setProgress);
      const { error } = await supabase.from("packages").update({ media_url: url, media_type: isVideo ? "video" : "image" }).eq("id", pkg.id);
      if (error) toast.error(error.message);
      else { toast.success("Uploaded ✓"); onSaved(); }
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally { setProgress(null); }
  };

  const clear = async () => {
    await supabase.from("packages").update({ media_url: null, media_type: "none" }).eq("id", pkg.id);
    onSaved();
  };

  if (pkg.media_url) {
    return (
      <div className="relative w-20 h-14 rounded overflow-hidden border border-border group">
        {pkg.media_type === "video"
          ? <div className="w-full h-full bg-secondary grid place-items-center"><Play size={16} className="text-primary fill-current"/></div>
          : <img src={pkg.media_url} alt="" className="w-full h-full object-cover" />}
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
      {progress !== null ? (
        <div className="w-20">
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 text-center">{progress}%</div>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary border border-border rounded px-2 py-1.5">
          <Upload size={11}/> Upload
        </button>
      )}
    </div>
  );
}

// ── Add-Ons Panel ──
function AddOnsPanel() {
  const qc = useQueryClient();
  const { data: addons = [] } = useQuery({
    queryKey: ["all-addons"],
    queryFn: async () => (await supabase.from("add_ons").select("*").order("sort_order")).data ?? [],
  });

  const [newLabel, setNewLabel] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["all-addons"] });
    qc.invalidateQueries({ queryKey: ["addons-active"] });
  };

  const add = async () => {
    if (!newLabel.trim() || !newPrice) return toast.error("Label and price required");
    const maxOrder = addons.reduce((m: number, a: any) => Math.max(m, a.sort_order ?? 0), 0);
    const { error } = await supabase.from("add_ons").insert({ label: newLabel.trim(), price: Number(newPrice), is_active: true, sort_order: maxOrder + 1 } as any);
    if (error) toast.error(error.message);
    else { toast.success("Add-on added ✓"); setNewLabel(""); setNewPrice(""); refresh(); }
  };

  const saveEdit = async (id: string) => {
    if (!editLabel.trim() || !editPrice) return toast.error("Label and price required");
    const { error } = await supabase.from("add_ons").update({ label: editLabel.trim(), price: Number(editPrice) }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated ✓"); setEditId(null); refresh(); }
  };

  const move = async (id: string, order: number, dir: -1 | 1) => {
    await supabase.from("add_ons").update({ sort_order: order + dir }).eq("id", id);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this add-on?")) return;
    await supabase.from("add_ons").delete().eq("id", id);
    refresh(); toast.success("Deleted");
  };

  return (
    <div className="panel overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <div className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2"><Tag size={13}/> Add-ons</div>
      </div>
      <div className="p-4 border-b border-border bg-secondary/10">
        <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Add new add-on</div>
        <div className="flex flex-wrap gap-2">
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label e.g. Drone Coverage"
            className="flex-1 min-w-[200px] bg-input border border-border rounded px-3 py-2 text-sm" onKeyDown={e => e.key === "Enter" && add()} />
          <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Price R"
            className="w-32 bg-input border border-border rounded px-3 py-2 text-sm" onKeyDown={e => e.key === "Enter" && add()} />
          <button onClick={add} className="btn-lime px-4 py-2 rounded text-sm font-semibold inline-flex items-center gap-1.5">
            <Plus size={14}/> Add
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/20">
            <tr>
              <th className="text-left p-2 w-8">#</th>
              <th className="text-left p-2">Label</th>
              <th className="text-left p-2 w-28">Price R</th>
              <th className="text-center p-2 w-16">Active</th>
              <th className="text-right p-2 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {addons.map((a: any, idx: number) => (
              <tr key={a.id} className="border-t border-border/50">
                <td className="p-2 text-xs">
                  <div className="flex flex-col">
                    <button onClick={() => move(a.id, a.sort_order ?? 0, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">▲</button>
                    <button onClick={() => move(a.id, a.sort_order ?? 0, 1)} disabled={idx === addons.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">▼</button>
                  </div>
                </td>
                <td className="p-2">
                  {editId === a.id
                    ? <input value={editLabel} onChange={e => setEditLabel(e.target.value)} autoFocus className="w-full bg-input border border-border rounded px-2 py-1 text-sm" onKeyDown={e => e.key === "Enter" && saveEdit(a.id)} />
                    : <span className="font-medium">{a.label}</span>}
                </td>
                <td className="p-2">
                  {editId === a.id
                    ? <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full bg-input border border-border rounded px-2 py-1 text-sm" onKeyDown={e => e.key === "Enter" && saveEdit(a.id)} />
                    : <span>R{Number(a.price).toLocaleString()}</span>}
                </td>
                <td className="p-2 text-center">
                  <Toggle on={a.is_active} onChange={async v => { await supabase.from("add_ons").update({ is_active: v }).eq("id", a.id); refresh(); }} />
                </td>
                <td className="p-2">
                  <div className="flex items-center justify-end gap-1">
                    {editId === a.id ? (
                      <>
                        <button onClick={() => saveEdit(a.id)} className="p-1.5 text-primary hover:bg-primary/10 rounded"><Save size={13}/></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded"><X size={13}/></button>
                      </>
                    ) : (
                      <button onClick={() => { setEditId(a.id); setEditLabel(a.label); setEditPrice(String(a.price)); }}
                        className="text-[10px] text-primary hover:underline px-2 py-1">Edit</button>
                    )}
                    <button onClick={() => remove(a.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"><Trash2 size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {addons.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground text-xs">No add-ons yet — add one above.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Promo Codes Panel ──
function PromoCodesPanel() {
  const qc = useQueryClient();
  const { data: codes = [] } = useQuery({
    queryKey: ["all-promo-codes"],
    queryFn: async () => (await supabase.from("promo_codes").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("percent");
  const [newValue, setNewValue] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["all-promo-codes"] });

  const add = async () => {
    if (!newCode.trim() || !newValue) return toast.error("Code and discount value required");
    const { error } = await supabase.from("promo_codes").insert({
      code: newCode.trim().toUpperCase(),
      discount_type: newType,
      discount_value: Number(newValue),
      is_active: true,
      expiry_date: newExpiry || null,
      max_uses: newMaxUses ? Number(newMaxUses) : null,
    } as any);
    if (error) toast.error(error.message);
    else { toast.success("Promo code added ✓"); setNewCode(""); setNewValue(""); setNewExpiry(""); setNewMaxUses(""); refresh(); }
  };

  const update = async (id: string, patch: any) => { await supabase.from("promo_codes").update(patch).eq("id", id); refresh(); };
  const remove = async (id: string) => { if (!confirm("Delete this promo code?")) return; await supabase.from("promo_codes").delete().eq("id", id); refresh(); };

  return (
    <div className="panel overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <div className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2"><Tag size={13}/> Promo codes</div>
      </div>
      <div className="p-4 border-b border-border bg-secondary/10">
        <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Add new promo code</div>
        <div className="flex flex-wrap gap-2 items-end">
          <input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="Code e.g. MATRIC2026"
            className="bg-input border border-border rounded px-3 py-2 text-sm font-mono uppercase w-44" />
          <select value={newType} onChange={e => setNewType(e.target.value)}
            className="bg-input border border-border rounded px-3 py-2 text-sm">
            <option value="percent">% off</option>
            <option value="fixed">R off</option>
          </select>
          <input type="number" value={newValue} onChange={e => setNewValue(e.target.value)}
            placeholder={newType === "percent" ? "e.g. 20" : "e.g. 500"}
            className="bg-input border border-border rounded px-3 py-2 text-sm w-24" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground">Expiry (optional)</span>
            <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)}
              className="bg-input border border-border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground">Max uses (optional)</span>
            <input type="number" value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} placeholder="∞"
              className="bg-input border border-border rounded px-3 py-2 text-sm w-24" />
          </div>
          <button onClick={add} className="btn-lime px-4 py-2 rounded text-sm font-semibold inline-flex items-center gap-1.5">
            <Plus size={14}/> Add code
          </button>
        </div>
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
            {codes.map((c: any) => (
              <tr key={c.id} className="border-t border-border/50">
                <td className="p-2 font-mono font-semibold text-primary">{c.code}</td>
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
                <td className="p-2 text-right">
                  <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={13}/></button>
                </td>
              </tr>
            ))}
            {codes.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground text-xs">No promo codes yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}