import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useFavourites } from "@/hooks/useFavourites";
import { Heart, Trash2, ArrowRight, Camera } from "lucide-react";

export const Route = createFileRoute("/favourites")({
  head: () => ({ meta: [{ title: "My Favourites — Tann media" }] }),
  component: Favourites,
});

function Favourites() {
  const { items, remove, clear } = useFavourites();

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20 pb-20">
        <span className="eyebrow">My Favourites</span>
        <div className="flex items-end justify-between flex-wrap gap-4 mt-3">
          <h1 className="font-display text-5xl md:text-7xl font-bold">
            Your <span className="text-gradient-warm">shortlist</span>
          </h1>
          {items.length > 0 && (
            <button onClick={clear} className="text-sm text-muted-foreground hover:text-destructive inline-flex items-center gap-2">
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>
        <p className="text-muted-foreground mt-4 max-w-xl">
          {items.length === 0
            ? "Tap the heart on any image to save it here, then send us the look you love."
            : `${items.length} saved looks — bring them to your booking inquiry.`}
        </p>

        {items.length === 0 ? (
          <div className="mt-12 panel p-12 text-center">
            <Heart size={40} className="mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No favourites yet.</p>
            <Link to="/gallery" className="mt-6 inline-flex btn-lime px-6 py-3 rounded-md text-sm items-center gap-2">
              Browse gallery <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-10 columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
              {items.map(f => (
                <div key={f.url} className="mb-3 break-inside-avoid relative group rounded-xl overflow-hidden bg-secondary">
                  <img src={f.url} alt={f.caption ?? ""} className="w-full" loading="lazy" />
                  {f.category && (
                    <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-background/80 backdrop-blur px-2 py-1 rounded-full">
                      {f.category}
                    </span>
                  )}
                  <button onClick={() => remove(f.url)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur grid place-items-center text-destructive hover:bg-destructive hover:text-white transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-12 panel p-8 lg:p-10 flex flex-wrap items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-background to-background border-primary/30">
              <div className="flex items-start gap-4">
                <span className="w-12 h-12 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0"><Camera size={20} /></span>
                <div>
                  <h3 className="font-display text-2xl md:text-3xl font-bold">Book a shoot like these</h3>
                  <p className="text-sm text-muted-foreground mt-1">We'll bring this look to your session — just mention your shortlist.</p>
                </div>
              </div>
              <Link to="/contact" search={{}} className="btn-lime px-6 py-3 rounded-md text-sm inline-flex items-center gap-2">
                Send inquiry <ArrowRight size={14} />
              </Link>
            </div>
          </>
        )}
      </section>
    </Layout>
  );
}