/**
 * Company find + address helpers for Modeus B2B registration forms.
 */
(function () {
  const DEMO_COMPANIES = [
    {
      id: "modeus",
      company: "Modeus B.V.",
      vat: "NL855264159B01",
      registration: "65526415",
      street: "Jan van Krimpenweg",
      house: "7M",
      postal: "2031 CE",
      city: "Haarlem",
      country: "NL",
      source: "Business register",
    },
    {
      id: "interiors",
      company: "Interiors B.V.",
      vat: "NL123456789B01",
      registration: "12345678",
      street: "Jan Pieter Zondervanweg",
      house: "7",
      postal: "2031 AB",
      city: "Haarlem",
      country: "NL",
      source: "Business register",
    },
    {
      id: "atelier",
      company: "Atelier Lumière SRL",
      vat: "BE0123456789",
      registration: "0123.456.789",
      street: "Meir",
      house: "80",
      postal: "2000",
      city: "Antwerpen",
      country: "BE",
      source: "Business register",
    },
    {
      id: "norden",
      company: "Studio Norden GmbH",
      vat: "DE123456789",
      registration: "HRB123456",
      street: "Friedrichstraße",
      house: "50",
      postal: "10117",
      city: "Berlin",
      country: "DE",
      source: "Business register",
    },
    {
      id: "lux",
      company: "Salon Concept S.à r.l.",
      vat: "LU12345678",
      registration: "B123456",
      street: "Avenue de la Liberté",
      house: "12",
      postal: "1930",
      city: "Luxembourg",
      country: "LU",
      source: "Business register",
    },
  ];

  const $ = (id) => document.getElementById(id);

  function setText(el, message, tone) {
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || "";
    el.className =
      el.className
        .split(/\s+/)
        .filter((c) => c && !c.startsWith("address-status--") && !c.startsWith("company-status--"))
        .join(" ") + (tone ? " company-status--" + tone : "");
    if (el.classList.contains("address-status") && tone) {
      el.className = "address-status address-status--" + tone;
    }
  }

  function fill(map) {
    Object.entries(map).forEach(([id, value]) => {
      const el = $(id);
      if (!el || value == null || value === "") return;
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.classList.add("is-autofilled");
      setTimeout(() => el.classList.remove("is-autofilled"), 1400);
    });
  }

  function normalizeVatQuery(raw) {
    const s = (raw || "").toUpperCase().replace(/[\s.]/g, "");
    const m = s.match(/^([A-Z]{2})(.+)$/);
    if (m) return { country: m[1] === "GR" ? "EL" : m[1], number: m[2] };
    return null;
  }

  function parseViesAddress(address) {
    if (!address || address === "---") return null;
    const lines = address
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return null;

    // Common NL pattern: "STREET 12" then "1234AB CITY"
    let street = "",
      house = "",
      postal = "",
      city = "";
    if (lines.length >= 2) {
      const line1 = lines[0];
      const line2 = lines[1];
      const hm = line1.match(/^(.*?)[,\s]+(\d+[A-Za-z]?)$/);
      if (hm) {
        street = hm[1].trim();
        house = hm[2].trim();
      } else {
        street = line1;
      }
      const pm = line2.match(/^(\d{4}\s?[A-Z]{2})\s+(.+)$/i);
      if (pm) {
        postal = pm[1].toUpperCase().replace(/\s+/, " ");
        city = pm[2].trim();
      } else {
        city = line2;
      }
    } else {
      street = lines[0];
    }
    return { street, house, postal, city };
  }

  async function checkVies(countryCode, vatNumber) {
    const country = countryCode === "GR" ? "EL" : countryCode;
    const number = vatNumber.replace(/^[A-Z]{2}/i, "").replace(/[\s.]/g, "");
    const url =
      "https://ec.europa.eu/taxation_customs/vies/rest-api/ms/" +
      encodeURIComponent(country) +
      "/vat/" +
      encodeURIComponent(number);
    const res = await fetch(url);
    if (!res.ok) throw new Error("VIES HTTP " + res.status);
    return res.json();
  }

  function searchDemoCatalogue(query, country) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];
    return DEMO_COMPANIES.filter((c) => {
      if (country && c.country !== country) return false;
      return (
        c.company.toLowerCase().includes(q) ||
        c.vat.toLowerCase().includes(q.replace(/\s/g, "")) ||
        c.registration.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });
  }

  function renderResults(results) {
    const list = $("company-results");
    if (!list) return;
    list.innerHTML = "";
    if (!results.length) {
      list.hidden = true;
      return;
    }
    results.forEach((c) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML =
        "<strong>" +
        escapeHtml(c.company) +
        "</strong><span>" +
        escapeHtml(c.city + ", " + countryLabel(c.country)) +
        " · " +
        escapeHtml(c.vat) +
        "</span>";
      btn.addEventListener("click", () => showConfirm(c));
      li.appendChild(btn);
      list.appendChild(li);
    });
    list.hidden = false;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function countryLabel(code) {
    const map = {
      NL: "Netherlands",
      BE: "Belgium",
      LU: "Luxembourg",
      DE: "Germany",
      FR: "France",
      EL: "Greece",
      GR: "Greece",
    };
    return map[code] || code;
  }

  let pendingCompany = null;

  function showConfirm(company) {
    pendingCompany = company;
    const card = $("company-confirm");
    const summary = $("company-confirm-summary");
    const note = $("company-confirm-note");
    if (summary) {
      summary.innerHTML =
        "<p class='confirm-name'>" +
        escapeHtml(company.company) +
        "</p>" +
        "<p>" +
        escapeHtml(
          [company.street, company.house].filter(Boolean).join(" ")
        ) +
        "</p>" +
        "<p>" +
        escapeHtml(
          [company.postal, company.city].filter(Boolean).join(" ")
        ) +
        "</p>" +
        "<p>" +
        escapeHtml(countryLabel(company.country)) +
        " · " +
        escapeHtml(company.vat || "VAT not returned") +
        "</p>";
    }
    if (note) {
      note.textContent =
        "Please check these details before continuing.";
    }
    if (card) card.hidden = false;
    const results = $("company-results");
    if (results) results.hidden = true;
  }

  function applyCompany(company) {
    fill({
      company: company.company === "VAT valid — add name & address via lookup"
        ? ""
        : company.company,
      vat: company.vat,
      street: company.street,
      house: company.house,
      postal: company.postal,
      city: company.city,
      country: company.country,
    });
    const findCountry = $("find-country");
    if (findCountry) findCountry.value = company.country;
    try {
      sessionStorage.setItem(
        "modeusCompanyPrefill",
        JSON.stringify(company)
      );
    } catch (_) {}
    const card = $("company-confirm");
    if (card) card.hidden = true;
    showManualFields(true);

    if (company.incomplete || !company.street || !company.city) {
      showAddressFallback(
        "Company/VAT was found, but address is incomplete."
      );
    } else {
      showAddressApplied(company);
      setText(
        $("company-status"),
        "Company details applied. If the address is wrong, choose Change address.",
        "ok"
      );
    }
  }

  function showAddressApplied(company) {
    const box = $("address-applied");
    const summary = $("address-applied-summary");
    if (!box) {
      // Single-page forms: still open editable address section quietly
      const panel = $("address-fallback");
      if (panel) panel.hidden = false;
      return;
    }
    if (summary) {
      const line1 = [company.street, company.house].filter(Boolean).join(" ");
      const line2 = [company.postal, company.city].filter(Boolean).join(" ");
      summary.innerHTML =
        "<p class='confirm-name'>" +
        escapeHtml(company.company || ($("company") && $("company").value) || "Company") +
        "</p>" +
        "<p>" +
        escapeHtml(line1) +
        "</p>" +
        "<p>" +
        escapeHtml(line2) +
        "</p>" +
        "<p>" +
        escapeHtml(countryLabel(company.country || ($("country") && $("country").value) || "")) +
        "</p>";
    }
    box.hidden = false;
    // Keep full editor collapsed until user chooses to change
    const panel = $("address-fallback");
    if (panel && panel.dataset.collapseAfterApply === "true") {
      panel.hidden = true;
    }
  }

  function enableAddressEditing(opts) {
    const openLookup = opts && opts.openLookup;
    const box = $("address-applied");
    if (box) box.hidden = true;

    showAddressFallback(
      openLookup
        ? "Change address with postal code + house number lookup, or edit the fields directly."
        : "Edit any address field below, or look up a different postal code + house number."
    );

    const street = $("street");
    if (street && !openLookup) {
      street.readOnly = false;
      setTimeout(() => street.focus(), 200);
    }
  }

  function showManualFields(show) {
    const box = $("manual-company-fields");
    if (box) box.hidden = !show;
  }

  function showAddressFallback(reason) {
    const panel = $("address-fallback");
    if (panel) {
      panel.hidden = false;
      panel.classList.add("is-highlighted");
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    showManualFields(true);

    // Sync country from find-country into address country select
    const findCountry = $("find-country");
    const country = $("country");
    if (findCountry && country && findCountry.value) {
      country.value = findCountry.value;
    }

    const banner = $("address-fallback-banner");
    if (banner) {
      banner.hidden = false;
      banner.textContent =
        reason ||
        "Company / VAT lookup did not return a full profile. Enter the company name and VAT manually, then look up the address with postal code + house number.";
    }

    setText(
      $("company-status"),
      (reason ? reason + " " : "") +
        "You can still continue: fill company details manually and use address lookup below.",
      "warn"
    );

    const postal = $("postal");
    if (postal) setTimeout(() => postal.focus(), 300);
  }

  function hideAddressFallbackHighlight() {
    const panel = $("address-fallback");
    if (panel) panel.classList.remove("is-highlighted");
  }

  async function runCompanySearch() {
    const queryEl = $("company-query");
    const countryEl = $("find-country") || $("country");
    const status = $("company-status");
    const query = (queryEl && queryEl.value) || "";
    const country = (countryEl && countryEl.value) || "";

    if (!query.trim()) {
      setText(status, "Enter a company name, VAT number, or registration number.", "warn");
      return;
    }

    setText(status, "Searching…", "info");
    const card = $("company-confirm");
    if (card) card.hidden = true;
    const banner = $("address-fallback-banner");
    if (banner) banner.hidden = true;
    hideAddressFallbackHighlight();

    const results = searchDemoCatalogue(query, country || null);
    let viesIncomplete = false;
    let viesFailed = false;

    // If query looks like VAT, also try live VIES
    const vatParts =
      normalizeVatQuery(query) ||
      (country && /^\d/.test(query.replace(/\s/g, ""))
        ? { country: country === "GR" ? "EL" : country, number: query.replace(/[\s.]/g, "") }
        : null);

    if (vatParts) {
      try {
        const vies = await checkVies(vatParts.country, vatParts.number);
        const valid = vies.isValid === true || vies.valid === true;
        const name = vies.name && vies.name !== "---" ? vies.name : "";
        const address = vies.address && vies.address !== "---" ? vies.address : "";
        const parsed = parseViesAddress(address);
        const displayCountry = vatParts.country === "EL" ? "GR" : vatParts.country;
        const vatFull = displayCountry + vatParts.number;

        if (valid && (name || parsed)) {
          const hasFullAddress = !!(parsed && parsed.street && parsed.city);
          results.unshift({
            id: "vies-" + vatFull,
            company: name || "Validated company (name not published by member state)",
            vat: vatFull,
            registration: "",
            street: (parsed && parsed.street) || "",
            house: (parsed && parsed.house) || "",
            postal: (parsed && parsed.postal) || "",
            city: (parsed && parsed.city) || "",
            country: displayCountry,
            source: "EU VAT register",
            viesValid: true,
            incomplete: !hasFullAddress,
          });
          if (!hasFullAddress) viesIncomplete = true;
        } else if (valid) {
          viesIncomplete = true;
          results.unshift({
            id: "vies-valid-" + vatFull,
            company: "VAT valid — add name & address via lookup",
            vat: vatFull,
            registration: "",
            street: "",
            house: "",
            postal: "",
            city: "",
            country: displayCountry,
            source: "EU VAT register",
            viesValid: true,
            incomplete: true,
          });
        } else {
          viesFailed = true;
          setText(
            status,
            "This VAT number could not be validated. Showing other matches if any.",
            "warn"
          );
        }
      } catch (err) {
        console.warn(err);
        viesFailed = true;
        setText(
          status,
          "VAT validation is temporarily unavailable. Showing other matches if any.",
          "warn"
        );
      }
    }

    if (!results.length) {
      renderResults([]);
      showAddressFallback(
        "No company found via name/VAT search."
      );
      return;
    }

    setText(
      status,
      results.length +
        " result(s). Select your company to review details." +
        (viesIncomplete
          ? " If address is missing after confirm, use address lookup below."
          : ""),
      viesIncomplete || viesFailed ? "warn" : "ok"
    );
    renderResults(results);

    if (viesIncomplete) {
      // Pre-open address fallback so the path is obvious
      const panel = $("address-fallback");
      if (panel) panel.hidden = false;
      const banner = $("address-fallback-banner");
      if (banner) {
        banner.hidden = false;
        banner.textContent =
          "The VAT number is valid, but a full address was not returned. After selecting the company, use postal code and house number to fill street and city.";
      }
    }
  }

  // --- Address postal/house lookup (secondary) ---
  function normalizePostal(country, postal) {
    const raw = (postal || "").trim().toUpperCase().replace(/\s+/g, "");
    if (country === "NL" && raw.length === 6) return raw;
    return raw;
  }

  function displayPostal(country, postal) {
    const raw = (postal || "").trim().toUpperCase().replace(/\s+/g, "");
    if (country === "NL" && raw.length === 6) {
      return raw.slice(0, 4) + " " + raw.slice(4);
    }
    return (postal || "").trim().toUpperCase();
  }

  async function lookupNetherlands(postal, house) {
    const q = encodeURIComponent(postal + " " + house);
    const url =
      "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=" +
      q +
      "&fq=type:adres&rows=5";
    const res = await fetch(url);
    if (!res.ok) throw new Error("PDOK failed");
    const data = await res.json();
    const docs = (data.response && data.response.docs) || [];
    if (!docs.length) return null;
    const exact =
      docs.find((d) => String(d.huis_nlt || "") === String(house)) || docs[0];
    return {
      street: exact.straatnaam || "",
      house: exact.huis_nlt || house,
      postal: displayPostal("NL", exact.postcode || postal),
      city: exact.woonplaatsnaam || "",
      country: "NL",
      label: exact.weergavenaam || "",
      source: "Address lookup",
    };
  }

  async function lookupPhoton(country, postal, house) {
    const url =
      "https://photon.komoot.io/api/?q=" +
      encodeURIComponent(house + ", " + postal + ", " + country) +
      "&limit=8&lang=en";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Photon failed");
    const data = await res.json();
    const cc = country.toLowerCase();
    const postalNorm = postal.replace(/\s+/g, "").toLowerCase();
    const features = data.features || [];
    const pick = features
      .map((f) => f.properties || {})
      .filter((p) => (p.countrycode || "").toLowerCase() === cc)
      .find((p) =>
        String(p.postcode || "")
          .replace(/\s+/g, "")
          .toLowerCase()
          .includes(postalNorm)
      );
    if (!pick) return null;
    return {
      street: pick.street || pick.name || "",
      house: pick.housenumber || house,
      postal: pick.postcode || displayPostal(country, postal),
      city: pick.city || pick.town || pick.village || "",
      country,
      label: [pick.street, pick.housenumber, pick.postcode, pick.city]
        .filter(Boolean)
        .join(" "),
      source: "Address lookup",
    };
  }

  async function lookupAddress() {
    const countryEl = $("country");
    const postalEl = $("postal");
    const houseEl = $("house");
    const status = $("address-status");
    if (!countryEl || !postalEl || !houseEl) return;

    const country = countryEl.value;
    const postal = normalizePostal(country, postalEl.value);
    const house = (houseEl.value || "").trim();
    if (!country || !postal || !house) {
      setText(status, "Need country, postal code, and house number.", "warn");
      return;
    }

    const btn = $("address-lookup-btn");
    if (btn) btn.disabled = true;
    setText(status, "Looking up address…", "info");
    try {
      const result =
        country === "NL"
          ? await lookupNetherlands(postal, house)
          : await lookupPhoton(country, postal, house);
      if (!result || !result.street) {
        setText(
          status,
          "No address found. Enter street and city manually.",
          "warn"
        );
        return;
      }
      fill({
        street: result.street,
        house: result.house,
        postal: result.postal,
        city: result.city,
        country: result.country,
      });
      try {
        const prev = JSON.parse(
          sessionStorage.getItem("modeusCompanyPrefill") || "{}"
        );
        sessionStorage.setItem(
          "modeusCompanyPrefill",
          JSON.stringify({
            ...prev,
            street: result.street,
            house: result.house,
            postal: result.postal,
            city: result.city,
            country: result.country,
            company: prev.company || ($("company") && $("company").value) || "",
            vat: prev.vat || ($("vat") && $("vat").value) || "",
          })
        );
      } catch (_) {}
      setText(
        status,
        "Address found: " + (result.label || result.street),
        "ok"
      );
      hideAddressFallbackHighlight();
      showAddressApplied({
        company: ($("company") && $("company").value) || "",
        street: result.street,
        house: result.house,
        postal: result.postal,
        city: result.city,
        country: result.country,
      });
    } catch (e) {
      console.error(e);
      setText(status, "Address lookup failed. Enter manually.", "warn");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function restorePrefill() {
    try {
      const raw = sessionStorage.getItem("modeusCompanyPrefill");
      if (!raw) return;
      const company = JSON.parse(raw);
      fill({
        company: company.company,
        vat: company.vat,
        street: company.street,
        house: company.house,
        postal: company.postal,
        city: company.city,
        country: company.country,
      });
      showManualFields(true);
    } catch (_) {}
  }

  function bindCompanyFinder() {
    const searchBtn = $("company-search-btn");
    const query = $("company-query");
    if (searchBtn) searchBtn.addEventListener("click", runCompanySearch);
    if (query) {
      query.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          runCompanySearch();
        }
      });
    }
    const useBtn = $("use-company-btn");
    if (useBtn) {
      useBtn.addEventListener("click", () => {
        if (pendingCompany) applyCompany(pendingCompany);
      });
    }
    const againBtn = $("search-again-btn");
    if (againBtn) {
      againBtn.addEventListener("click", () => {
        pendingCompany = null;
        const card = $("company-confirm");
        if (card) card.hidden = true;
        if (query) query.focus();
      });
    }
    const manualBtn = $("manual-entry-btn");
    if (manualBtn) {
      manualBtn.addEventListener("click", () => {
        showManualFields(true);
        setText(
          $("company-status"),
          "Enter company details manually. You can still use Find your company later.",
          "info"
        );
      });
    }
    const addressFallbackBtn = $("address-fallback-btn");
    if (addressFallbackBtn) {
      addressFallbackBtn.addEventListener("click", () => {
        showAddressFallback(
          "Using address lookup instead of company/VAT search."
        );
      });
    }
    const changeAddressBtn = $("change-address-btn");
    if (changeAddressBtn) {
      changeAddressBtn.addEventListener("click", () => {
        enableAddressEditing({ openLookup: false });
      });
    }
    const changeAddressLookupBtn = $("change-address-lookup-btn");
    if (changeAddressLookupBtn) {
      changeAddressLookupBtn.addEventListener("click", () => {
        enableAddressEditing({ openLookup: true });
      });
    }
    const useThenChangeBtn = $("use-company-change-address-btn");
    if (useThenChangeBtn) {
      useThenChangeBtn.addEventListener("click", () => {
        if (!pendingCompany) return;
        applyCompany(pendingCompany);
        enableAddressEditing({ openLookup: false });
      });
    }
  }

  function bindAddressLookup() {
    const btn = $("address-lookup-btn");
    if (btn) btn.addEventListener("click", lookupAddress);
    const house = $("house");
    if (house) {
      house.addEventListener("blur", () => {
        const postal = $("postal");
        if (postal && postal.value.trim().length >= 4 && house.value.trim()) {
          lookupAddress();
        }
      });
    }
  }

  bindCompanyFinder();
  bindAddressLookup();
  restorePrefill();
})();
