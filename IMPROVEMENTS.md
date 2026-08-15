# What was improved and why

Phase 2 redesign mockups for the Modeus B2B registration / access-request process.  
Evidence base: heuristic evaluation, SUS + open questions (n=20 valid), six semi-structured interviews, and competitive benchmark (Moods Collection, Mobitec, Zuiver Interior Group), synthesised with ISO 9241 human-centred design, Nielsen’s heuristics, and Jarrett & Gaffney’s form model (relationship / conversation / appearance).

Open the interactive mockups from [`index.html`](index.html).

---

## 1. Problems found

| # | Problem | Found via | Impact |
| --- | --- | --- | --- |
| P1 | Wording **“Create account”** implies instant access; reality is a **manual access request** | Heuristic (severity 4); interviews; benchmark pattern | Expectation mismatch, trust loss after submit |
| P2 | **Sign-in and registration** compete on the same view; verification-code vs create-account confusion | SUS open answers; interviews I2/I4; heuristic | Wrong first action; abandoned or delayed requests |
| P3 | **Long single-page form**; high scrolling; worse on mobile | SUS; interviews I1–I3; heuristic structure issues | Perceived effort; abandonment risk |
| P4 | **Mandatory website** (+ unclear social / company description) | SUS; interviews I1/I5; trust literature | Blocks offline/studio users; “why do you need this?” |
| P5 | Weak **format examples** and little **inline validation** | Heuristic; Zuiver contrast; interviews | Late discovery of errors; lower confidence |
| P5b | High **manual address / company entry**; users asked for autofill | SUS open answers; heuristic (no address/VAT lookup) | Extra effort; typing errors |
| P6 | Unclear **what happens after submit** (timing, email, contact) | SUS; interviews almost all; Mobitec contrast | Planning uncertainty for trade buyers |
| P7 | Popup / overlay risk: **click outside closes** the form | Thesis note + interview observation | Accidental data loss |
| P8 | **Language selector** incomplete / mixed EN–DE; trust hit on legal text | Interview I6 | Reduced confidence; localisation expectation gap |
| P9 | Inconsistent **company naming** / brand cues | Heuristic trust issues | Doubt about who operates the portal |

**Positive elements retained:** clear basic labels; logical company → contact → address order; VAT as expected B2B verification; no password at request stage.

Mean SUS in analysis: **63.75** (below ~68 benchmark) → redesign targets the recurring friction above, not a total redesign of familiar fields.

---

## 2. Design insight synthesis (foundation of the redesign)

After survey, interviews, market/benchmark analysis:

1. **Reduce unnecessary steps / first-request burden**  
2. **Improve guidance and error feedback**  
3. **Clarify why information is requested**  
4. **Use familiar design patterns** (keep what worked)  
5. **Reinforce trust with confirmations and explanations**

These insights map to Nielsen (match system–real world; visibility of system status; error prevention/help; aesthetic minimalism; consistency) and Jarrett & Gaffney (relationship before appearance; clear conversation; progressive disclosure).

**Benchmark inspiration:** Mobitec performed best on purpose clarity, eligibility, approval SLA, and next steps — used as primary interaction/communication inspiration for Version C and for success screens in all versions. Moods inspired Version B’s low data scope. Zuiver inspired field-level error messaging shown in Version B.

---

## 3. Retain / remove / add

| Retain | Redesign or remove | Add |
| --- | --- | --- |
| Clear field labels | “Create account” → **Request B2B portal access** | Progress (A) / process diagram (C) |
| Company → address order | Login+register hybrid → **separate sign-in link** | Purpose microcopy on VAT/website |
| VAT as required B2B check | Mandatory website | Optional website/social/description |
| Terms near submit | Vague “we will review” | **1–3 business days** + email + request ID |
| Modeus as operator | Dismissible popup pattern | Full pages only |
| | Unexplained social/description | Example description text |
| | Manual-only company + address entry | **Find your company** confirm flow + optional postal/house refine |
| | Short country list | **Benelux-first**, full **EU/EEA** country list |
| | | Demo catalogue (KVK/BRIS concept) + live **VIES** when VAT entered |
| | | Visible language control (intended full-locale behaviour) |

---

## 4. Three versions — how to choose

| Version | Concept | Best when you want… |
| --- | --- | --- |
| **A — Guided wizard** | Multi-step + progress; optional profile last | Best overall balance (desktop + mobile effort) |
| **B — Minimal single page** | Essentials only; defer website/social | Lowest first-request burden (Moods-like) |
| **C — Context first** | Purpose/SLA page, then grouped form | Strongest process transparency (Mobitec-like) |

All three share: honest request wording, separate sign-in, SLA confirmation, Modeus naming consistency, full-page (not popup).

---

## 5. Per-screen rationale (Kinders-style)

For each mockup screen: **design element → which problem/insight it addresses → why**.

### Version A — Guided wizard

#### [`version-a/index.html`](version-a/index.html) — Start

| Design element | Addresses | Why |
| --- | --- | --- |
| H1 **Request B2B portal access** | P1 | Matches real process (request ≠ instant account); Nielsen match to real world |
| Explicit copy: “does not create an instant account” | P1, P6 | Sets relationship (Jarrett) before data collection |
| Sign-in as text link only | P2 | Removes dual-CTA competition from interviews |
| “What you will need” callout | Insight 2 | ISO/W3C: tell users which data to prepare |
| SLA “1–3 business days” upfront | P6; Mobitec | Trust via predictable process |
| Full page (not modal) | P7 | Prevents accidental dismiss |
| Language control in header | P8 | Offers locale; rationale: must apply to whole journey in production |
| Consistent **Modeus** naming | P9 | Trust / consistency heuristic |

#### [`version-a/02-company.html`](version-a/02-company.html) — Company & VAT

| Design element | Addresses | Why |
| --- | --- | --- |
| Progress “Step 1 of 4” + bar | P3; I2/I3 | Visibility of system status; W3C multi-step guidance |
| Only company + VAT on this step | P3; Insight 1 | Progressive disclosure reduces cognitive load |
| **Find your company** (name / VAT / registration) | P5b; thesis insight | One lookup replaces separate company+VAT+address typing |
| Confirm card + “Use these details” | Error prevention | User verifies before commit (KVK autofill pattern) |
| Manual entry fallback | Edge cases | Company not found / VIES incomplete / wrong match |
| Demo catalogue + live VIES | Realistic architecture | NL production → KVK; EU validate → VIES (profile not guaranteed) |
| VAT EU examples + purpose hint | P4/P5; Insight 3 | Clarifies why data is needed; supports non-NL IDs |
| Website deferred | P4 | Removes gate for offline/studio users (I1/I5) |

#### [`version-a/03-contact-address.html`](version-a/03-contact-address.html) — Contact & address

| Design element | Addresses | Why |
| --- | --- | --- |
| Grouped fieldsets Contact / Address | Familiar patterns | Retains liked logical order from SUS/interviews |
| Postal example microcopy | P5 | Clearer input guidance (Kinders-style “example input”) |
| **Country → postal → house number → lookup** | P5b; SUS automation wish | Realistic Benelux pattern; fills street + city via API |
| Live APIs: PDOK (NL) / Photon (EU) | Heuristic “no address autofill” | Real lookup, not fake free-text search |
| Benelux-first / EU country list | Market reality | Most partners NL/BE/LU; any EU/EEA business can still select |
| Phone optional + why | Insight 3 | Purpose without forcing data |
| Continue primary button | Guidance | Clear next action; completed step advances progress |

#### [`version-a/04-optional-profile.html`](version-a/04-optional-profile.html) — Optional profile

| Design element | Addresses | Why |
| --- | --- | --- |
| Optional tags + skip path | P4; Insight 1 | Relationship fairness: value before extra data |
| Purpose text on website/social | Insight 3; I1/I5 | Turns “nosy” into verification |
| Example company description | Interview theme | Reduces uncertainty about expected content |
| Terms adjacent to submit | Missed terms on long page (I1) | Error prevention on shorter step |

#### [`version-a/05-received.html`](version-a/05-received.html) — Confirmation

| Design element | Addresses | Why |
| --- | --- | --- |
| “Not an active account yet” | P1 | Closes expectation loop |
| Request ID | P6 | Traceability for business users |
| 1–3 business days + email | P6; Mobitec | Confirmation reinforces trust |
| Process steps 1–4 status | Insight 5 | Visibility of system status after submit |

---

### Version B — Minimal single page

#### [`version-b/index.html`](version-b/index.html) — Essentials form

| Design element | Addresses | Why |
| --- | --- | --- |
| Single short page, essentials only | P3; Moods | Lowest first-request burden |
| Deferred website/social callout | P4 | Explicit removal of non-essential gates |
| VAT **error demo state** | P5; Zuiver | Shows specific, actionable field feedback |
| Format examples (VAT, postal) | P5; Kinders “example input” | Clearer guidance without extra pages |
| Company + address autofill | P5b | Same automation: country → postal → house → street/city |
| Benelux-first EU countries | Market reality | Default NL; full EU/EEA available |
| Request wording + SLA banner | P1, P6 | Same trust fixes without multi-step chrome |
| Sign-in separated | P2 | Same dual-CTA fix |

#### [`version-b/02-received.html`](version-b/02-received.html) — Confirmation

| Design element | Addresses | Why |
| --- | --- | --- |
| SLA + “either way” email | P6 | Interview demand for approve/decline clarity |
| Note that fewer fields were collected | Insight 1 | Honest about verification depth vs speed trade-off |

---

### Version C — Context first (Mobitec-inspired)

#### [`version-c/index.html`](version-c/index.html) — Context

| Design element | Addresses | Why |
| --- | --- | --- |
| Who the portal is for | Benchmark Mobitec; P1 | Eligibility before effort |
| Benefits list | Jarrett “relationship” | Fair exchange before asking for data |
| Process diagram Request→Review→Email→Access | P6; Mobitec | Best-performing flow as visual inspiration |
| “Up to 3 business days” | P6 | Concrete SLA, not “soon” |
| Continue to form (separate page) | P7 | Full page; no overlay dismiss |
| Existing users → sign in | P2 | Clear path split before form |

#### [`version-c/02-form.html`](version-c/02-form.html) — Grouped form

| Design element | Addresses | Why |
| --- | --- | --- |
| Grouped sections | Liked structure + W3C | Conversation structure (Jarrett) |
| Company + address autofill | P5b | Country → postal → house lookup after context is clear |
| Benelux-first / EU list | Market reality | Matches Modeus partner geography |
| “Why we ask” on VAT & website | Insight 3 | Trust / privacy purpose clarity |
| Website optional | P4 | Same redesign as A/B |
| Meta note “not a popup” | P7 | Documents intentional pattern choice |
| Example description placeholder | Interview theme | Input guidance |

#### [`version-c/03-received.html`](version-c/03-received.html) — Confirmation

| Design element | Addresses | Why |
| --- | --- | --- |
| Repeats process pipeline with “Done / Now / Pending” | Insight 5 | Continuity from context page |
| Language-mirrored email note | P8 | Localisation expectation from I6 |
| Modeus B.V. Haarlem identity | P9 | Consistent operator naming |

---

## 6. Heuristic & HCD justification (summary)

| Choice | Primary justification |
| --- | --- |
| Rename to access request | Nielsen: match between system and real world |
| Progress / process steps | Nielsen: visibility of system status |
| Fewer required fields + optional extras | Aesthetic and minimalist design; privacy/trust literature |
| Purpose microcopy | Help and documentation; Jarrett conversation layer |
| Field-level errors (B demo) | Error prevention & recovery; Zuiver practice |
| Confirmation + SLA | Trust as condition for B2B data disclosure |
| Full pages not popups | Error prevention (accidental close) |
| Keep label clarity & field order | Don’t redesign what users already liked (HCD evaluate–iterate) |

---

## 8. Company lookup architecture (thesis note)

**Interaction (all versions):** Country → search (name / VAT / registration) → result list → confirm card → **Use these details** prefills company, VAT, street, house, postal, city, country. Fallback: **Enter manually**.

**Data sources in this prototype**
- **Demo catalogue** — simulates KVK/BRIS-style name search and full prefill (incl. Modeus B.V., Interiors B.V.).
- **VIES REST** (`/vies/rest-api/ms/{country}/vat/{number}`) — live EU VAT validation when the query looks like a VAT ID. Name/address only if the member state returns them; otherwise show “valid but incomplete profile”.
- **PDOK / Photon** — address fallback when company/VAT search fails or returns no address (country → postal → house).

**Fallback UX:** If Find your company fails or VIES returns an incomplete profile, the UI opens **Look up address instead** (postal + house number). Users can also choose this path deliberately without searching first.

**Change address:** After a successful company apply (or address lookup), an **Address on file** summary appears with **Change address** (edit fields) and **Look up a different address** (postal + house again). Confirm also offers **Use company, change address**.

**Production recommendation for Modeus**
- NL partners: **KVK Handelsregister API** for search + autofill (official prefill use case).
- All EU: **VIES** to validate VAT (not a guaranteed EU-wide company profile DB).
- Never assume every VAT returns a full address; always keep manual edit + confirm.

## 7. Recommended next step

For A/B or supervisory review: start with **Version A** as the balanced default, keep **Version C** context page as an optional entry if Modeus wants stronger pre-form education, and use **Version B** if business accepts lighter upfront verification.
