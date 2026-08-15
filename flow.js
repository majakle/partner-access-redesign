/**
 * Version E — multi-step partner access flow helpers.
 */
(function () {
  const STORAGE_KEY = "partnerRequestAnonE";

  const DEMO = [
    {
      id: "company-xy",
      vat: "NL123456789B01",
      company: "Company XY",
      street: "Street",
      house: "12",
      postal: "1234 AB",
      city: "City",
      country: "NL",
    },
    {
      id: "interiors",
      vat: "NL987654321B01",
      company: "Interiors B.V.",
      street: "Main Street",
      house: "7",
      postal: "2031 AB",
      city: "Haarlem",
      country: "NL",
    },
    {
      id: "atelier",
      vat: "BE0123456789",
      company: "Atelier Lumière SRL",
      street: "Meir",
      house: "80",
      postal: "2000",
      city: "Antwerpen",
      country: "BE",
    },
    {
      id: "norden",
      vat: "DE123456789",
      company: "Studio Norden GmbH",
      street: "Friedrichstraße",
      house: "50",
      postal: "10117",
      city: "Berlin",
      country: "DE",
    },
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function load() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function save(partial) {
    const next = { ...load(), ...partial };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function normalizeVat(raw) {
    return String(raw || "")
      .toUpperCase()
      .replace(/[\s.\-]/g, "");
  }

  function isValidVatFormat(vat) {
    return /^[A-Z]{2}[A-Z0-9]{8,12}$/.test(normalizeVat(vat));
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  function isValidWebLink(raw) {
    const value = String(raw || "").trim();
    if (!value) return true; // optional
    // Allow domain or full URL; add https:// for parsing when missing
    const candidate = /^(https?:\/\/)/i.test(value) ? value : "https://" + value;
    try {
      const url = new URL(candidate);
      if (url.protocol !== "http:" && url.protocol !== "https:") return false;
      // Need a real hostname with a dot (or localhost for testing)
      const host = url.hostname;
      if (!host) return false;
      if (host === "localhost") return true;
      return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host);
    } catch (_) {
      return false;
    }
  }

  // National number length ranges by ISO country (digits after trunk 0 stripped)
  const PHONE_RULES = {
    NL: { min: 9, max: 9, example: "6 12345678" },
    BE: { min: 8, max: 9, example: "470 12 34 56" },
    LU: { min: 8, max: 9, example: "621 123 456" },
    DE: { min: 10, max: 11, example: "151 23456789" },
    FR: { min: 9, max: 9, example: "6 12 34 56 78" },
    AT: { min: 10, max: 11, example: "664 1234567" },
    IT: { min: 9, max: 10, example: "312 3456789" },
    ES: { min: 9, max: 9, example: "612 345 678" },
    PT: { min: 9, max: 9, example: "912 345 678" },
    IE: { min: 9, max: 9, example: "85 123 4567" },
    DK: { min: 8, max: 8, example: "20 12 34 56" },
    SE: { min: 9, max: 10, example: "70 123 45 67" },
    FI: { min: 9, max: 10, example: "40 123 4567" },
    PL: { min: 9, max: 9, example: "512 345 678" },
    CZ: { min: 9, max: 9, example: "601 123 456" },
    SK: { min: 9, max: 9, example: "912 345 678" },
    SI: { min: 8, max: 8, example: "31 234 567" },
    HR: { min: 8, max: 9, example: "91 234 5678" },
    HU: { min: 8, max: 9, example: "20 123 4567" },
    RO: { min: 9, max: 9, example: "712 345 678" },
    BG: { min: 8, max: 9, example: "87 123 4567" },
    GR: { min: 10, max: 10, example: "691 234 5678" },
    EE: { min: 7, max: 8, example: "5123 4567" },
    LV: { min: 8, max: 8, example: "2123 4567" },
    LT: { min: 8, max: 8, example: "612 34567" },
    MT: { min: 8, max: 8, example: "9912 3456" },
    CY: { min: 8, max: 8, example: "96 123456" },
  };

  function digitsOnly(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function getDialCode(selectEl) {
    if (!selectEl) return "";
    const opt = selectEl.options[selectEl.selectedIndex];
    return (opt && opt.getAttribute("data-dial")) || "";
  }

  function normalizeNationalPhone(raw, dialCode) {
    let digits = digitsOnly(raw);
    if (!digits) return "";

    // If pasted with +country / 00country, strip dial code
    if (dialCode && digits.startsWith(dialCode)) {
      digits = digits.slice(dialCode.length);
    }
    // Strip international 00 prefix leftovers
    if (digits.startsWith("00") && dialCode && digits.slice(2).startsWith(dialCode)) {
      digits = digits.slice(2 + dialCode.length);
    }
    // Strip trunk prefix 0 used in many EU countries
    if (digits.startsWith("0")) digits = digits.slice(1);
    return digits;
  }

  function isValidPhoneForCountry(raw, countryCode, dialCode) {
    const trimmed = String(raw || "").trim();
    if (!trimmed) return true; // optional
    const national = normalizeNationalPhone(trimmed, dialCode);
    const rule = PHONE_RULES[countryCode] || { min: 6, max: 12 };
    return (
      national.length >= rule.min &&
      national.length <= rule.max &&
      /^[1-9]\d*$/.test(national)
    );
  }

  function formatPhoneE164(raw, dialCode) {
    const national = normalizeNationalPhone(raw, dialCode);
    if (!national || !dialCode) return String(raw || "").trim();
    return "+" + dialCode + national;
  }

  function setDisabled(el, disabled) {
    if (!el) return;
    if (el.tagName === "A") {
      el.classList.toggle("is-disabled", disabled);
      el.classList.add("can-nudge");
      el.setAttribute("aria-disabled", disabled ? "true" : "false");
      // Keep focusable so users can activate and see guidance
      el.removeAttribute("tabindex");
    } else {
      // Do not use native disabled — it blocks click feedback
      el.disabled = false;
      el.classList.toggle("is-disabled", disabled);
      el.classList.add("can-nudge");
      el.setAttribute("aria-disabled", disabled ? "true" : "false");
    }
  }

  function setGateHint(message) {
    const hint = $("form-gate-hint");
    if (!hint) return;
    if (!message) {
      hint.hidden = true;
      hint.textContent = "";
      return;
    }
    hint.hidden = false;
    hint.textContent = message;
  }

  function focusFirst(el) {
    if (el && typeof el.focus === "function") {
      setTimeout(() => el.focus(), 50);
    }
  }

  function listNeeded(items) {
    if (!items.length) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return items[0] + " and " + items[1];
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
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
    };
    return map[code] || code;
  }

  function searchCompanies(query, country) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return [];
    const vatQ = normalizeVat(query);
    return DEMO.filter((c) => {
      if (country && c.country !== country) {
        // still allow exact VAT match across countries
        if (normalizeVat(c.vat) !== vatQ) return false;
      }
      return (
        c.company.toLowerCase().includes(q) ||
        normalizeVat(c.vat).includes(vatQ) ||
        normalizeVat(c.vat) === vatQ
      );
    });
  }

  // --- Contact step ---
  function bindContactStep() {
    const first = $("first");
    const last = $("last");
    const email = $("email");
    const phone = $("phone");
    const phoneCountry = $("phone-country");
    const phoneHint = $("phone-hint");
    const phoneError = $("phone-error");
    const emailError = $("email-error");
    const next = $("continue-btn");
    if (!first || !last || !email || !next) return;

    const data = load();
    if (data.first) first.value = data.first;
    if (data.last) last.value = data.last;
    if (data.email) email.value = data.email;
    if (phoneCountry && data.phoneCountry) phoneCountry.value = data.phoneCountry;
    if (phone && data.phoneNational) phone.value = data.phoneNational;
    else if (phone && data.phone) phone.value = data.phone;

    const touched = { email: false, phone: false };

    function updatePhoneHint() {
      if (!phoneHint || !phoneCountry) return;
      const code = phoneCountry.value;
      const rule = PHONE_RULES[code];
      const dial = getDialCode(phoneCountry);
      phoneHint.textContent = rule
        ? "Local number for +" + dial + " (e.g. " + rule.example + ")"
        : "Local number without the country code";
      if (phone) phone.placeholder = rule ? rule.example : "";
    }

    function validate(opts) {
      const showHint = opts && opts.showHint;
      const forceFormat = showHint || (opts && opts.showFormat);
      const okEmail = isValidEmail(email.value);
      const emailInvalid = !!email.value.trim() && !okEmail;
      if (emailError) {
        emailError.hidden = !(forceFormat || touched.email) || !emailInvalid;
        if (email.closest(".field")) {
          email.closest(".field").classList.toggle(
            "field--error",
            (forceFormat || touched.email) && emailInvalid
          );
        }
      }

      const dial = getDialCode(phoneCountry);
      const phoneCountryCode = phoneCountry ? phoneCountry.value : "NL";
      const okPhone = !phone || isValidPhoneForCountry(
        phone.value,
        phoneCountryCode,
        dial
      );
      const phoneInvalid = !!(phone && phone.value.trim() && !okPhone);
      if (phoneError) {
        phoneError.hidden = !(forceFormat || touched.phone) || !phoneInvalid;
      }
      if (phone && phone.closest(".field")) {
        phone.closest(".field").classList.toggle(
          "field--error",
          (forceFormat || touched.phone) && phoneInvalid
        );
      }

      const missing = [];
      if (!first.value.trim()) missing.push("first name");
      if (!last.value.trim()) missing.push("last name");
      if (!email.value.trim() || !okEmail) missing.push("work email");

      const ok = missing.length === 0 && okPhone;
      setDisabled(next, !ok);
      if (ok) setGateHint("");
      else if (showHint) {
        if (missing.length) {
          setGateHint(
            "Enter your " + listNeeded(missing) + "."
          );
          if (!first.value.trim()) focusFirst(first);
          else if (!last.value.trim()) focusFirst(last);
          else focusFirst(email);
        } else if (!okPhone) {
          setGateHint(
            "Please check the phone number for the selected country."
          );
          focusFirst(phone);
        }
      }
      return ok;
    }

    function onFieldBlur(key) {
      touched[key] = true;
      validate();
    }

    ["input", "change"].forEach((evt) => {
      first.addEventListener(evt, () => validate());
      last.addEventListener(evt, () => validate());
      email.addEventListener(evt, () => validate());
      if (phone) phone.addEventListener(evt, () => validate());
      if (phoneCountry) phoneCountry.addEventListener(evt, () => {
        updatePhoneHint();
        validate();
      });
    });
    email.addEventListener("blur", () => onFieldBlur("email"));
    if (phone) phone.addEventListener("blur", () => onFieldBlur("phone"));
    if (phoneCountry) {
      phoneCountry.addEventListener("blur", () => onFieldBlur("phone"));
      phoneCountry.addEventListener("change", () => {
        // Country change can invalidate an already-entered number — show after blur/attempt only
        validate();
      });
    }

    next.addEventListener("click", (e) => {
      touched.email = true;
      touched.phone = true;
      if (!validate({ showHint: true })) {
        e.preventDefault();
        return;
      }
      const dial = getDialCode(phoneCountry);
      const national = phone
        ? normalizeNationalPhone(phone.value, dial)
        : "";
      save({
        first: first.value.trim(),
        last: last.value.trim(),
        email: email.value.trim(),
        phoneCountry: phoneCountry ? phoneCountry.value : "NL",
        phoneNational: phone ? phone.value.trim() : "",
        phone: national ? formatPhoneE164(phone.value, dial) : "",
      });
    });

    updatePhoneHint();
    validate();
  }

  // --- Company step ---
  function bindCompanyStep() {
    const query = $("company-query");
    const searchBtn = $("company-search-btn");
    const status = $("vat-status");
    const results = $("company-results");
    const confirm = $("company-confirm");
    const confirmSummary = $("company-confirm-summary");
    const useBtn = $("use-company-btn");
    const againBtn = $("search-again-btn");
    const manualBtn = $("manual-entry-btn");
    const card = $("autofill-card");
    const vat = $("vat");
    const company = $("company");
    const street = $("street");
    const house = $("house");
    const postal = $("postal");
    const city = $("city");
    const country = $("country");
    const vatError = $("vat-error");
    const addressBtn = $("address-lookup-btn");
    const addressStatus = $("address-status");
    const next = $("continue-btn");
    if (!next) return;

    let pending = null;

    const data = load();
    if (data.vat && vat) vat.value = data.vat;
    if (data.company && company) company.value = data.company;
    if (data.street && street) street.value = data.street;
    if (data.house && house) house.value = data.house;
    if (data.postal && postal) postal.value = data.postal;
    if (data.city && city) city.value = data.city;
    if (data.country && country) country.value = data.country;
    if (data.company && card) card.hidden = false;

    const touched = { vat: false };

    function showManual(open) {
      if (card) card.hidden = !open;
    }

    function applyMatch(match, msg) {
      if (!match) return;
      if (company) company.value = match.company || "";
      if (vat) vat.value = match.vat || "";
      if (street) street.value = match.street || "";
      if (house) house.value = match.house || "";
      if (postal) postal.value = match.postal || "";
      if (city) city.value = match.city || "";
      if (country) country.value = match.country || "NL";
      showManual(true);
      if (confirm) confirm.hidden = true;
      if (results) results.hidden = true;
      if (status) {
        status.hidden = false;
        status.textContent =
          msg ||
          "Company details applied. Please check they are correct.";
        status.className = "company-status company-status--ok";
      }
      validate();
    }

    function validate(opts) {
      const showHint = opts && opts.showHint;
      const forceFormat = showHint || (opts && opts.showFormat);
      const vatOk = !vat.value || isValidVatFormat(vat.value);
      const vatInvalid = !!vat.value.trim() && !vatOk;
      if (vatError) {
        vatError.hidden = !(forceFormat || touched.vat) || !vatInvalid;
      }
      if (vat && vat.closest(".field")) {
        vat.closest(".field").classList.toggle(
          "field--error",
          (forceFormat || touched.vat) && vatInvalid
        );
      }

      const missing = [];
      if (!company || !company.value.trim()) missing.push("company name");
      if (!vat || !vat.value.trim()) missing.push("VAT ID");
      else if (!isValidVatFormat(vat.value)) missing.push("a valid VAT ID");
      if (!street || !street.value.trim()) missing.push("street");
      if (!postal || !postal.value.trim()) missing.push("postal code");
      if (!city || !city.value.trim()) missing.push("city");

      const filled = missing.length === 0;
      setDisabled(next, !filled);
      if (filled) {
        setGateHint("");
      } else if (showHint) {
        if (!card || card.hidden) {
          setGateHint(
            "Find your company above, or enter the details manually to continue."
          );
          focusFirst($("company-query") || company);
        } else {
          setGateHint(
            "Enter your " + listNeeded(missing) + "."
          );
          if (!company.value.trim()) focusFirst(company);
          else if (!vat.value.trim() || !isValidVatFormat(vat.value))
            focusFirst(vat);
          else if (!street.value.trim()) focusFirst(street);
          else if (!postal.value.trim()) focusFirst(postal);
          else focusFirst(city);
        }
        showManual(true);
      }
      return filled;
    }

    function renderResults(list) {
      if (!results) return;
      results.innerHTML = "";
      if (!list.length) {
        results.hidden = true;
        return;
      }
      list.forEach((c) => {
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
        btn.addEventListener("click", () => {
          pending = c;
          if (confirmSummary) {
            confirmSummary.innerHTML =
              "<p class='confirm-name'>" +
              escapeHtml(c.company) +
              "</p><p>" +
              escapeHtml(
                [c.street, c.house, c.postal, c.city].filter(Boolean).join(" · ")
              ) +
              "</p><p>" +
              escapeHtml(countryLabel(c.country) + " · " + c.vat) +
              "</p>";
          }
          if (confirm) confirm.hidden = false;
          results.hidden = true;
        });
        li.appendChild(btn);
        results.appendChild(li);
      });
      results.hidden = false;
    }

    function runSearch() {
      const q = (query && query.value) || "";
      if (!q.trim()) {
        if (status) {
          status.hidden = false;
          status.textContent = "Enter a company name or VAT ID.";
          status.className = "company-status company-status--warn";
        }
        return;
      }
      if (status) {
        status.hidden = false;
        status.textContent = "Searching…";
        status.className = "company-status company-status--info";
      }
      if (confirm) confirm.hidden = true;
      pending = null;

      const list = searchCompanies(q, null);
      if (!list.length) {
        if (status) {
          status.hidden = false;
          status.textContent =
            "No company found. Please enter the details manually.";
          status.className = "company-status company-status--warn";
        }
        renderResults([]);
        showManual(true);
        if (company && !isValidVatFormat(q) && !company.value) {
          company.value = q.trim();
        }
        if (vat && isValidVatFormat(q) && !vat.value) {
          vat.value = normalizeVat(q);
        }
        validate();
        return;
      }

      if (status) {
        status.hidden = false;
        status.textContent =
          list.length === 1
            ? "1 company found."
            : list.length + " companies found.";
        status.className = "company-status company-status--ok";
      }
      if (list.length === 1) {
        pending = list[0];
        if (confirmSummary) {
          const c = list[0];
          confirmSummary.innerHTML =
            "<p class='confirm-name'>" +
            escapeHtml(c.company) +
            "</p><p>" +
            escapeHtml(
              [c.street, c.house, c.postal, c.city].filter(Boolean).join(" · ")
            ) +
            "</p><p>" +
            escapeHtml(countryLabel(c.country) + " · " + c.vat) +
            "</p>";
        }
        if (confirm) confirm.hidden = false;
        renderResults([]);
      } else {
        renderResults(list);
      }
    }

    async function lookupAddress() {
      const ctry = (country && country.value) || "NL";
      const pc = (postal && postal.value) || "";
      const hn = (house && house.value) || "";
      if (!pc.trim() || !hn.trim()) {
        if (addressStatus) {
          addressStatus.hidden = false;
          addressStatus.textContent =
            "Enter postal code and house number to look up the address.";
          addressStatus.className = "address-status address-status--warn";
        }
        return;
      }
      if (addressBtn) addressBtn.disabled = true;
      if (addressStatus) {
        addressStatus.hidden = false;
        addressStatus.textContent = "Looking up address…";
        addressStatus.className = "address-status address-status--info";
      }
      try {
        let result = null;
        if (ctry === "NL") {
          const postcode = pc.toUpperCase().replace(/\s+/g, "");
          const url =
            "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=" +
            encodeURIComponent(postcode + " " + hn) +
            "&fq=type:adres&rows=1";
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const doc = data.response && data.response.docs && data.response.docs[0];
            if (doc) {
              result = {
                street: doc.straatnaam || "",
                house: doc.huisnummer ? String(doc.huisnummer) : hn,
                postal: doc.postcode || postcode,
                city: doc.woonplaatsnaam || "",
              };
            }
          }
        } else {
          const url =
            "https://photon.komoot.io/api/?q=" +
            encodeURIComponent(pc + " " + hn) +
            "&limit=5&lang=en";
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const features = (data.features || []).filter((f) => {
              const p = f.properties || {};
              return (
                (!p.countrycode || p.countrycode.toUpperCase() === ctry) &&
                (p.street || p.name)
              );
            });
            const f = features[0];
            if (f) {
              const p = f.properties;
              result = {
                street: p.street || p.name || "",
                house: p.housenumber || hn,
                postal: p.postcode || pc,
                city: p.city || p.town || p.village || "",
              };
            }
          }
        }
        if (!result || !result.street) {
          if (addressStatus) {
            addressStatus.hidden = false;
            addressStatus.textContent =
              "No address found. Enter street and city manually.";
              addressStatus.className = "address-status address-status--warn";
            }
            return;
          }
          if (street) street.value = result.street;
          if (house) house.value = result.house;
          if (postal) postal.value = result.postal;
          if (city) city.value = result.city;
          if (addressStatus) {
            addressStatus.hidden = false;
            addressStatus.textContent = "Address found: " + result.street;
            addressStatus.className = "address-status address-status--ok";
          }
          validate();
        } catch (_) {
          if (addressStatus) {
            addressStatus.hidden = false;
            addressStatus.textContent =
              "Address lookup failed. Enter street and city manually.";
            addressStatus.className = "address-status address-status--warn";
          }
      } finally {
        if (addressBtn) addressBtn.disabled = false;
      }
    }

    if (searchBtn) searchBtn.addEventListener("click", runSearch);
    if (query) {
      query.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          runSearch();
        }
      });
    }
    if (useBtn) {
      useBtn.addEventListener("click", () => {
        if (pending) applyMatch(pending);
      });
    }
    if (againBtn) {
      againBtn.addEventListener("click", () => {
        pending = null;
        if (confirm) confirm.hidden = true;
        if (query) query.focus();
      });
    }
    if (manualBtn) {
      manualBtn.addEventListener("click", () => {
        showManual(true);
        if (status) {
          status.hidden = false;
          status.textContent =
            "Enter company details manually. You can look up the address with postal code and house number.";
          status.className = "company-status company-status--info";
        }
        if (company) company.focus();
        validate();
      });
    }
    if (addressBtn) addressBtn.addEventListener("click", lookupAddress);

    [company, vat, street, house, postal, city, country].forEach((el) => {
      if (el) el.addEventListener("input", () => validate());
    });
    if (vat) {
      vat.addEventListener("blur", () => {
        touched.vat = true;
        validate();
      });
    }

    next.addEventListener("click", (e) => {
      touched.vat = true;
      if (!validate({ showHint: true })) {
        e.preventDefault();
        return;
      }
      save({
        vat: normalizeVat(vat.value),
        company: company.value.trim(),
        street: street.value.trim(),
        house: house ? house.value.trim() : "",
        postal: postal.value.trim(),
        city: city.value.trim(),
        country: country.value,
      });
    });

    validate();
  }

  // --- Context step ---
  function bindContextStep() {
    const website = $("website");
    const social = $("social");
    const desc = $("desc");
    const terms = $("terms");
    const websiteError = $("website-error");
    const socialError = $("social-error");
    const next = $("continue-btn");
    const form = $("context-form");
    if (!next) return;
    const data = load();
    if (website && data.website) website.value = data.website;
    if (social && data.social) social.value = data.social;
    if (desc && data.desc) desc.value = data.desc;

    const touched = { website: false, social: false };

    function markField(el, errorEl, ok, show) {
      const invalid = !ok;
      const visible = show && invalid;
      if (errorEl) errorEl.hidden = !visible;
      if (el && el.closest(".field")) {
        el.closest(".field").classList.toggle("field--error", visible);
      }
    }

    function validate(opts) {
      const showHint = opts && opts.showHint;
      const forceFormat = showHint || (opts && opts.showFormat);
      const websiteOk = !website || isValidWebLink(website.value);
      const socialOk = !social || isValidWebLink(social.value);
      const termsOk = terms && terms.checked;

      markField(
        website,
        websiteError,
        !website || !website.value.trim() || websiteOk,
        forceFormat || touched.website
      );
      markField(
        social,
        socialError,
        !social || !social.value.trim() || socialOk,
        forceFormat || touched.social
      );

      const ok = termsOk && websiteOk && socialOk;
      setDisabled(next, !ok);

      if (ok) {
        setGateHint("");
      } else if (showHint) {
        if (!websiteOk) {
          setGateHint("Please check the website link format.");
          focusFirst(website);
        } else if (!socialOk) {
          setGateHint("Please check the social media link format.");
          focusFirst(social);
        } else {
          setGateHint("Agree to the terms and conditions to continue.");
          focusFirst(terms);
        }
      }
      return ok;
    }

    if (terms) terms.addEventListener("change", () => validate());
    if (website) {
      website.addEventListener("input", () => validate());
      website.addEventListener("blur", () => {
        touched.website = true;
        validate();
      });
    }
    if (social) {
      social.addEventListener("input", () => validate());
      social.addEventListener("blur", () => {
        touched.social = true;
        validate();
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        touched.website = true;
        touched.social = true;
        if (!validate({ showHint: true })) {
          e.preventDefault();
          return;
        }
        save({
          website: website ? website.value.trim() : "",
          social: social ? social.value.trim() : "",
          desc: desc ? desc.value.trim() : "",
        });
      });
    }

    validate();
  }

  const page = document.body.dataset.flowStep;
  if (page === "contact") bindContactStep();
  if (page === "company") bindCompanyStep();
  if (page === "context") bindContextStep();
})();
