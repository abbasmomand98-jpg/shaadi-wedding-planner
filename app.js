/* =====================================================================
   Shaadi — Winter Wedding Planner & Venue Finder
   app.js — the DOM layer (wiring ONLY).

   Rule of this file: no math, no filtering, no scoring here — every
   calculation is delegated to logic.js, every dataset comes from data.js.
   This file only reads inputs, calls SH.* functions, and renders HTML.
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- tiny helpers ---------- */

  /** Shortcut for document.getElementById. */
  function $(id) { return document.getElementById(id); }

  /** Escape user-typed text before injecting it into HTML. */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Safe localStorage read (returns fallback on any error). */
  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* full/blocked storage: app still works in-memory */ }
  }

  /* ================================================================
     1. TAB SWITCHING
  ================================================================ */
  function initTabs() {
    var buttons = document.querySelectorAll(".tab-btn");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-tab");
        // highlight the tapped tab
        buttons.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        // show its panel, hide the rest
        document.querySelectorAll(".tab-panel").forEach(function (p) {
          p.classList.remove("active");
        });
        $("panel-" + name).classList.add("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  /* ================================================================
     2. VENUES — filter list + per-venue cost math
  ================================================================ */
  var selectedVenue = null;

  function initVenues() {
    // fill the city dropdown from data.js
    SH.cities.forEach(function (city) {
      var opt = document.createElement("option");
      opt.value = city; opt.textContent = city;
      $("cityFilter").appendChild(opt);
    });

    ["cityFilter", "capacityFilter"].forEach(function (id) {
      $(id).addEventListener("change", renderVenues);
    });
    $("perHeadRange").addEventListener("input", function () {
      $("perHeadLabel").textContent = SH.formatPKR(Number($("perHeadRange").value));
      renderVenues();
    });

    $("guestCount").addEventListener("input", renderVenueMath);
    $("closeDetail").addEventListener("click", function () {
      $("venueDetail").hidden = true;
      selectedVenue = null;
    });

    renderVenues();
  }

  function currentVenueFilters() {
    return {
      city: $("cityFilter").value || undefined,
      maxPerHead: Number($("perHeadRange").value),
      minCapacity: $("capacityFilter").value ? Number($("capacityFilter").value) : undefined
    };
  }

  function renderVenues() {
    var list = SH.filterVenues(SH.venues, currentVenueFilters());
    $("venueCount").textContent = list.length + " sample venue" + (list.length === 1 ? "" : "s") + " found";

    if (!list.length) {
      $("venueList").innerHTML = '<div class="empty-note">No venues match these filters — try widening the budget.</div>';
      return;
    }

    $("venueList").innerHTML = list.map(function (v) {
      return '<button class="list-item" data-venue-id="' + v.id + '" type="button">' +
        "<h3>" + escapeHtml(v.name) + '<span class="badge">Sample</span></h3>' +
        '<p class="meta">' + escapeHtml(v.city) + " · " + escapeHtml(v.type) +
        " · up to " + v.capacity + " guests · ★ " + v.rating.toFixed(1) + "</p>" +
        '<p class="price">' + SH.formatPKR(v.perHeadCatering) + " / head catering</p>" +
        "</button>";
    }).join("");

    // tapping a venue opens its detail card
    $("venueList").querySelectorAll(".list-item").forEach(function (el) {
      el.addEventListener("click", function () {
        var id = el.getAttribute("data-venue-id");
        selectedVenue = SH.venues.find(function (v) { return v.id === id; });
        renderVenueDetail();
      });
    });
  }

  function renderVenueDetail() {
    if (!selectedVenue) return;
    var v = selectedVenue;
    $("detailName").textContent = v.name;
    $("detailMeta").textContent = v.city + " · " + v.type + " · capacity " + v.capacity + " · rating " + v.rating.toFixed(1) + "/5";
    $("detailPerHead").textContent = SH.formatPKR(v.perHeadCatering) + " per head";
    $("detailWinter").textContent = "Winter note: " + v.winterSeasonNote;
    $("venueDetail").hidden = false;
    renderVenueMath();
    $("venueDetail").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderVenueMath() {
    if (!selectedVenue) return;
    var guests = Math.max(0, Math.floor(Number($("guestCount").value) || 0));
    var total = SH.venueTotalCost(selectedVenue, guests);
    $("costMath").innerHTML =
      SH.formatPKR(selectedVenue.perHeadCatering) + " × " + guests + " guests" +
      '<div class="total">' + SH.formatPKR(total) + " estimated catering</div>";
  }

  /* ================================================================
     3. BUDGET — 3 events, combined total, debt-risk meter
  ================================================================ */
  var budgetState = JSON.parse(JSON.stringify(SH.defaultEvents)); // deep copy
  var activeEvent = "mehndi";
  var EVENT_KEYS = ["mehndi", "baraat", "walima"];

  function initBudget() {
    // event tab buttons
    document.querySelectorAll(".event-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeEvent = btn.getAttribute("data-event");
        document.querySelectorAll(".event-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        syncBudgetForm();
        renderBudget();
      });
    });

    // any input edits the active event, then re-renders everything
    ["evtGuests", "evtPerHead", "evtDecor", "evtOther"].forEach(function (id) {
      $(id).addEventListener("input", function () {
        var key = id.replace("evt", "").toLowerCase(); // "evtGuests" -> "guests"
        budgetState[activeEvent][key] = Math.max(0, Number($(id).value) || 0);
        renderBudget();
      });
    });
    $("savingsInput").addEventListener("input", renderBudget);
    $("familyInput").addEventListener("input", renderBudget);

    syncBudgetForm();
    renderBudget();
  }

  /** Copy the active event's values into the form inputs. */
  function syncBudgetForm() {
    var e = budgetState[activeEvent];
    $("currentEventLabel").textContent = e.label;
    $("evtGuests").value = e.guests;
    $("evtPerHead").value = e.perHead;
    $("evtDecor").value = e.decor;
    $("evtOther").value = e.other;
  }

  function renderBudget() {
    var totals = {};
    EVENT_KEYS.forEach(function (k) { totals[k] = SH.eventCost(budgetState[k]); });

    $("totalMehndi").textContent = SH.formatPKR(totals.mehndi);
    $("totalBaraat").textContent = SH.formatPKR(totals.baraat);
    $("totalWalima").textContent = SH.formatPKR(totals.walima);
    $("evtTotal").textContent = SH.formatPKR(totals[activeEvent]);

    var combined = SH.totalAcrossEvents(EVENT_KEYS.map(function (k) { return budgetState[k]; }));
    $("combinedTotal").textContent = SH.formatPKR(combined);

    var meter = SH.debtRiskMeter({
      totalCost: combined,
      savings: Number($("savingsInput").value) || 0,
      familyContribution: Number($("familyInput").value) || 0
    });

    // meter bar width: 0% at ratio 0 -> 100% at ratio 2+
    var width = Math.min(100, (meter.ratio / 2) * 100);
    if (!isFinite(meter.ratio)) width = 100;
    var fill = $("riskFill");
    fill.style.width = width + "%";
    fill.className = "risk-fill level-" + meter.level;

    var levelEl = $("riskLevel");
    levelEl.textContent = meter.level === "tight" ? "Tight but possible" : meter.level;
    levelEl.className = "risk-level level-" + meter.level;
    $("riskRatio").textContent = isFinite(meter.ratio)
      ? "Cost is " + Math.round(meter.ratio * 100) + "% of available funds"
      : "No savings entered — the full cost would be borrowed";
    $("riskMessage").textContent = meter.message;
  }

  /* ================================================================
     4. GUESTS — add/remove, RSVP chips, localStorage persistence
  ================================================================ */
  var GUESTS_KEY = "shaadi_guests_v1";
  var guests = loadJSON(GUESTS_KEY, []);

  function initGuests() {
    $("addGuestBtn").addEventListener("click", addGuest);
    $("guestName").addEventListener("keydown", function (e) {
      if (e.key === "Enter") addGuest();
    });
    renderGuests();
  }

  function addGuest() {
    var name = $("guestName").value.trim();
    if (!name) {
      $("guestName").focus();
      return; // ignore empty names
    }
    guests.push({
      name: name,
      side: $("guestSide").value,   // "groom" | "bride"
      rsvp: $("guestRsvp").value   // "pending" | "confirmed" | "declined"
    });
    $("guestName").value = "";
    $("guestRsvp").value = "pending";
    saveJSON(GUESTS_KEY, guests);
    renderGuests();
  }

  function removeGuest(index) {
    guests.splice(index, 1);
    saveJSON(GUESTS_KEY, guests);
    renderGuests();
  }

  function renderGuests() {
    var s = SH.rsvpSummary(guests);
    $("chipInvited").textContent = s.invited;
    $("chipConfirmed").textContent = s.confirmed;
    $("chipPending").textContent = s.pending;
    $("chipDeclined").textContent = s.declined;
    $("estAttendance").textContent = SH.estimatedAttendance(s);

    $("guestEmpty").style.display = guests.length ? "none" : "block";
    $("guestList").innerHTML = guests.map(function (g, i) {
      var sideLabel = g.side === "bride" ? "Bride's family" : "Groom's family";
      return '<div class="guest-row">' +
        '<div><div class="g-name">' + escapeHtml(g.name) + '</div>' +
        '<div class="g-side">' + sideLabel + '</div></div>' +
        '<div style="display:flex; align-items:center; gap:6px;">' +
        '<span class="rsvp-tag ' + g.rsvp + '">' + g.rsvp + "</span>" +
        '<button class="remove-btn" data-index="' + i + '" type="button" aria-label="Remove ' + escapeHtml(g.name) + '">×</button>' +
        "</div></div>";
    }).join("");

    $("guestList").querySelectorAll(".remove-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        removeGuest(Number(btn.getAttribute("data-index")));
      });
    });
  }

  /* ================================================================
     5. VENDORS — directory, escrow booking, receipts
  ================================================================ */
  var RECEIPTS_KEY = "shaadi_receipts_v1";
  var receipts = loadJSON(RECEIPTS_KEY, []);
  var escrowVendor = null; // the vendor currently being booked

  function initVendors() {
    SH.vendorCategories.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c; opt.textContent = c;
      $("categoryFilter").appendChild(opt);
    });
    $("categoryFilter").addEventListener("change", renderVendors);

    $("calcEscrowBtn").addEventListener("click", calcEscrow);
    $("confirmDepositBtn").addEventListener("click", confirmDeposit);

    renderVendors();
    renderReceipts();
  }

  function renderVendors() {
    var cat = $("categoryFilter").value;
    var list = cat ? SH.vendors.filter(function (v) { return v.category === cat; }) : SH.vendors;

    $("vendorList").innerHTML = list.map(function (v) {
      var badges = '<span class="badge">Sample</span>';
      if (v.verified) badges += ' <span class="badge">Verified sample</span>';
      return '<div class="list-item" style="cursor:default;">' +
        "<h3>" + escapeHtml(v.name) + badges + "</h3>" +
        '<p class="meta">' + escapeHtml(v.category) + " · " + escapeHtml(v.city) +
        " · asks " + v.advancePct + "% advance" +
        (v.hasWrittenAgreement ? " · written agreement" : " · no written agreement") + "</p>" +
        '<p class="price">From ' + SH.formatPKR(v.priceFrom) + "</p>" +
        '<div style="margin-top:10px; display:flex; gap:8px;">' +
        '<button class="btn btn-sm book-btn" data-vendor-id="' + v.id + '" type="button">Book with escrow</button>' +
        '<button class="btn btn-sm btn-ghost check-btn" data-vendor-id="' + v.id + '" type="button">Check red flags</button>' +
        "</div></div>";
    }).join("");

    // wire the per-vendor buttons
    $("vendorList").querySelectorAll(".book-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        startEscrow(btn.getAttribute("data-vendor-id"));
      });
    });
    $("vendorList").querySelectorAll(".check-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        // jump to the scam-spotter tab with this vendor pre-selected
        $("scamSelect").value = btn.getAttribute("data-vendor-id");
        document.querySelector('.tab-btn[data-tab="scam"]').click();
        runScamCheck();
      });
    });
  }

  function startEscrow(vendorId) {
    escrowVendor = SH.vendors.find(function (v) { return v.id === vendorId; });
    $("escrowVendor").textContent = escrowVendor.name + " · " + escrowVendor.category + " · " + escrowVendor.city;
    $("contractValue").value = escrowVendor.priceFrom;
    $("advancePct").value = escrowVendor.advancePct;
    $("escrowResult").hidden = true;
    $("escrowCard").hidden = false;
    $("escrowCard").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function calcEscrow() {
    if (!escrowVendor) return;
    var result = SH.escrowDeposit($("contractValue").value, $("advancePct").value);
    $("escrowAmount").textContent = SH.formatPKR(result.amount);
    var warn = $("escrowWarning");
    if (result.warning) {
      warn.textContent = result.warning;
      warn.hidden = false;
    } else {
      warn.hidden = true;
    }
    $("escrowResult").hidden = false;
  }

  function confirmDeposit() {
    if (!escrowVendor) return;
    var result = SH.escrowDeposit($("contractValue").value, $("advancePct").value);
    receipts.unshift({
      no: SH.receiptNo(),
      vendor: escrowVendor.name,
      amount: result.amount,
      date: new Date().toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
    });
    saveJSON(RECEIPTS_KEY, receipts);
    renderReceipts();
    $("escrowCard").hidden = true;
    $("escrowResult").hidden = true;
    escrowVendor = null;
  }

  function renderReceipts() {
    $("receiptEmpty").style.display = receipts.length ? "none" : "block";
    $("receiptList").innerHTML = receipts.map(function (r) {
      return '<div class="receipt">' +
        '<div class="r-no">' + escapeHtml(r.no) + "</div>" +
        '<div class="r-meta">' + escapeHtml(r.vendor) + " · " +
        SH.formatPKR(r.amount) + " · " + escapeHtml(r.date) + "</div>" +
        "</div>";
    }).join("");
  }

  /* ================================================================
     6. SCAM-SPOTTER — pick a vendor, see the red flags
  ================================================================ */
  function initScam() {
    SH.vendors.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = v.name + " (" + v.category + ")";
      $("scamSelect").appendChild(opt);
    });
    $("runCheckBtn").addEventListener("click", runScamCheck);
  }

  function runScamCheck() {
    var vendor = SH.vendors.find(function (v) { return v.id === $("scamSelect").value; });
    if (!vendor) return;
    var result = SH.scoreVendor(vendor);

    $("scamVendorName").textContent = vendor.name;
    $("scamScoreNum").textContent = result.score;
    $("scamScoreFill").style.width = result.score + "%";
    $("scamScoreFill").style.background =
      result.score >= 70 ? "var(--maroon)" : "var(--maroon-dark)";

    $("scamFlags").innerHTML = result.flags.length
      ? result.flags.map(function (f) { return "<li>" + escapeHtml(f) + "</li>"; }).join("")
      : '<li style="list-style:none; padding-left:12px;">No red flags found on this checklist.</li>';

    $("scamResult").hidden = false;
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initTabs();
    initVenues();
    initBudget();
    initGuests();
    initVendors();
    initScam();
  });

})();
