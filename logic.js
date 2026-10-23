/* =====================================================================
   Shaadi — Winter Wedding Planner & Venue Finder
   logic.js — the LOGIC layer (pure functions: no DOM, no network)

   Every function here is "pure": same input -> same output, no side
   effects. That is what makes them unit-testable in test.js.
   ===================================================================== */

var SH = SH || {};

/* ------------------------------------------------------------------
   Venue helpers
------------------------------------------------------------------ */

/**
 * Filter venues by optional criteria.
 * filters: { city, maxPerHead, minCapacity } — any may be omitted.
 */
SH.filterVenues = function (venues, filters) {
  filters = filters || {};
  return venues.filter(function (v) {
    if (filters.city && v.city !== filters.city) return false;
    if (filters.maxPerHead != null && v.perHeadCatering > filters.maxPerHead) return false;
    if (filters.minCapacity != null && v.capacity < filters.minCapacity) return false;
    return true;
  });
};

/**
 * Total catering bill for a venue at a given guest count.
 * Math: per-head rate x guests (venue hire is assumed included here).
 */
SH.venueTotalCost = function (venue, guests) {
  guests = Math.max(0, Math.floor(Number(guests) || 0));
  return venue.perHeadCatering * guests;
};

/* ------------------------------------------------------------------
   Budget math
------------------------------------------------------------------ */

/**
 * Cost of ONE event: catering for the guest count + decor + everything
 * else (sound, lighting, transport, tips...).
 */
SH.eventCost = function (event) {
  var guests = Math.max(0, Number(event.guests) || 0);
  var perHead = Math.max(0, Number(event.perHead) || 0);
  var decor = Math.max(0, Number(event.decor) || 0);
  var other = Math.max(0, Number(event.other) || 0);
  return guests * perHead + decor + other;
};

/** Combined cost of several events (e.g. Mehndi + Baraat + Walima). */
SH.totalAcrossEvents = function (events) {
  return events.reduce(function (sum, e) {
    return sum + SH.eventCost(e);
  }, 0);
};

/**
 * Debt-risk meter: compares the total wedding cost against what the
 * family actually has (savings + family contribution).
 * ratio = totalCost / (savings + contribution)
 *   <= 0.80  -> "safe"    (comfortable buffer)
 *   <= 1.00  -> "tight"   (spends everything, no buffer)
 *   <= 1.50  -> "risky"   (borrowing likely)
 *   >  1.50  -> "danger"  (heavy debt)
 */
SH.debtRiskMeter = function (input) {
  var totalCost = Math.max(0, Number(input.totalCost) || 0);
  var savings = Math.max(0, Number(input.savings) || 0);
  var contribution = Math.max(0, Number(input.familyContribution) || 0);
  var available = savings + contribution;

  var ratio;
  if (available <= 0) {
    // No money available at all: any cost means borrowing everything.
    ratio = totalCost > 0 ? Infinity : 0;
  } else {
    ratio = totalCost / available;
  }

  var level, message;
  if (ratio <= 0.8) {
    level = "safe";
    message = "Within your means — a healthy buffer remains after the wedding.";
  } else if (ratio <= 1.0) {
    level = "tight";
    message = "Affordable but tight — the wedding uses nearly all available funds.";
  } else if (ratio <= 1.5) {
    level = "risky";
    message = "You would likely need to borrow. Consider trimming the guest list or decor.";
  } else {
    level = "danger";
    message = "Serious debt risk. This budget needs a rethink before any booking.";
  }

  return { ratio: ratio, level: level, message: message };
};

/* ------------------------------------------------------------------
   Guest-list math
------------------------------------------------------------------ */

/**
 * Summarise RSVPs. Each guest: { name, side, rsvp } where rsvp is one
 * of "confirmed" | "pending" | "declined". Unknown RSVPs count as pending.
 */
SH.rsvpSummary = function (guests) {
  var s = { invited: 0, confirmed: 0, pending: 0, declined: 0 };
  guests.forEach(function (g) {
    s.invited += 1;
    if (g.rsvp === "confirmed") s.confirmed += 1;
    else if (g.rsvp === "declined") s.declined += 1;
    else s.pending += 1;
  });
  return s;
};

/**
 * Estimated actual attendance. Rule of thumb: everyone confirmed shows
 * up, plus about 60% of the maybes. Accepts either the raw guest array
 * or a summary object from rsvpSummary().
 */
SH.estimatedAttendance = function (guestsOrSummary) {
  var s = Array.isArray(guestsOrSummary)
    ? SH.rsvpSummary(guestsOrSummary)
    : guestsOrSummary;
  return Math.round(s.confirmed + 0.6 * s.pending);
};

/* ------------------------------------------------------------------
   Escrow deposit math (the anti-fraud feature)
------------------------------------------------------------------ */

/**
 * Advance deposit held in escrow for a vendor contract.
 * Anything above 50% advance is a red flag — warn loudly.
 */
SH.escrowDeposit = function (contractValue, pct) {
  var value = Math.max(0, Number(contractValue) || 0);
  var percent = Math.max(0, Number(pct) || 0);
  var amount = Math.round((value * percent) / 100);
  var warning =
    percent > 50
      ? "Over 50% advance is a common fraud pattern. Insist on a written agreement and smaller staged payments."
      : null;
  return { amount: amount, warning: warning };
};

/** Receipt numbers look like "SH-2026-4821". */
SH.receiptNo = function () {
  var digits = Math.floor(1000 + Math.random() * 9000); // 1000..9999
  return "SH-2026-" + digits;
};

/* ------------------------------------------------------------------
   Scam-spotter
------------------------------------------------------------------ */

/**
 * Score a vendor 0-100 (lower = riskier). Starts at 100, minus 30 per
 * red flag. HONESTY: this is a design demonstration of a checklist —
 * it is NOT real verification of any business.
 */
SH.scoreVendor = function (vendor) {
  var flags = [];

  if (vendor.advancePct > 50) {
    flags.push("Demands over 50% advance");
  }
  if (!vendor.hasWrittenAgreement) {
    flags.push("No written agreement offered");
  }
  if (vendor.pressureTactic) {
    flags.push("'Today only' pressure tactic");
  }
  if (!vendor.verified) {
    flags.push("Not a verified vendor");
  }

  var score = Math.max(0, 100 - flags.length * 30); // clamp: never below 0
  return { score: score, flags: flags };
};

/* ------------------------------------------------------------------
   Formatting
------------------------------------------------------------------ */

/** formatPKR(1250000) -> "Rs 1,250,000" (Pakistani digit grouping). */
SH.formatPKR = function (n) {
  var num = Math.round(Number(n) || 0);
  return "Rs " + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Node compatibility: `require("./logic.js")` returns the SH object
// (merged with data.js when both are required — same pattern).
if (typeof module !== "undefined" && module.exports) {
  module.exports = SH;
}
