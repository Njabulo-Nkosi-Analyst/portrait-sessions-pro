
# Trope Photography — Major Upgrade Plan

This is a large, multi-feature build. I'll do it in clearly separated phases so you can review progress at each stage. Total estimated scope: ~15 new/modified files, 1 large DB migration, 2 new Storage buckets.

---

## Phase 1 — Database & Storage Foundation

One migration adding all schema changes + RLS:

- `packages`: add `media_url`, `media_type`, `sort_order` (exists), `category_sort_order`
- `bookings`: add `deposit_status`, `deposit_received_at`, `fully_paid_at`, `promo_code`, `promo_discount`
- New `promo_codes` table + RLS (anon SELECT active codes, admin full)
- New `client_galleries` table + RLS (owner read, admin full)
- `site_settings`: seed `working_days` + `default_slots` keys
- Helper SQL function `get_booked_slots(date)` returning booked time strings (derived from `bookings`, status IN pending/confirmed/completed)
- Enable Realtime on `bookings` for client slot updates
- Storage buckets: `package-media` (public), `client-galleries` (private, RLS by booking owner)

## Phase 2 — Admin Pricing Table (Section 1)

New component `AdminPackagesTable.tsx` inside admin dashboard Packages tab:

- Grouped by category with section dividers
- Inline-editable cells (click-to-edit pattern using contentEditable-style inputs)
- Add Row / Duplicate / Delete (with confirm) / Drag handle (using `@dnd-kit/sortable`)
- Popular + Active toggles
- Media upload cell → uploads to `package-media/{package-id}` bucket, shows thumb or video preview
- Per-row Save + bulk "Save all"
- Search/filter bar
- "Add new category" modal (categories live as distinct `category` text values; ordering via `category_sort_order` on packages)
- Promo Codes mini-table under packages (Feature E admin side)

## Phase 3 — Public Pricing Page (Section 1 client-side)

Rewrite `src/routes/pricing.tsx`:

- Category sections in `category_sort_order`
- Card header shows media: image (16:9 cover) | autoplay-muted-loop video (poster on mobile) | gradient + icon fallback
- Existing popular/price/features layout preserved below media

## Phase 4 — Availability (Section 2)

Admin Availability tab gets a new `WeeklySchedulePanel` above the calendar:

- 7 day toggles + per-day default slot editor
- "Save weekly schedule" → writes to `site_settings`
- "Apply to next 60 days" → bulk inserts into `availability_blocks` for missing dates
- Monthly calendar gains dot indicators (green available, blue booked, red blocked) and greys out off-weekday columns
- Per-date override panel (preserves existing manual override behaviour)

Client booking date picker:

- Greys past, off-weekdays (via `working_days`), manually blocked, and fully-booked dates
- Time slots render as pills with three states (available/booked/selected)
- Supabase realtime subscription on `bookings` filtered by selected date to update slot states live

## Phase 5 — Growth Features

- **A. Quote Calculator** — new `<QuoteCalculator />` component, embedded on home (between featured work + testimonials) and as `/quote` route
- **B. Review Portal** — public route `/review/$bookingId`, no auth, writes to `testimonials` with `is_approved=false` and links `booking_id`
- **C. Client Galleries** — admin "Client Galleries" sub-tab in admin Gallery tab + "My Gallery" tab in user dashboard; download-all via `jszip`
- **D. Deposit Tracking** — booking card buttons + 2 KPI cards in admin Overview
- **E. Promo Codes** — collapsible field in booking flow step 2, validates against `promo_codes`, updates running total, increments `uses_count` on booking save
- **F. WhatsApp Templates** — "Message client" dropdown per booking card; preview modal with editable text; opens `wa.me/<phone>?text=<encoded>`

## Phase 6 — QA & Verification

- Run linter, check build, verify routes register, test one booking → slot lock end-to-end
- Add `testimonials.booking_id` column if missing (used by review portal)

---

## Technical Notes

- Storage RLS: `package-media` public-read, admin-write. `client-galleries` private; SELECT policy joins `bookings.user_id = auth.uid()`.
- All new tables get explicit `GRANT` statements per project rules.
- New deps: `@dnd-kit/core`, `@dnd-kit/sortable`, `jszip`, `file-saver` (small, edge-safe).
- The uploaded PDF (`temp_1780865125590-compressed.pdf`) isn't referenced in the spec — I'll ignore it unless you want it used somewhere.

---

## Order of Execution

1. Migration (you approve before it runs)
2. Storage buckets
3. Code in phases 2 → 5
4. Final QA pass

This will take multiple turns. Shall I start with the migration?
