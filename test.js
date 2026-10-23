/* =====================================================================
   Shaadi — smoke tests (run with: node test.js)
   Uses only Node's built-in `assert` — no test framework needed.
   ===================================================================== */

var assert = require("assert");
var data = require("./data.js");   // SH.venues, SH.vendors, ...
var logic = require("./logic.js"); // SH.filterVenues, SH.eventCost, ...

var passed = 0;
function t(actual, expected, msg) {
  passed += 1;
  assert.strictEqual(actual, expected, msg);
}
function tOk(cond, msg) {
  passed += 1;
  assert.ok(cond, msg);
}

/* ---------------- data.js ---------------- */

// 1. venue count in range 10-12
tOk(data.venues.length >= 10 && data.venues.length <= 12,
  "venues: expected 10-12, got " + data.venues.length);

// 2-13. every venue's per-head catering is within the honest 1800-4500 range
data.venues.forEach(function (v) {
  tOk(v.perHeadCatering >= 1800 && v.perHeadCatering <= 4500,
    "venue " + v.id + ": perHead " + v.perHeadCatering + " outside 1800-4500");
});

// 14-25. every venue name is clearly flagged as a sample
data.venues.forEach(function (v) {
  tOk(/sample/i.test(v.name), "venue " + v.id + " name missing SAMPLE flag");
});

// 26. vendor count in range 6-8
tOk(data.vendors.length >= 6 && data.vendors.length <= 8,
  "vendors: expected 6-8, got " + data.vendors.length);

// 27-34. every vendor name flagged as sample
data.vendors.forEach(function (v) {
  tOk(/sample/i.test(v.name), "vendor " + v.id + " name missing SAMPLE flag");
});

// 35. venue ids unique
var vIds = data.venues.map(function (v) { return v.id; });
t(new Set(vIds).size, vIds.length, "venue ids must be unique");

// 36. vendor ids unique
var dIds = data.vendors.map(function (v) { return v.id; });
t(new Set(dIds).size, dIds.length, "vendor ids must be unique");

/* ---------------- filterVenues ---------------- */

// 37. filter by city
t(logic.filterVenues(data.venues, { city: "Lahore" }).length, 3,
  "Lahore should have 3 venues");

// 38. filter by max per-head (<=2500: v03, v10, v11, v06 = 4)
t(logic.filterVenues(data.venues, { maxPerHead: 2500 }).length, 4,
  "maxPerHead 2500 should match 4 venues");

// 39. filter by min capacity (>=1000: v01, v04, v09 = 3)
t(logic.filterVenues(data.venues, { minCapacity: 1000 }).length, 3,
  "minCapacity 1000 should match 3 venues");

// 40. combined filters
t(logic.filterVenues(data.venues, { city: "Karachi", maxPerHead: 3200 }).length, 2,
  "Karachi + maxPerHead 3200 should match 2 venues");

// 41. filters that match nothing
t(logic.filterVenues(data.venues, { city: "Lahore", maxPerHead: 1500 }).length, 0,
  "impossible filter should return empty array");

// 42. no filters returns everything
t(logic.filterVenues(data.venues, {}).length, data.venues.length,
  "empty filters should return all venues");

// 43. omitted filters object entirely
t(logic.filterVenues(data.venues).length, data.venues.length,
  "missing filters arg should return all venues");

/* ---------------- venueTotalCost ---------------- */

// 44. basic math: 3200 x 500
t(logic.venueTotalCost({ perHeadCatering: 3200 }, 500), 1600000,
  "venueTotalCost 3200x500");

// 45. zero guests
t(logic.venueTotalCost({ perHeadCatering: 3200 }, 0), 0,
  "venueTotalCost with 0 guests");

/* ---------------- budget math ---------------- */

// 46. one event: 400 guests x 3000 + 200000 decor + 100000 other
t(logic.eventCost({ guests: 400, perHead: 3000, decor: 200000, other: 100000 }),
  1500000, "eventCost basic");

// 47. all zeros
t(logic.eventCost({ guests: 0, perHead: 0, decor: 0, other: 0 }), 0,
  "eventCost all zeros");

// 48. total across three events
t(logic.totalAcrossEvents([
  { guests: 300, perHead: 2000, decor: 150000, other: 50000 },   // 800,000
  { guests: 500, perHead: 3200, decor: 300000, other: 150000 },  // 2,050,000
  { guests: 600, perHead: 3500, decor: 350000, other: 200000 }   // 2,650,000
]), 5500000, "totalAcrossEvents = 5,500,000");

/* ---------------- debtRiskMeter ---------------- */

function levelFor(totalCost, savings, familyContribution) {
  return logic.debtRiskMeter({
    totalCost: totalCost, savings: savings, familyContribution: familyContribution
  });
}

// 49-50. safe: ratio 0.5
var m = levelFor(1000000, 1500000, 500000);
t(m.level, "safe", "ratio 0.5 -> safe");
t(m.ratio, 0.5, "ratio should be exactly 0.5");

// 51. boundary: ratio exactly 0.8 -> safe
t(levelFor(800000, 1000000, 0).level, "safe", "ratio 0.8 -> safe");

// 52. tight: ratio 0.9
t(levelFor(900000, 1000000, 0).level, "tight", "ratio 0.9 -> tight");

// 53. boundary: ratio exactly 1.0 -> tight
t(levelFor(1000000, 1000000, 0).level, "tight", "ratio 1.0 -> tight");

// 54. risky: ratio 1.2
t(levelFor(1200000, 1000000, 0).level, "risky", "ratio 1.2 -> risky");

// 55. boundary: ratio exactly 1.5 -> risky
t(levelFor(1500000, 1000000, 0).level, "risky", "ratio 1.5 -> risky");

// 56. danger: ratio 2.0
t(levelFor(2000000, 1000000, 0).level, "danger", "ratio 2.0 -> danger");

// 57. no savings at all + a real cost -> danger
t(levelFor(500000, 0, 0).level, "danger", "no funds + cost -> danger");

// 58. no cost and no funds -> safe (nothing to borrow for)
t(levelFor(0, 0, 0).level, "safe", "zero cost -> safe");

// 59. message is always a non-empty string
tOk(typeof levelFor(900000, 1000000, 0).message === "string" &&
    levelFor(900000, 1000000, 0).message.length > 0,
  "debtRiskMeter message must be non-empty");

/* ---------------- guest math ---------------- */

var guests = [
  { name: "A", side: "groom", rsvp: "confirmed" },
  { name: "B", side: "groom", rsvp: "confirmed" },
  { name: "C", side: "bride", rsvp: "confirmed" },
  { name: "D", side: "bride", rsvp: "confirmed" },
  { name: "E", side: "groom", rsvp: "confirmed" },
  { name: "F", side: "bride", rsvp: "pending" },
  { name: "G", side: "bride", rsvp: "pending" },
  { name: "H", side: "groom", rsvp: "pending" },
  { name: "I", side: "groom", rsvp: "pending" },
  { name: "J", side: "bride", rsvp: "declined" }
];
var sum = logic.rsvpSummary(guests);

// 60-63. rsvp counts
t(sum.invited, 10, "rsvpSummary invited");
t(sum.confirmed, 5, "rsvpSummary confirmed");
t(sum.pending, 4, "rsvpSummary pending");
t(sum.declined, 1, "rsvpSummary declined");

// 64. estimated attendance: 5 + 0.6*4 = 7.4 -> 7
t(logic.estimatedAttendance(guests), 7, "estimatedAttendance rounding");

// 65. estimatedAttendance also accepts a summary object
t(logic.estimatedAttendance(sum), 7, "estimatedAttendance(summary)");

// 66. all pending: 0 + 0.6*10 = 6
t(logic.estimatedAttendance([{ rsvp: "pending" }, { rsvp: "pending" },
  { rsvp: "pending" }, { rsvp: "pending" }, { rsvp: "pending" },
  { rsvp: "pending" }, { rsvp: "pending" }, { rsvp: "pending" },
  { rsvp: "pending" }, { rsvp: "pending" }]), 6,
  "estimatedAttendance all-pending");

// 67. empty list -> 0
t(logic.estimatedAttendance([]), 0, "estimatedAttendance empty");

/* ---------------- escrow ---------------- */

// 68-69. normal deposit: 30% of 1,000,000
var e1 = logic.escrowDeposit(1000000, 30);
t(e1.amount, 300000, "escrowDeposit amount");
t(e1.warning, null, "escrowDeposit no warning at 30%");

// 70-71. risky deposit: 60% of 500,000 -> warning present
var e2 = logic.escrowDeposit(500000, 60);
t(e2.amount, 300000, "escrowDeposit amount at 60%");
tOk(typeof e2.warning === "string" && e2.warning.length > 0,
  "escrowDeposit warns above 50%");

// 72. exactly 50% -> no warning (boundary)
t(logic.escrowDeposit(200000, 50).warning, null, "no warning at exactly 50%");

// 73. receipt number format
tOk(/^SH-2026-\d{4}$/.test(logic.receiptNo()), "receiptNo format #1");

// 74. receipt number format again (random each call)
tOk(/^SH-2026-\d{4}$/.test(logic.receiptNo()), "receiptNo format #2");

/* ---------------- scoreVendor ---------------- */

// 75-76. clean vendor: 100, no flags
var clean = {
  advancePct: 25, hasWrittenAgreement: true, pressureTactic: false, verified: true
};
var c = logic.scoreVendor(clean);
t(c.score, 100, "clean vendor scores 100");
t(c.flags.length, 0, "clean vendor has no flags");

// 77-81. fully risky vendor: all four flags, score clamped to 0
var risky = {
  advancePct: 70, hasWrittenAgreement: false, pressureTactic: true, verified: false
};
var r = logic.scoreVendor(risky);
t(r.score, 0, "4 flags -> score clamped to 0");
t(r.flags.length, 4, "risky vendor has 4 flags");
tOk(r.flags.indexOf("Demands over 50% advance") !== -1, "flag: high advance");
tOk(r.flags.indexOf("No written agreement offered") !== -1, "flag: no agreement");
tOk(r.flags.indexOf("'Today only' pressure tactic") !== -1, "flag: pressure");
tOk(r.flags.indexOf("Not a verified vendor") !== -1, "flag: unverified");

// 82-83. single flag: 100 - 30 = 70
var one = logic.scoreVendor({
  advancePct: 30, hasWrittenAgreement: true, pressureTactic: true, verified: true
});
t(one.score, 70, "one flag -> 70");
t(one.flags.length, 1, "one flag only");

// 84. exactly 50% advance is NOT a flag (boundary)
t(logic.scoreVendor({
  advancePct: 50, hasWrittenAgreement: true, pressureTactic: false, verified: true
}).score, 100, "50% advance is not flagged");

/* ---------------- formatPKR ---------------- */

// 85-88.
t(logic.formatPKR(1250000), "Rs 1,250,000", "formatPKR millions");
t(logic.formatPKR(1800), "Rs 1,800", "formatPKR thousands");
t(logic.formatPKR(500), "Rs 500", "formatPKR small");
t(logic.formatPKR(0), "Rs 0", "formatPKR zero");

console.log("\nPASS: " + passed + " assertions, all green.");
