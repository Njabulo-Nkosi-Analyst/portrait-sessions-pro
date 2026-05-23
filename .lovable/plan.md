## Build plan — 5 sections, sequenced across 3 turns

Given the scope, I'll ship in three focused turns so each piece is testable before the next.

### Turn 1 — Foundation: DB + Sections 3 & 4 (this turn)

**Database migration** adds the tables/columns everything else needs:
- `packages.video_url` (text) — for category video hero
- `hero_images.video_url` (text, nullable) — videos can replace images on hero too
- `bookings` table — confirmed inquiries become bookings; tracks `confirmed_at`, `package_price`, `discount_amount`, `discount_reason`, `final_price`, `status` (confirmed/completed/cancelled)
- `booking_expenses` table — per-booking line items: `type` (petrol/wage/other), `km`, `rate_per_km`, `amount`, `note`
- `quotes` table — for the instant quote calculator (Section 5)
- `client_gallery_access` table — token-based private gallery links (Section 5)
- `reviews` table — collected from gallery portal
- `notifications` table — admin notification feed
- `availability_blocks` table — for self-booking calendar
- RLS policies on all new tables

**Section 3 — Booking Confirmation** (`admin.tsx`):
- "Confirm Booking" button on each new/contacted inquiry → opens dialog
- Dialog: confirms package price, optional discount amount + reason
- On confirm: creates `bookings` row, sets inquiry status to "booked"
- New KPI: **Discount Impact** (total discounts given, % of gross revenue lost)
- KPIs auto-recalc from bookings table (revenue uses `final_price` not package list price)

**Section 4 — Finance Tracker** (new component, embedded in admin bookings tab):
- Each confirmed booking gets an expandable "Finances" panel:
  - **Petrol**: km input + rate/km (default R2.50) → auto-calc amount
  - **Wages**: assistant name + amount per booking
  - **Other costs**: free-form line items
- Live calculation: `Money Left = final_price - sum(expenses)`
- Big highlighted "Money Left After This Booking" card per booking
- New admin KPI: **Net Profit (30d)**, **Avg Margin %**, **Top Expense Category**

### Turn 2 — Sections 1 & 2

**Section 1 — Categories video hero + favourites**:
- Admin: video URL field per package (YouTube/Vimeo/MP4 link)
- Gallery: tab switcher per category — Photos | Video
- Heart button on each gallery image → saves to `localStorage` favourites
- New `/favourites` route showing saved items with "Book a shoot like this" CTA

**Section 2 — Pages & Contact polish**:
- Unified visual language across Gallery, Pricing, Contact (shared section header component)
- Contact redesign: split layout (form left, trust column right with badges: "24h response", "150+ shoots", "5★ rated", payment icons)
- Animated "Response time: ~2 hours" indicator on contact page
- Sticky "Book Now" bar on mobile across all pages

### Turn 3 — Section 5 Premium features

- **Self-booking calendar**: `/book` route with date picker showing `availability_blocks`; client picks slot + package → creates pending booking
- **Instant quote calculator**: `/quote` route — type, hours, location, extras → instant price
- **Private client gallery portal**: `/gallery/$token` route — clients view their shoot, download, leave review
- **Admin notifications center**: bell icon in admin navbar with unread count; new inquiries/bookings/reviews appear here

### Technical notes
- All money in ZAR (R), stored as `numeric(10,2)`
- Bookings derived from inquiries via FK `inquiry_id` (nullable for direct bookings via self-booking)
- Finance calculations done client-side from `booking_expenses` rows (no triggers)
- Notifications via Supabase realtime channel on `notifications` table
- Video URLs: support YouTube/Vimeo embeds (detected by URL) + direct MP4 fallback via `<video>` tag

Starting Turn 1 once you approve.