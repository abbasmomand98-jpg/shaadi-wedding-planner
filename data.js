/* =====================================================================
   Shaadi — Winter Wedding Planner & Venue Finder
   data.js — the DATA layer (pure data, no logic, no DOM)

   HONESTY: every venue and vendor below is fictional SAMPLE data,
   invented for design demonstration. None of these are real businesses,
   and no price here is a real quote.
   ===================================================================== */

// Module pattern: works in the browser as a global `SH`, and in Node
// via `require("./data.js")` because of the guard at the bottom.
var SH = SH || {};

/* ------------------------------------------------------------------
   Sample venues across five Pakistani cities.
   perHeadCatering: realistic 2026 winter-season catering quotes in PKR.
------------------------------------------------------------------ */
SH.venues = [
  {
    id: "v01",
    name: "Sample Grand Marquee — Lahore",
    city: "Lahore",
    type: "Marquee",
    capacity: 1200,
    perHeadCatering: 3200,
    winterSeasonNote: "Dec peak: +20% weekend surcharge",
    rating: 4.6,
    verified: true
  },
  {
    id: "v02",
    name: "Sample Pearl Banquet Hall",
    city: "Lahore",
    type: "Hall",
    capacity: 600,
    perHeadCatering: 2800,
    winterSeasonNote: "Dec peak: +15% weekend surcharge",
    rating: 4.3,
    verified: true
  },
  {
    id: "v03",
    name: "Sample Bagh-e-Noor Lawn",
    city: "Lahore",
    type: "Lawn",
    capacity: 800,
    perHeadCatering: 2400,
    winterSeasonNote: "Fog risk in Jan: heaters cost extra",
    rating: 4.1,
    verified: false
  },
  {
    id: "v04",
    name: "Sample Sea-View Marquee",
    city: "Karachi",
    type: "Marquee",
    capacity: 1000,
    perHeadCatering: 3600,
    winterSeasonNote: "Dec peak: +15% weekend surcharge",
    rating: 4.5,
    verified: true
  },
  {
    id: "v05",
    name: "Sample Clifton Grand Hall",
    city: "Karachi",
    type: "Hall",
    capacity: 500,
    perHeadCatering: 3100,
    winterSeasonNote: "Weekday discounts available in Nov",
    rating: 4.2,
    verified: false
  },
  {
    id: "v06",
    name: "Sample Creekside Lawn",
    city: "Karachi",
    type: "Lawn",
    capacity: 550,
    perHeadCatering: 2000,
    winterSeasonNote: "Evening dew: carpeted walkways recommended",
    rating: 3.9,
    verified: false
  },
  {
    id: "v07",
    name: "Sample Margalla Marquee",
    city: "Islamabad",
    type: "Marquee",
    capacity: 900,
    perHeadCatering: 3800,
    winterSeasonNote: "Dec peak: +25% weekend surcharge",
    rating: 4.7,
    verified: true
  },
  {
    id: "v08",
    name: "Sample Foothill Farm Lawn",
    city: "Islamabad",
    type: "Lawn",
    capacity: 700,
    perHeadCatering: 2900,
    winterSeasonNote: "Winter rain backup tent included",
    rating: 4.4,
    verified: true
  },
  {
    id: "v09",
    name: "Sample Khyber Marquee",
    city: "Peshawar",
    type: "Marquee",
    capacity: 1100,
    perHeadCatering: 2600,
    winterSeasonNote: "Dec peak: +10% weekend surcharge",
    rating: 4.3,
    verified: false
  },
  {
    id: "v10",
    name: "Sample Bala Hisar Hall",
    city: "Peshawar",
    type: "Hall",
    capacity: 450,
    perHeadCatering: 2200,
    winterSeasonNote: "Budget-friendly weekday rates in Nov",
    rating: 4.0,
    verified: true
  },
  {
    id: "v11",
    name: "Sample Liaquat Bagh Hall",
    city: "Rawalpindi",
    type: "Hall",
    capacity: 650,
    perHeadCatering: 2500,
    winterSeasonNote: "Dec peak: +12% weekend surcharge",
    rating: 4.2,
    verified: false
  },
  {
    id: "v12",
    name: "Sample Satellite Town Marquee",
    city: "Rawalpindi",
    type: "Marquee",
    capacity: 800,
    perHeadCatering: 2700,
    winterSeasonNote: "Generator backup included in winter",
    rating: 4.1,
    verified: true
  }
];

/* ------------------------------------------------------------------
   Sample vendors. `advancePct` is the % of the contract the vendor
   asks for upfront as a "token". `pressureTactic` marks vendors who
   push "today only" style discounts — a classic red flag.
------------------------------------------------------------------ */
SH.vendors = [
  {
    id: "d01",
    name: "Sample LensWorks Studio",
    city: "Lahore",
    category: "Photographer",
    priceFrom: 120000,
    advancePct: 30,
    verified: true,
    hasWrittenAgreement: true,
    pressureTactic: false
  },
  {
    id: "d02",
    name: "Sample Phool & Co. Decor",
    city: "Lahore",
    category: "Decorator",
    priceFrom: 85000,
    advancePct: 60,
    verified: false,
    hasWrittenAgreement: false,
    pressureTactic: true
  },
  {
    id: "d03",
    name: "Sample Dastarkhwan Caterers",
    city: "Karachi",
    category: "Caterer",
    priceFrom: 150000,
    advancePct: 40,
    verified: true,
    hasWrittenAgreement: true,
    pressureTactic: false
  },
  {
    id: "d04",
    name: "Sample Glow by Ayesha",
    city: "Islamabad",
    category: "Makeup Artist",
    priceFrom: 45000,
    advancePct: 50,
    verified: true,
    hasWrittenAgreement: true,
    pressureTactic: false
  },
  {
    id: "d05",
    name: "Sample Dhol Beats Sound",
    city: "Peshawar",
    category: "DJ/Sound",
    priceFrom: 60000,
    advancePct: 70,
    verified: false,
    hasWrittenAgreement: false,
    pressureTactic: true
  },
  {
    id: "d06",
    name: "Sample ReelFrame Films",
    city: "Rawalpindi",
    category: "Videographer",
    priceFrom: 95000,
    advancePct: 30,
    verified: true,
    hasWrittenAgreement: true,
    pressureTactic: false
  },
  {
    id: "d07",
    name: "Sample Marigold Events",
    city: "Karachi",
    category: "Decorator",
    priceFrom: 110000,
    advancePct: 25,
    verified: true,
    hasWrittenAgreement: true,
    pressureTactic: false
  },
  {
    id: "d08",
    name: "Sample ShutterBug Studio",
    city: "Islamabad",
    category: "Photographer",
    priceFrom: 80000,
    advancePct: 55,
    verified: false,
    hasWrittenAgreement: true,
    pressureTactic: false
  }
];

/* Cities and vendor categories offered in the filter dropdowns. */
SH.cities = ["Lahore", "Karachi", "Islamabad", "Peshawar", "Rawalpindi"];
SH.vendorCategories = [
  "Photographer",
  "Decorator",
  "Caterer",
  "Makeup Artist",
  "DJ/Sound",
  "Videographer"
];

/* Default per-event budget figures (PKR) shown when the app first loads.
   These are editable starting points, not recommendations. */
SH.defaultEvents = {
  mehndi: { label: "Mehndi", guests: 300, perHead: 2000, decor: 150000, other: 50000 },
  baraat: { label: "Baraat", guests: 500, perHead: 3200, decor: 300000, other: 150000 },
  walima: { label: "Walima", guests: 600, perHead: 3500, decor: 350000, other: 200000 }
};

// Node compatibility: `require("./data.js")` returns the SH object.
if (typeof module !== "undefined" && module.exports) {
  module.exports = SH;
}
