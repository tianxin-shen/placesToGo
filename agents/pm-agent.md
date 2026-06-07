# PM Agent — Product Manager Role

## Your Role

You are the Product Manager for Places To Go. Your job is to:
- Own the product spec and keep it current as features ship
- Break down milestones into actionable stories for the SDE agent
- Update `shared-context.md` when features complete or decisions are made
- Raise open questions and flag scope creep
- Write specs for new features in `specs/feature-NNN-name.md`

**Always read [`shared-context.md`](shared-context.md) first** — it tells you the current milestone, what's done, and what decisions have been locked.

**Never implement code.** If you identify a technical decision that needs the SDE agent, write it as an open question in `shared-context.md`.

---

## How to Hand Off to SDE Agent

When a feature is ready to implement, write a ticket in `shared-context.md` under `## Ready for SDE` with:
- Feature name
- Acceptance criteria (Given/When/Then)
- Link to the spec if one exists in `specs/`
- Any design constraints or API contracts

---

## How to Hand Off to QC Agent

When a milestone is ready for testing, add it to `shared-context.md` under `## Ready for QC` with:
- Milestone name
- What was built
- The checkpoint test criteria from the product spec below

---

---

# Places To Go — MVP Product Spec
**Single-user Trip Planning PWA**
*Version 1.0 | June 2026*

---

## Problem Statement

Travelers discover places they want to visit scattered across TikTok, Instagram, and Google Maps, but have no single place to organize them into a real trip. When it's time to plan, they spend hours manually grouping places by location, checking open hours, figuring out routing, and building a day-by-day schedule — work that is repetitive and could be automated. The cost of not solving this is that people either abandon trip planning entirely or produce a loose plan that doesn't survive contact with reality.

---

## Goals

1. A user can go from a saved wishlist to a shareable, day-by-day itinerary in under 10 minutes
2. The AI-generated plan is accepted as-is (no edits needed) at least 60% of the time in early user testing
3. PWA installability — app passes Lighthouse PWA audit (installable, offline shell, mobile-responsive)
4. Core wishlist → plan flow works end-to-end on mobile viewport without degradation
5. A generated plan can be shared via a public link (read-only) without the recipient needing an account

---

## Non-Goals (MVP)

| Out of Scope | Why |
|---|---|
| Group trip planning / multi-user collaboration | Adds significant auth/state complexity; single-user first validates core AI loop |
| In-app flights/hotels booking | Users have existing platforms; integration cost outweighs value at this scale |
| In-visiting mode (live navigation, nearby suggestions) | Separate use context; needs mobile GPS, distinct UX |
| Post-trip cost splitting / memory sharing | Post-MVP; validate planning experience first |
| Native iOS/Android apps | PWA covers mobile MVP; native only if PWA proves insufficient |
| Social/discovery feed | Explore page exists; social features are a separate product surface |

---

## User Stories

### Wishlist Management
- As a user, I want to save a place from the Explore page to my wishlist so I can keep track of places I want to visit
- As a user, I want to see my wishlist organized by destination so I can understand what I've saved per location
- As a user, I want to add notes and a priority to a saved place so I can capture why I wanted to go there
- As a user, I want to remove a place from my wishlist so I can keep it tidy

### Trip Creation
- As a user, I want to start a new trip by entering a destination, travel dates, and number of travelers so the AI has enough context to plan
- As a user, I want to select which wishlist places must be included in my trip so the itinerary is built around what matters most to me
- As a user, I want to set preferences (pace: relaxed/moderate/packed; focus: outdoor/food/culture/mix) so the plan reflects my travel style

### AI Plan Generation
- As a user, I want the app to generate a day-by-day itinerary automatically so I don't have to manually slot places into days
- As a user, I want the AI to fill gaps with relevant suggestions from my wishlist (and similar places) so every day feels full but not exhausting
- As a user, I want to see a brief explanation of why each place was included on each day so I trust the plan
- As a user, I want the app to warn me if a selected place is closed on my travel dates so I can swap it out

### Plan Review & Edit
- As a user, I want to view my itinerary as a day-by-day timeline so I can see the flow of each day
- As a user, I want to drag-and-drop places between days so I can adjust the plan without starting over
- As a user, I want to remove a place from the plan and have the day rebalanced so the schedule stays coherent
- As a user, I want to add a place from my wishlist to a specific day post-generation

### Share
- As a user, I want to generate a shareable read-only link to my trip so I can send it to travel companions
- As a recipient, I want to view the full trip plan without signing in so I can see the itinerary immediately

---

## Requirements

### P0 — Must Have

**Wishlist**
- [ ] Add/remove places from wishlist (already ~60% built — needs priority + notes editing UI)
- [ ] Wishlist grouped by destination, sortable by priority
- [ ] Place detail view (name, photo, hours, address, maps link)

**Trip Model (backend)**
- [ ] `Trip` schema: destination, dates, traveler count, preferences, status (`draft`/`published`), places (key + AI-filled), share token
- [ ] CRUD routes for trips
- [ ] Association: user → trips, trip → places

**Trip Creation Flow**
- [ ] Step 1: Destination + dates + traveler count
- [ ] Step 2: Select key places from wishlist (multi-select, filtered by destination)
- [ ] Step 3: Set pace + focus preferences
- [ ] Confirmation before triggering AI generation

**AI Generation**
- [ ] Backend route: trip inputs + selected places + wishlist context → Claude API → structured itinerary JSON
- [ ] Prompt respects key places, fills with wishlist/nearby suggestions, groups by geo proximity per day
- [ ] Conflict detection: flag places closed on travel dates
- [ ] Output schema: `{ days: [{ date, places: [{ placeId, startTime, duration, reason, travelTime }] }] }`

**Plan View**
- [ ] Day-by-day timeline (mobile-first)
- [ ] Place cards: photo, time slot, reason snippet, maps link
- [ ] Remove-place-from-day action

**Share**
- [ ] Unique share token on plan publish
- [ ] Public `/trip/:shareToken` route — read-only, no auth required
- [ ] Share link copy button

**PWA**
- [ ] Web app manifest
- [ ] Service worker with offline shell
- [ ] Mobile-responsive across all pages
- [ ] Lighthouse PWA score ≥ 90

---

### P1 — Nice to Have

- Drag-and-drop reordering of places within/between days
- Add a wishlist place to a specific day post-generation
- "Regenerate day" — re-run AI for one day only
- Map view of itinerary (Google Maps embed, route overlay)
- Estimated transit time between consecutive places
- Plan PDF export

---

### P2 — Future (design to support, don't build now)

- Group/collaborative planning
- In-visiting mode (live GPS, check-in, rerouting)
- Post-trip: cost log, photo memories
- AI chat for iterative refinement
- Wishlist import from Google Maps

---

## Milestones

### Milestone 1 — Trip Data Layer
Trip model + creation flow, no AI yet.
- `Trip` backend model + CRUD API
- New Trip creation flow (3 steps)
- Wishlist UI polish (notes + priority editing)
- **Checkpoint:** Can a logged-in user create a trip with selected places and preferences saved to DB?

### Milestone 2 — AI Generation Engine
- Backend AI route (Claude API)
- Prompt design + structured output schema
- Opening hours conflict detection
- Loading state + error handling
- **Checkpoint:** 3-day trip with 5 selected places returns valid day-by-day JSON. Run 5 manual test cases.

### Milestone 3 — Plan View & Basic Edit
- Day-by-day timeline UI (mobile-first)
- Place cards with photo, time, reason, maps link
- Remove-place-from-day action
- **Checkpoint:** Full flow (create → generate → view → edit) on 375px mobile viewport.

### Milestone 4 — Share + PWA
- Share token + public trip route
- Web manifest + service worker
- Mobile responsiveness audit
- Lighthouse PWA ≥ 90
- **Checkpoint:** PWA installable on iOS Safari + Android Chrome. Share link opens in incognito.

### Milestone 5 — QA & Beta
- Full regression: wishlist → create → generate → view → share
- Error states: empty wishlist, AI failure, no matching places
- **Checkpoint:** 3 internal users complete full flow independently. Qualitative feedback collected.

---

## Open Questions

| Question | Owner | Blocking? |
|---|---|---|
| Claude model for generation (Haiku vs Sonnet — cost vs quality) | Engineering | Yes, before M2 |
| Rate limiting on AI generation (per user per day?) | Engineering | Yes, before M2 |
| Fill places source: user wishlist only, or also Google Places search? | Product | Yes, before M2 |
| Offline plan cache strategy (cache last-viewed plan?) | Engineering | No, resolve during M4 |
| Freemium gate on AI generation in MVP? | Product | No, ship free first |

---

## Success Metrics

**Leading (check at M5 beta):**
- Trip creation completion rate: >70%
- AI plan acceptance rate (no edits): >60%
- Share link generation: >40% of completed trips

**Lagging (4 weeks post-launch):**
- D7 retention: >30% of users who generated a plan
- PWA install rate: >15% of mobile users
