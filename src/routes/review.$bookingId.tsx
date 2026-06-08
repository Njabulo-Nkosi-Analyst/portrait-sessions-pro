import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Camera, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/review/$bookingId")({
  head: () => ({ meta: [{ title: "Leave a review — Trope Photography" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const { bookingId } = Route.useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [quote, setQuote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("bookings").select("id, client_name, package_name, category, session_date").eq("id", bookingId).maybeSingle();
      setBooking(data);
      setLoading(false);
    })();
  }, [bookingId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.trim()) return toast.error("Please share your experience");
    setSaving(true);
    const { error } = await supabase.from("testimonials").insert({
      client_name: booking?.client_name ?? "Anonymous",
      category: booking?.category ?? null,
      title: title.trim() || null,
      quote: quote.trim(),
      rating,
      booking_id: bookingId,
      is_approved: false,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setSubmitted(true);
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  if (!booking) {
    return (
      <div className="min-h-screen grid place-items-center px-5">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl font-bold">Review link not found</h1>
          <p className="text-sm text-muted-foreground mt-3">This review link is invalid or has expired. Reach out and we'll send a new one.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen grid place-items-center px-5">
        <div className="max-w-md text-center panel p-10">
          <CheckCircle2 size={56} className="mx-auto text-primary" />
          <h1 className="font-display text-3xl font-bold mt-4">Thank you, {booking.client_name}!</h1>
          <p className="text-sm text-muted-foreground mt-3">Your review has been submitted and will appear on the site once approved. 🎉</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center"><Camera size={16} /></span>
          <span className="font-display text-xl font-bold">Trope Photography</span>
        </div>

        <span className="eyebrow">— Share your experience</span>
        <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">How was your <span className="text-gradient-warm">experience?</span></h1>

        <div className="mt-6 panel p-4 bg-secondary/40">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Your session</div>
          <div className="font-semibold mt-1">{booking.client_name}</div>
          <div className="text-sm text-muted-foreground">{booking.package_name ?? booking.category ?? "Session"} {booking.session_date ? `· ${new Date(booking.session_date).toLocaleDateString()}` : ""}</div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4 panel p-6">
          <div>
            <div className="text-xs text-muted-foreground mb-2 font-medium">Your rating</div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                  className="p-1 transition-transform hover:scale-110">
                  <Star size={36} className={n <= (hover || rating) ? "fill-destructive text-destructive" : "text-muted-foreground"} />
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <div className="text-xs text-muted-foreground mb-1.5 font-medium">Give your review a title</div>
            <input value={title} onChange={e => setTitle(e.target.value.slice(0, 60))} maxLength={60} placeholder="e.g. Magical wedding day"
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm" />
            <div className="text-[10px] text-muted-foreground mt-1 text-right">{title.length}/60</div>
          </label>

          <label className="block">
            <div className="text-xs text-muted-foreground mb-1.5 font-medium">Tell us about your experience</div>
            <textarea value={quote} onChange={e => setQuote(e.target.value.slice(0, 400))} maxLength={400} rows={5} required
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm resize-none" />
            <div className="text-[10px] text-muted-foreground mt-1 text-right">{quote.length}/400</div>
          </label>

          <button disabled={saving} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 px-5 py-3 rounded-md text-sm font-semibold disabled:opacity-50">
            {saving ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
