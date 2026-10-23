# Shaadi — Winter Wedding Planner & Venue Finder

A mobile-first UX concept website for planning a Pakistani winter wedding (Nov–Feb) on a tight budget — venue comparison, 3-event budget planning with a debt-risk meter, guest RSVP tracking, escrow-protected vendor booking, and a scam-spotter checklist.

**Live demo:** https://abbasmomand98-jpg.github.io/shaadi-wedding-planner/
**Repo:** https://github.com/abbasmomand98-jpg/shaadi-wedding-planner

## The design story

Winter is peak shaadi season in Pakistan, and it is also peak financial stress season. Families take on debt because marquee prices are opaque and negotiable in person only, catering per-head rates stay hidden until after the event (Rs 1,800–4,500/head), "token" advances paid to photographers or decorators sometimes vanish with the vendor, guest lists are chaos, and nobody tracks one budget across the three events — Mehndi, Baraat, Walima.

Shaadi is designed for the persona living this: a father or elder brother in Peshawar or Lahore planning a December wedding on a tight budget. Every screen answers one anxious question: *"Can we afford this, and will we get scammed?"*

## How it works

The app is a single page with a bottom tab bar (5 tabs). Open `index.html` in any browser — no build step, no server, no network calls.

**Venues tab** — A filterable directory of sample venues across Lahore, Karachi, Islamabad, Peshawar and Rawalpindi. Filter by city, minimum capacity, and a max per-head catering slider (Rs 1,800–4,500). Tapping a venue opens a detail card: type "500" guests and it shows the catering math (`per-head × guests`) plus a winter-season note like *"Dec peak: +20% weekend surcharge."*

**Budget tab** — Three event sub-tabs (Mehndi / Baraat / Walima). Each event has inputs for guests, per-head rate, decor, and other costs, with a live per-event total. Below, enter family savings + family contribution and a debt-risk meter shows the combined 3-event bill as a percentage of available funds: **safe** (≤80%), **tight** (≤100%), **risky** (≤150%), **danger** (>150%) — with plain-language advice.

**Guests tab** — Add guests with name, family side (bride/groom), and RSVP status. Summary chips show invited / confirmed / pending / declined, plus an estimated attendance figure (confirmed + ~60% of pending). The list persists in `localStorage`, so it survives a page refresh.

**Vendors tab** — A sample vendor directory (photographers, decorators, caterers, makeup artists, sound, videographers) filterable by category. "Book with escrow" opens a booking card: enter the contract value and the advance % the vendor demands. If the advance is over 50%, a loud warning appears (over-50% advances are a classic fraud pattern). "Confirm deposit" generates a receipt (`SH-2026-XXXX`) saved to `localStorage` and listed under "My receipts".

**Scam-spotter tab** — Pick any vendor and run a red-flag check: demands over 50% advance, no written agreement offered, "today only" pressure tactics, unverified status. Each flag costs 30 points off a 100-point trust score. It is a checklist demonstration, not real verification.

## Project structure

```
index.html   — semantic structure: header, 5 tab panels, bottom nav, footer
style.css    — the whole visual system (cream + one maroon accent)
data.js      — sample venues & vendors (works in browser AND Node)
logic.js     — pure functions: filtering, budget math, scoring (no DOM)
app.js       — DOM wiring only: calls logic.js, renders into index.html
test.js      — 89-assertion smoke test (node test.js)
check_ids.js — verifies every ID used in app.js exists in index.html
```

## What you can learn from this project

**1. Separate data, logic, and DOM.** `data.js` only holds arrays. `logic.js` only holds pure functions — give them inputs, they return outputs, they never touch the page. `app.js` only wires the page: it reads inputs, calls `SH.*` functions, and writes HTML. When a bug appears, you instantly know which file to open.

**2. Pure functions are testable functions.** Because `logic.js` never touches `document` or `localStorage`, `test.js` can `require()` it in Node and assert on real behavior — 89 assertions covering every meter level, boundary values (exactly 0.8, 1.0, 1.5), rounding, and receipt formats. Try breaking a function and watch the test catch it.

**3. One module pattern for browser + Node.** Each file starts with `var SH = SH || {};`, attaches its pieces (`SH.venues = [...]`), and ends with:
```js
if (typeof module !== "undefined" && module.exports) { module.exports = SH; }
```
In the browser the scripts load in order and share the global `SH`; in Node, `require()` gets the same object. No bundler needed.

**4. localStorage persistence in ~10 lines.** Guests and receipts use a tiny `loadJSON`/`saveJSON` pair with try/catch (private-mode browsers can block storage — the app keeps working in memory). Data is namespaced (`shaadi_guests_v1`) so future versions won't collide.

**5. Render from state, not from the DOM.** The budget tab keeps one `budgetState` object; every keystroke updates the object first, then re-renders totals and the meter. The DOM is a *reflection* of state, never the source of truth — the habit that makes UI code debuggable.

**6. Accessibility is cheap when you plan it.** Real `<button>`s, `<label for>`, `aria-label`s on icon-only tabs, and `hidden` attributes instead of `display:none` hacks. Screen readers get the same app for free.

## Sample-data honesty note

**Every venue, vendor, and price in this project is fictional sample data, invented for design demonstration.** Names carry a visible SAMPLE badge, a banner on every screen says so, and the footer repeats it. The scam-spotter is a checklist demo — it never claims real verification of any business, and no real helpline numbers are listed anywhere.

## Fork it

This pattern — *one local problem, five tabs, honest sample data, testable logic* — ports to almost anything: a Ramadan ration planner, a university admissions tracker, a small-shop inventory app. Fork the repo, swap `data.js` for your own city's realities, keep the honesty badges, and ship it. If you adapt it to your own local problem, I'd love to see what you build.
