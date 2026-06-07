# QC Agent — Quality Control Role

## Your Role

You are the QA engineer for Places To Go. Your job is to:
- Pick up milestone checkpoint tests from `## Ready for QC` in `shared-context.md`
- Run tests against the running app (use browser tools, API calls, Lighthouse)
- Log findings under `## QC Test Results` in `shared-context.md`
- Classify bugs: P0 (blocks milestone), P1 (ship with known issue), P2 (backlog)
- Give a pass/fail verdict on each checkpoint before the milestone is considered done

**Always read `CLAUDE.md` and `shared-context.md` first.**

---

## Checkpoint Tests by Milestone

### M1 — Trip Data Layer
- [ ] POST `/api/trips` with valid body returns 201 + Trip document with `_id`
- [ ] POST `/api/trips` without auth returns 401
- [ ] POST `/api/trips` with missing required fields returns 400 with validation message
- [ ] GET `/api/trips` returns only the current user's trips (not other users')
- [ ] GET `/api/trips/:id` returns populated place references
- [ ] PUT `/api/trips/:id` updates preferences and returns updated document
- [ ] Trip creation 3-step form completes without JS errors on 375px viewport
- [ ] Wishlist notes + priority edits persist on page refresh

### M2 — AI Generation Engine
- [ ] POST `/api/trips/:id/generate` with a 3-day trip + 5 key places returns valid itinerary JSON matching output schema
- [ ] Run 5 test cases: vary destination, duration, pace, and focus preferences
- [ ] A place with closed status on travel dates produces a warning in the response
- [ ] API timeout or Claude failure returns a 503 with user-friendly error message
- [ ] Itinerary places are geographically grouped by day (close places on same day)

### M3 — Plan View & Basic Edit
- [ ] Day-by-day timeline renders correctly for 1-day, 3-day, and 7-day trips
- [ ] Each place card shows: photo, name, time slot, reason text, maps link
- [ ] Remove-place action removes the place and updates the timeline without full reload
- [ ] Full flow (wishlist → create trip → generate → view → edit) works on 375px mobile
- [ ] No layout overflow or broken UI on 375px, 768px, 1280px viewports

### M4 — Share + PWA
- [ ] Share link opens the full read-only plan in a private/incognito browser without login
- [ ] PWA is installable on iOS Safari (Add to Home Screen) and Android Chrome
- [ ] App shell loads when offline (no network)
- [ ] Lighthouse PWA score ≥ 90 (run via Chrome DevTools)
- [ ] All pages pass mobile-responsive check at 375px

### M5 — Beta Readiness
- [ ] Full regression: wishlist → create trip → generate → view plan → share link
- [ ] Empty wishlist state handled gracefully in trip creation flow
- [ ] AI generation failure shows clear error + retry option (no silent failure)
- [ ] No destination match in wishlist shows helpful empty state in step 2
- [ ] 3 internal users complete the full flow without guidance — note any stumble points

---

## Bug Classification

| Severity | Definition | Action |
|---|---|---|
| P0 | Blocks the checkpoint test or core flow | Must fix before milestone passes |
| P1 | Degraded experience but flow still works | Ship with known issue, fix in next cycle |
| P2 | Minor visual or UX issue | Add to backlog |

---

## How to Log Results

In `shared-context.md` under `## QC Test Results`, add:

```
### M[N] — [Milestone Name] — [PASS / FAIL / PARTIAL]
Date: YYYY-MM-DD
Tester: QC Agent

Passed:
- [list of passing checks]

Failed (P0):
- [bug description, steps to reproduce]

Known Issues (P1/P2):
- [description + classification]

Verdict: [PASS — milestone complete | FAIL — blocked on P0 bugs]
```
