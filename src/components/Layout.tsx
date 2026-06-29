import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppFab } from "./WhatsAppFab";
import { MobileBookBar } from "./MobileBookBar";
import { supabase } from "@/integrations/supabase/client";
import { Tag, Clock, X } from "lucide-react";
import { useEffect, useState } from "react";

function useCountdown(endsAt: string | null) {
  const calc = () => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return time;
}

function GlobalPromoBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data: promo } = useQuery({
    queryKey: ["active-promo"],
    queryFn: async () => {
      const { data } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    refetchInterval: 60000,
  });

  const time = useCountdown(promo?.ends_at ?? null);

  if (!promo || dismissed) return null;
  if (promo.ends_at && new Date(promo.ends_at) < new Date()) return null;

  // Build search params using the correct DB column names
  // package_category = the tab to open, package_name = the card to highlight
  const promoSearch: Record<string, string> = {};
  if (promo.package_category) promoSearch.category = promo.package_category;
  if (promo.package_name) promoSearch.highlight = promo.package_name;

  return (
    <div className="relative z-40 bg-gradient-to-r from-primary/90 via-primary to-primary/90 text-primary-foreground px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
            <Tag size={11} /> {promo.discount_label || "SPECIAL OFFER"}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm">{promo.title}</span>
            {promo.description && (
              <span className="text-xs text-primary-foreground/80 hidden sm:inline">
                — {promo.description}
              </span>
            )}
            {promo.package_category && (
              <span className="text-xs bg-primary-foreground/15 text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                {promo.package_category}
                {promo.package_name ? ` › ${promo.package_name}` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {time && (
            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/80">
              <Clock size={12} />
              <span className="font-mono font-bold text-primary-foreground">
                {time.d > 0 && `${time.d}d `}
                {String(time.h).padStart(2, "0")}:{String(time.m).padStart(2, "0")}:{String(time.s).padStart(2, "0")}
              </span>
              <span>left</span>
            </div>
          )}
          <Link
            to="/pricing"
            search={promoSearch as any}
            className="bg-primary-foreground text-primary text-xs font-bold px-3 py-1.5 rounded-full hover:bg-primary-foreground/90 transition-colors whitespace-nowrap"
          >
            View deal
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-primary-foreground/70 hover:text-primary-foreground p-1 transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <GlobalPromoBanner />
      <Navbar />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <Footer />
      <WhatsAppFab />
      <MobileBookBar />
    </div>
  );
}