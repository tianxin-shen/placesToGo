# Shared Context — Decisions Log & Project State

> This is the message bus. All agents read and write here.
> PM updates milestones and decisions. SDE marks features complete. QC logs test results.
> Keep entries dated. Never delete — strike through outdated entries instead.

---

## Current Milestone

**Active: Milestone 1 — Trip Data Layer**
Target: Trip model + creation flow wired end-to-end (no AI yet)

---

## Milestone Status

| Milestone | Status | Notes |
|---|---|---|
| M1 — Trip Data Layer | 🟡 In Progress | Starting now |
| M2 — AI Generation Engine | ⬜ Not Started | Blocked on M1 |
| M3 — Plan View & Basic Edit | ⬜ Not Started | |
| M4 — Share + PWA | ⬜ Not Started | |
| M5 — QA & Beta | ⬜ Not Started | |

---

## Locked Decisions

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-07 | Single-user only for MVP | Group planning adds significant auth/state complexity; validate AI loop first |
| 2026-06-07 | PWA not native app | Faster to ship; native only if PWA proves insufficient post-MVP |
| 2026-06-07 | No flights/hotels booking in-app | Users have existing platforms (Expedia, Priceline); integration cost too high for v1 |
| 2026-06-07 | AI model = Claude API (Anthropic) | Already in stack; best quality for itinerary generation |
| 2026-06-07 | MongoDB stays (no migration) | Existing User/Place/WantToGo models are solid; Trip model will follow same pattern |

---

## Open Questions (unresolved)

| Question | Owner | Blocking | Added |
|---|---|---|---|
| Claude model: Haiku (fast/cheap) vs Sonnet (quality)? | SDE + PM | Yes — before M2 | 2026-06-07 |
| Rate limit AI generation? (per user per day cap?) | SDE | Yes — before M2 | 2026-06-07 |
| Fill places source: wishlist only, or also Google Places API search? | PM | Yes — before M2 | 2026-06-07 |
| Offline cache strategy for plan view (cache last-viewed plan?) | SDE | No — resolve in M4 | 2026-06-07 |
| Freemium gate on AI generation in MVP? | PM | No — ship free, gate later | 2026-06-07 |

---

## P0 Requirements Tracker

### Wishlist (Feature: WantToGo)
- [x] Add place to wishlist
- [x] Remove place from wishlist
- [x] Wishlist grouped by location
- [ ] Notes editing UI on saved place
- [ ] Priority editing UI on saved place
- [ ] Wishlist sortable by priority

### Trip Model — Backend
- [ ] `Trip` Mongoose schema (destination, dates, travelerCount, preferences, status, itinerary, shareToken)
- [ ] `POST /api/trips` — create trip
- [ ] `GET /api/trips` — list user's trips
- [ ] `GET /api/trips/:id` — get trip detail
- [ ] `PUT /api/trips/:id` — update trip
- [ ] `DELETE /api/trips/:id` — delete trip
- [ ] User → Trip association (userId on Trip)

### Trip Creation Flow — Frontend
- [ ] Step 1 page: destination input + date range picker + traveler count
- [ ] Step 2 page: multi-select places from wishlist (filtered to matching destination)
- [ ] Step 3 page: pace preference (relaxed/moderate/packed) + focus (outdoor/food/culture/mix)
- [ ] Confirmation screen before AI generation
- [ ] Route: `/trips/new` (multi-step)

### AI Generation — Backend
- [ ] `POST /api/trips/:id/generate` route
- [ ] Claude API integration (prompt engineering)
- [ ] Structured itinerary output schema validated
- [ ] Opening hours conflict detection
- [ ] Error handling (API failure, timeout, malformed response)

### Plan View — Frontend
- [ ] Day-by-day timeline component
- [ ] Place card component (photo, time, reason, maps link)
- [ ] Remove place from day action
- [ ] Route: `/trips/:id`

### Share
- [ ] Share token generated on `status: published`
- [ ] `GET /api/trips/share/:token` — public route, no auth
- [ ] `/trip/:shareToken` frontend route — read-only view
- [ ] Copy share link button

### PWA
- [ ] `manifest.json` (name, icons, theme, display: standalone)
- [ ] Service worker registered
- [ ] Offline shell (app loads without network)
- [ ] All pages mobile-responsive (375px)
- [ ] Lighthouse PWA ≥ 90

---

## Ready for SDE

*(PM writes tickets here when features are ready to implement)*

### [M1] Trip Backend Model + CRUD Routes
**Priority:** P0 — blocks everything
**Acceptance criteria:**
- Given a logged-in user, when they POST `/api/trips` with `{ destination, startDate, endDate, travelerCount, preferences, keyPlaceIds }`, then a Trip document is created and returned with a generated `_id`
- Given a trip exists, GET `/api/trips/:id` returns the full trip including populated place references
- Given a trip exists, PUT `/api/trips/:id` updates mutable fields (preferences, status, itinerary)
- Trip schema must include: `userId`, `destination` (string), `startDate`, `endDate`, `travelerCount` (number), `preferences` `{ pace: enum, focus: enum[] }`, `status` (`draft`|`published`), `itinerary` (array, populated by AI step), `shareToken` (string, generated on publish), timestamps

### [M1] Trip Creation Flow — Frontend (3-step form)
**Priority:** P0
**Route:** `/trips/new`
**Acceptance criteria:**
- Step 1: User inputs destination (text), date range (start + end date pickers), traveler count (number input). All three required before proceeding.
- Step 2: Shows wishlist places filtered to match destination string. User can multi-select. At least 1 required.
- Step 3: Pace selector (relaxed / moderate / packed) and focus multi-select (outdoor / food / culture / mix).
- Confirmation screen shows summary of all inputs with "Generate Plan" CTA.
- On submit, POSTs to `/api/trips`, then navigates to `/trips/:id` (plan view, loading state while AI generates).

### [M1] Wishlist UI — Notes + Priority Editing
**Priority:** P0 (small, polish existing feature)
**Acceptance criteria:**
- Each place card in WantToGo page has an edit action
- Edit opens inline or modal: notes (textarea) + priority (1–5 star or number selector)
- Save calls `PUT /api/wantToGo/:placeId` and updates UI without full page reload
- Priority is visually indicated on the card

---

## Ready for QC

*(PM writes checkpoint tests here when a milestone is code-complete)*

*(nothing yet)*

---

## QC Test Results

*(QC agent logs findings here)*

*(nothing yet)*

---

## Completed Features

*(SDE marks items here when merged and deployed)*

*(nothing yet)*

---

## Iteration Log

| Date | What Changed | Who |
|---|---|---|
| 2026-06-07 | Project spec finalized, agent system initialized | PM |
| 2026-06-07 | Milestone 1 kicked off, M1 SDE tickets written | PM |
