// WhatsApp quick-reply templates. Returns wa.me link with pre-filled text.

const BANK = "FNB · W. Ma · Acc 63052599968";

export type TemplateKey = "confirmed" | "deposit_reminder" | "shoot_reminder" | "gallery_ready" | "thank_you";

export interface BookingForTemplate {
  client_name: string;
  client_whatsapp?: string | null;
  package_name?: string | null;
  package_price?: number | null;
  final_price?: number | null;
  session_date?: string | null;
  session_time?: string | null;
}

const fmtDate = (d?: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" }) : "your session date";

export const TEMPLATES: { key: TemplateKey; label: string; build: (b: BookingForTemplate, extra?: { galleryUrl?: string }) => string }[] = [
  {
    key: "confirmed",
    label: "Booking confirmed",
    build: (b) => `Hi ${b.client_name}! 📸\n\nYour Tann media booking is confirmed:\n• Package: ${b.package_name ?? "Custom"}\n• Date: ${fmtDate(b.session_date)}${b.session_time ? ` at ${b.session_time.slice(0,5)}` : ""}\n• Total: R${Number(b.final_price ?? 0).toLocaleString()}\n\nA 50% deposit of R${Math.round(Number(b.final_price ?? 0) / 2).toLocaleString()} secures your slot.\nPay to: ${BANK}\n\nReply once paid and I'll send a confirmation receipt. See you soon!`,
  },
  {
    key: "deposit_reminder",
    label: "Awaiting deposit",
    build: (b) => `Hi ${b.client_name}, just a friendly reminder that your 50% deposit of R${Math.round(Number(b.final_price ?? 0) / 2).toLocaleString()} is still outstanding.\n\nPlease pay to ${BANK} to secure your booking for ${fmtDate(b.session_date)}.\n\nLet me know once done — thanks! ☺️`,
  },
  {
    key: "shoot_reminder",
    label: "Shoot reminder",
    build: (b) => `Hi ${b.client_name}! Just a reminder that your Tann media session is tomorrow, ${fmtDate(b.session_date)}${b.session_time ? ` at ${b.session_time.slice(0,5)}` : ""}. \n\nWear what makes you feel best, and message me if anything changes. See you then! 📸`,
  },
  {
    key: "gallery_ready",
    label: "Gallery ready",
    build: (b, extra) => `Hi ${b.client_name}! 🎉\n\nYour photos from your ${b.package_name ?? "session"} are ready to view.\n\nOpen your gallery here: ${extra?.galleryUrl ?? "https://tannmedia.com/dashboard"}\n\nLet me know what you think — and feel free to share!`,
  },
  {
    key: "thank_you",
    label: "Thank you + review request",
    build: (b) => `Hi ${b.client_name}! Thank you so much for trusting Tann media with your ${b.package_name ?? "session"}. 💛\n\nIf you have 30 seconds, I'd love a quick review here:\nhttps://tannmedia.com/review/{BOOKING_ID}\n\nReferrals mean the world — thanks again!`,
  },
];

export function waLink(phone: string | null | undefined, message: string): string {
  const cleaned = (phone ?? "").replace(/\D/g, "");
  const number = cleaned.startsWith("27") ? cleaned : cleaned.startsWith("0") ? "27" + cleaned.slice(1) : cleaned;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
