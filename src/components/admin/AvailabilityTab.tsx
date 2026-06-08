import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Plus, X, CheckCircle2 } from "lucide-react";

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Mon" }, { key: "tue", label: "Tue" }, { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" }, { key: "fri", label: "Fri" }, { key: "sat", label: "Sat" }, { key: "sun", label: "Sun" },
];

export function AvailabilityTab() {
  const qc = useQueryClient();
  const { data: settings = [] } = useQuery({
    queryKey: ["site-settings-all"],
    queryFn: async () => (await supabase.from("site_settings").select("*")).data ?? [],
  });
  const { data: blocks = [] } = useQuery({
    queryKey: ["availability-blocks"],
    queryFn: async () => (await supabase.from("availability_blocks").select("*").order("block_date")).data ?? [],
  });

  const getSetting = (key: string) => settings.find(s => s.key === key)?.value;

  const [workingDays, setWorkingDays] = useState<Record<string, boolean>>({});
  const [defaultSlots, setDefaultSlots] = useState<Record<string, string[]>>({});
  const [newSlot, setNewSlot] = useState<Record<string, string>>({});

  useEffect(() => {
    try { setWorkingDays(JSON.parse(getSetting("working_days") ?? "{}")); } catch { /* */ }
    try { setDefaultSlots(JSON.parse(getSetting("default_slots") ?? "{}")); } catch { /* */ }
  }, [settings]);

  const saveSetting = async (key: string, value: any) => {
    const json = JSON.stringify(value);
    const existing = settings.find(s => s.key === key);
    if (existing) await supabase.from("site_settings").update({ value: json }).eq("key", key);
    else await supabase.from("site_settings").insert({ key, value: json } as any);
  };

  const saveWeekly = async () => {
    await saveSetting("working_days", workingDays);
    await saveSetting("default_slots", defaultSlots);
    qc.invalidateQueries({ queryKey: ["site-settings-all"] });
    qc.invalidateQueries({ queryKey: ["site-settings"] });
    toast.success("Weekly schedule saved");
  };

  const applyToNext60 = async () => {
    if (!confirm("Apply weekly schedule to the next 60 days? Existing manual overrides are kept.")) return;
    const existingDates = new Set(blocks.map(b => b.block_date));
    const inserts: any[] = [];
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today); d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      if (existingDates.has(iso)) continue;
      const dayKey = DAYS[(d.getDay() + 6) % 7].key; // mon=0...sun=6
      const isAvail = workingDays[dayKey] ?? false;
      inserts.push({ block_date: iso, is_available: isAvail, note: isAvail ? "weekly schedule" : "off day" });
    }
    if (inserts.length === 0) return toast.info("All next 60 days already set");
    const { error } = await supabase.from("availability_blocks").insert(inserts);
    if (error) toast.error(error.message); else { toast.success(`Applied to ${inserts.length} day(s)`); qc.invalidateQueries({ queryKey: ["availability-blocks"] }); }
  };

  const toggleDay = (key: string) => setWorkingDays(w => ({ ...w, [key]: !w[key] }));
  const addSlot = (key: string) => {
    const t = newSlot[key];
    if (!t) return;
    setDefaultSlots(s => ({ ...s, [key]: Array.from(new Set([...(s[key] ?? []), t])).sort() }));
    setNewSlot(n => ({ ...n, [key]: "" }));
  };
  const removeSlot = (key: string, t: string) => setDefaultSlots(s => ({ ...s, [key]: (s[key] ?? []).filter(x => x !== t) }));

  // Quick override
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideAvail, setOverrideAvail] = useState(false);
  const [overrideNote, setOverrideNote] = useState("");
  const saveOverride = async () => {
    if (!overrideDate) return toast.error("Pick a date");
    const existing = blocks.find(b => b.block_date === overrideDate);
    if (existing) {
      await supabase.from("availability_blocks").update({ is_available: overrideAvail, note: overrideNote }).eq("id", existing.id);
    } else {
      await supabase.from("availability_blocks").insert({ block_date: overrideDate, is_available: overrideAvail, note: overrideNote } as any);
    }
    qc.invalidateQueries({ queryKey: ["availability-blocks"] });
    setOverrideDate(""); setOverrideNote("");
    toast.success("Override saved");
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Weekly schedule */}
      <div className="panel p-6">
        <h2 className="font-display text-xl font-bold mb-1 flex items-center gap-2"><CalendarIcon size={18}/> Weekly schedule</h2>
        <p className="text-sm text-muted-foreground mb-5">Set the days you normally work and your default time slots. Apply it to the next 60 days in one click.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {DAYS.map(d => {
            const on = !!workingDays[d.key];
            return (
              <div key={d.key} className={`rounded-lg border p-3 ${on ? "border-destructive/50 bg-destructive/5" : "border-border bg-secondary/30"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{d.label}</span>
                  <button onClick={() => toggleDay(d.key)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${on ? "bg-destructive" : "bg-secondary border border-border"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {on && (
                  <div className="space-y-1.5 mt-2">
                    {(defaultSlots[d.key] ?? []).map(t => (
                      <div key={t} className="flex items-center justify-between text-xs bg-background/50 rounded px-2 py-1">
                        <span>{t}</span>
                        <button onClick={() => removeSlot(d.key, t)} className="text-muted-foreground hover:text-destructive"><X size={11}/></button>
                      </div>
                    ))}
                    <div className="flex gap-1 mt-1">
                      <input type="time" value={newSlot[d.key] ?? ""} onChange={e => setNewSlot(n => ({ ...n, [d.key]: e.target.value }))}
                        className="flex-1 min-w-0 text-xs bg-input border border-border rounded px-1.5 py-1" />
                      <button onClick={() => addSlot(d.key)} className="text-primary"><Plus size={12}/></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={saveWeekly} className="btn-lime px-4 py-2 rounded-md text-xs font-semibold">Save weekly schedule</button>
          <button onClick={applyToNext60} className="btn-ghost-dark px-4 py-2 rounded-md text-xs">Apply to next 60 days</button>
        </div>
      </div>

      {/* Per-date overrides */}
      <div className="panel p-6">
        <h2 className="font-display text-xl font-bold mb-4">Per-date override</h2>
        <div className="grid sm:grid-cols-[1fr_auto_2fr_auto] gap-3 items-end">
          <label className="text-xs">
            <div className="text-muted-foreground mb-1.5">Date</div>
            <input type="date" value={overrideDate} onChange={e => setOverrideDate(e.target.value)}
              className="w-full bg-input border border-border rounded px-3 py-2 text-sm" />
          </label>
          <button onClick={() => setOverrideAvail(a => !a)}
            className={`px-4 py-2 rounded text-xs font-semibold ${overrideAvail ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"}`}>
            {overrideAvail ? "Available" : "Unavailable"}
          </button>
          <input value={overrideNote} onChange={e => setOverrideNote(e.target.value)} placeholder="Reason / note (optional)"
            className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <button onClick={saveOverride} className="btn-lime px-4 py-2 rounded text-xs font-semibold">Save</button>
        </div>

        <div className="mt-6">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Upcoming overrides</div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {blocks.filter(b => b.block_date >= new Date().toISOString().slice(0,10)).slice(0, 20).map(b => (
              <div key={b.id} className="flex items-center justify-between text-sm bg-secondary/40 rounded px-3 py-2">
                <span className="font-mono text-xs">{b.block_date}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_available ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                  {b.is_available ? "Available" : "Blocked"}
                </span>
                <span className="flex-1 text-xs text-muted-foreground truncate ml-3">{b.note}</span>
                <button onClick={async () => { await supabase.from("availability_blocks").delete().eq("id", b.id); qc.invalidateQueries({ queryKey: ["availability-blocks"] }); }}
                  className="text-muted-foreground hover:text-destructive"><X size={13}/></button>
              </div>
            ))}
            {blocks.filter(b => b.block_date >= new Date().toISOString().slice(0,10)).length === 0 && (
              <div className="text-xs text-muted-foreground py-4 text-center flex items-center justify-center gap-2">
                <CheckCircle2 size={14}/> No overrides — running on the weekly schedule.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
