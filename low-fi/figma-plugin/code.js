/**
 * Anonymous partner-access low-fi — matches Figma edits (v6)
 * LOGO / Company XYZ · rearranged fields · Enter details manually button
 */

(async () => {
  await Promise.all([
    figma.loadFontAsync({ family: "Inter", style: "Regular" }),
    figma.loadFontAsync({ family: "Inter", style: "Medium" }),
    figma.loadFontAsync({ family: "Inter", style: "Bold" }),
  ]);

  const ink = { r: 0.15, g: 0.15, b: 0.15 };
  const muted = { r: 0.45, g: 0.45, b: 0.45 };
  const line = { r: 0.72, g: 0.72, b: 0.72 };
  const pageBg = { r: 0.94, g: 0.94, b: 0.94 };
  const white = { r: 1, g: 1, b: 1 };
  const field = { r: 0.97, g: 0.97, b: 0.97 };
  const dark = { r: 0.22, g: 0.22, b: 0.22 };
  const soft = { r: 0.88, g: 0.88, b: 0.88 };
  const softOk = { r: 0.9, g: 0.92, b: 0.9 };
  const warnBg = { r: 1, g: 0.97, b: 0.93 };
  const warnInk = { r: 0.6, g: 0.2, b: 0.07 };
  const warnLine = { r: 0.99, g: 0.73, b: 0.45 };

  const W = 960;
  const H = 780;

  function fill(c) {
    return [{ type: "SOLID", color: c }];
  }

  function T(str, size, weight, color) {
    const t = figma.createText();
    t.fontName = { family: "Inter", style: weight || "Regular" };
    t.characters = String(str);
    t.fontSize = size;
    t.fills = fill(color || ink);
    return t;
  }

  function rect(parent, x, y, w, h, color, radius, strokeColor) {
    const r = figma.createRectangle();
    r.x = x;
    r.y = y;
    r.resize(w, h);
    r.fills = fill(color);
    if (radius) r.cornerRadius = radius;
    if (strokeColor) {
      r.strokes = fill(strokeColor);
      r.strokeWeight = 1;
    }
    parent.appendChild(r);
    return r;
  }

  function label(parent, str, x, y, size, weight, color) {
    const t = T(str, size, weight, color);
    t.x = x;
    t.y = y;
    parent.appendChild(t);
    return t;
  }

  function inputBox(parent, x, y, w, placeholder) {
    rect(parent, x, y, w, 40, field, 4, line);
    if (placeholder) label(parent, placeholder, x + 12, y + 12, 12, "Regular", line);
  }

  function button(parent, x, y, str, primary, width) {
    const w = width || Math.max(112, Math.round(str.length * 7.5) + 36);
    rect(parent, x, y, w, 40, primary ? dark : white, 4, dark);
    label(parent, str, x + 16, y + 12, 13, "Medium", primary ? white : ink);
    return w;
  }

  function buttonDisabled(parent, x, y, str, width) {
    const w = width || 112;
    rect(parent, x, y, w, 40, soft, 4, line);
    label(parent, str, x + 16, y + 12, 13, "Medium", muted);
    return w;
  }

  function buttonRow(parent, x, y, items) {
    let cx = x;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const w = it.disabled
        ? buttonDisabled(parent, cx, y, it.label, it.width)
        : button(parent, cx, y, it.label, !!it.primary, it.width);
      cx += w + 12;
    }
  }

  function drawHeader(parent) {
    rect(parent, 0, 0, W, 56, white, 0, line);
    label(parent, "LOGO", 32, 18, 14, "Bold", ink);
    label(parent, "NL / EN / DE", W - 220, 20, 12, "Regular", muted);
    rect(parent, W - 110, 14, 78, 28, white, 2, ink);
    label(parent, "Sign in", W - 92, 20, 12, "Medium", ink);
  }

  function drawProgress(parent, y, stepText, pct) {
    const trackX = 120;
    const trackW = 720;
    label(parent, stepText, trackX, y, 12, "Medium", muted);
    label(parent, pct + "%", trackX + trackW - 36, y, 12, "Medium", muted);
    rect(parent, trackX, y + 24, trackW, 8, { r: 0.82, g: 0.82, b: 0.82 }, 4);
    rect(parent, trackX, y + 24, Math.max(8, Math.round((trackW * pct) / 100)), 8, dark, 4);
  }

  function screenFrame(name, height) {
    const f = figma.createFrame();
    f.name = name;
    f.resize(W, height || H);
    f.fills = fill(pageBg);
    f.clipsContent = false;
    drawHeader(f);
    return f;
  }

  function buildGateway() {
    const f = screenFrame("01 · Gateway");
    rect(f, 120, 100, 720, 400, white, 8, line);
    label(f, "Partner with us", 148, 128, 28, "Bold", ink);
    label(f, "Apply for partner access and unlock tools built for showrooms,", 148, 172, 13, "Regular", muted);
    label(f, "projects, and made-to-order selling.", 148, 192, 13, "Regular", muted);
    label(f, "-  Configure products in 3D with your clients", 148, 230, 14, "Regular", ink);
    label(f, "-  Order through the partner portal", 148, 256, 14, "Regular", ink);
    label(f, "-  Keep catalogues current with product feeds", 148, 282, 14, "Regular", ink);
    button(f, 148, 330, "Start partner application", true, 210);
    label(f, "Already a partner? Sign in", 148, 390, 12, "Regular", muted);
    rect(f, 520, 230, 280, 140, field, 6, line);
    label(f, "Made for trade", 540, 250, 14, "Bold", ink);
    label(f, "Furniture retailers, interior designers,", 540, 280, 11, "Regular", muted);
    label(f, "and contract furnishers who sell with care.", 540, 298, 11, "Regular", muted);
    return f;
  }

  function buildContact() {
    const f = screenFrame("02 · Contact (25%)");
    drawProgress(f, 80, "Step 1 of 4 — Contact person", 25);
    rect(f, 120, 130, 720, 420, white, 8, line);
    label(f, "Contact person", 148, 156, 28, "Bold", ink);
    label(f, "We will use these details to contact you about your partner request.", 148, 198, 13, "Regular", muted);
    label(f, "Required fields are marked with *", 148, 220, 11, "Regular", muted);

    label(f, "First name *", 148, 255, 12, "Medium", muted);
    inputBox(f, 148, 275, 320, "");
    label(f, "Last name *", 488, 255, 12, "Medium", muted);
    inputBox(f, 488, 275, 320, "");

    label(f, "Work email *", 148, 335, 12, "Medium", muted);
    inputBox(f, 148, 355, 320, "e.g. name@company.com");
    label(f, "Phone number (optional)", 488, 335, 12, "Medium", muted);
    inputBox(f, 488, 355, 100, "NL +31");
    inputBox(f, 600, 355, 208, "");

    buttonRow(f, 148, 430, [
      { label: "Back", primary: false, width: 88 },
      { label: "Continue", primary: true, width: 112 },
    ]);
    return f;
  }

  function buildCompanySearch() {
    const f = screenFrame("03a · Company — search");
    drawProgress(f, 80, "Step 2 of 4 — Company details", 50);
    rect(f, 120, 130, 720, 340, white, 8, line);
    label(f, "Company details", 148, 156, 28, "Bold", ink);
    label(f, "Find your company by name or VAT ID.", 148, 198, 13, "Regular", ink);

    rect(f, 148, 240, 664, 120, field, 8, line);
    label(f, "Company name or VAT ID   (i)", 164, 256, 12, "Medium", muted);
    inputBox(f, 164, 278, 300, "e.g. Company XY or NL123456789B01");
    button(f, 476, 278, "Find company", true, 140);
    button(f, 628, 278, "Enter details manually", false, 168);

    buttonRow(f, 148, 400, [
      { label: "Back", primary: false, width: 88 },
      { label: "Continue", disabled: true, width: 112 },
    ]);
    return f;
  }

  function buildCompanyManual() {
    const f = screenFrame("03b · Company — manual entry", 980);
    drawProgress(f, 80, "Step 2 of 4 — Company details", 50);
    rect(f, 120, 130, 720, 780, white, 8, line);
    label(f, "Company details", 148, 156, 28, "Bold", ink);
    label(f, "Find your company by name or VAT ID. Required fields are marked with *", 148, 198, 12, "Regular", muted);

    rect(f, 148, 236, 664, 120, field, 8, line);
    label(f, "Company name or VAT ID   (i)", 164, 252, 12, "Medium", muted);
    inputBox(f, 164, 274, 300, "e.g. Company XY or NL123456789B01");
    button(f, 476, 274, "Find company", true, 140);
    button(f, 628, 274, "Enter details manually", false, 168);
    rect(f, 164, 328, 632, 22, soft, 4, line);
    label(f, "Enter company details manually. Look up address with postal and house number.", 176, 332, 11, "Regular", muted);

    rect(f, 148, 380, 664, 420, softOk, 8, line);
    label(f, "Company & address", 164, 400, 14, "Bold", dark);

    // Row: Company | VAT
    label(f, "Company name *", 164, 434, 12, "Medium", muted);
    inputBox(f, 164, 454, 300, "");
    label(f, "VAT ID *", 488, 434, 12, "Medium", muted);
    inputBox(f, 488, 454, 308, "");

    // Row: Postal | House | Look up
    label(f, "Postal code *", 164, 514, 12, "Medium", muted);
    inputBox(f, 164, 534, 160, "");
    label(f, "House number *", 344, 514, 12, "Medium", muted);
    inputBox(f, 344, 534, 160, "");
    button(f, 524, 534, "Look up address", false, 160);

    // Street full
    label(f, "Street *", 164, 594, 12, "Medium", muted);
    inputBox(f, 164, 614, 632, "");

    // City | Country
    label(f, "City *", 164, 674, 12, "Medium", muted);
    inputBox(f, 164, 694, 300, "");
    label(f, "Country *", 488, 674, 12, "Medium", muted);
    inputBox(f, 488, 694, 308, "Netherlands");

    buttonRow(f, 148, 840, [
      { label: "Back", primary: false, width: 88 },
      { label: "Continue", disabled: true, width: 112 },
    ]);
    return f;
  }

  function buildCompanyFound() {
    const f = screenFrame("03c · Company — found / confirm");
    drawProgress(f, 80, "Step 2 of 4 — Company details", 50);
    rect(f, 120, 130, 720, 500, white, 8, line);
    label(f, "Company details", 148, 156, 28, "Bold", ink);
    label(f, "Find your company by name or VAT ID.", 148, 198, 13, "Regular", ink);

    rect(f, 148, 232, 664, 300, field, 8, line);
    label(f, "Company name or VAT ID", 164, 248, 12, "Medium", muted);
    inputBox(f, 164, 270, 300, "e.g. Company XY or NL123456789B01");
    button(f, 476, 270, "Find company", true, 140);
    button(f, 628, 270, "Enter details manually", false, 168);

    rect(f, 164, 328, 140, 28, softOk, 4, line);
    label(f, "1 company found.", 176, 335, 12, "Medium", dark);

    rect(f, 164, 368, 632, 148, softOk, 6, line);
    label(f, "Check that these details are correct:", 180, 384, 13, "Bold", ink);
    label(f, "Company XY", 180, 412, 14, "Medium", ink);
    label(f, "Street · Street number · Postal code · City", 180, 436, 12, "Regular", muted);
    label(f, "Country · NL123456789B01", 180, 456, 12, "Regular", muted);
    buttonRow(f, 180, 480, [
      { label: "Use these details", primary: true, width: 168 },
      { label: "Search again", primary: false, width: 132 },
    ]);

    buttonRow(f, 148, 560, [
      { label: "Back", primary: false, width: 88 },
      { label: "Continue", disabled: true, width: 112 },
    ]);
    return f;
  }

  // ——— 03e After "Use these details" — fields filled ———
  function buildCompanyApplied() {
    const f = screenFrame("03e · Company — details applied", 980);
    drawProgress(f, 80, "Step 2 of 4 — Company details", 50);
    rect(f, 120, 130, 720, 780, white, 8, line);
    label(f, "Company details", 148, 156, 28, "Bold", ink);
    label(f, "Find your company by name or VAT ID.", 148, 198, 13, "Regular", ink);
    label(f, "Required fields are marked with *", 148, 220, 11, "Regular", muted);

    rect(f, 148, 248, 664, 120, field, 8, line);
    label(f, "Company name or VAT ID   (i)", 164, 264, 12, "Medium", muted);
    inputBox(f, 164, 286, 300, "Company");
    button(f, 476, 286, "Find company", true, 140);
    button(f, 628, 286, "Enter details manually", false, 168);
    rect(f, 164, 340, 632, 28, softOk, 4, line);
    label(f, "Company details applied. Please check they are correct.", 176, 348, 12, "Medium", dark);

    rect(f, 148, 400, 664, 400, softOk, 8, line);
    label(f, "Company & address", 164, 420, 14, "Bold", dark);

    label(f, "Company name *", 164, 454, 12, "Medium", muted);
    inputBox(f, 164, 474, 300, "Company XY");
    label(f, "VAT ID *", 488, 454, 12, "Medium", muted);
    inputBox(f, 488, 474, 308, "NL123456789B01");

    label(f, "Postal code *", 164, 534, 12, "Medium", muted);
    inputBox(f, 164, 554, 160, "1234 AB");
    label(f, "House number", 344, 534, 12, "Medium", muted);
    inputBox(f, 344, 554, 160, "12");
    button(f, 524, 554, "Look up address", false, 160);

    label(f, "Street *", 164, 614, 12, "Medium", muted);
    inputBox(f, 164, 634, 632, "Street");

    label(f, "City *", 164, 694, 12, "Medium", muted);
    inputBox(f, 164, 714, 300, "City");
    label(f, "Country *", 488, 694, 12, "Medium", muted);
    inputBox(f, 488, 714, 308, "Netherlands");

    buttonRow(f, 148, 840, [
      { label: "Back", primary: false, width: 88 },
      { label: "Continue", primary: true, width: 112 },
    ]);
    return f;
  }

  function buildCompanyNotFound() {
    const f = screenFrame("03d · Company — not found", 980);
    drawProgress(f, 80, "Step 2 of 4 — Company details", 50);
    rect(f, 120, 130, 720, 780, white, 8, line);
    label(f, "Company details", 148, 156, 28, "Bold", ink);
    label(f, "Find your company by name or VAT ID. Required fields are marked with *", 148, 198, 12, "Regular", muted);

    rect(f, 148, 236, 664, 130, field, 8, line);
    label(f, "Company name or VAT ID   (i)", 164, 252, 12, "Medium", muted);
    inputBox(f, 164, 274, 300, "e.g. Company XY or NL123456789B01");
    button(f, 476, 274, "Find company", true, 140);
    button(f, 628, 274, "Enter details manually", false, 168);
    rect(f, 164, 328, 632, 32, warnBg, 6, warnLine);
    label(f, "No company found. Please enter the details manually", 176, 338, 12, "Medium", warnInk);

    rect(f, 148, 390, 664, 420, softOk, 8, line);
    label(f, "Company & address", 164, 410, 14, "Bold", dark);

    label(f, "Company name *", 164, 444, 12, "Medium", muted);
    inputBox(f, 164, 464, 300, "Atelier Noord");
    label(f, "VAT ID *", 488, 444, 12, "Medium", muted);
    inputBox(f, 488, 464, 308, "");

    label(f, "Postal code *", 164, 524, 12, "Medium", muted);
    inputBox(f, 164, 544, 160, "");
    label(f, "House number *", 344, 524, 12, "Medium", muted);
    inputBox(f, 344, 544, 160, "");
    button(f, 524, 544, "Look up address", false, 160);

    label(f, "Street *", 164, 604, 12, "Medium", muted);
    inputBox(f, 164, 624, 632, "");

    label(f, "City *", 164, 684, 12, "Medium", muted);
    inputBox(f, 164, 704, 300, "");
    label(f, "Country *", 488, 684, 12, "Medium", muted);
    inputBox(f, 488, 704, 308, "Netherlands");

    buttonRow(f, 148, 840, [
      { label: "Back", primary: false, width: 88 },
      { label: "Continue", disabled: true, width: 112 },
    ]);
    return f;
  }

  function buildAbout() {
    const f = screenFrame("04 · About business (75%)");
    drawProgress(f, 80, "Step 3 of 4 — About your business", 75);
    rect(f, 120, 130, 720, 460, white, 8, line);
    label(f, "About your business", 148, 156, 28, "Bold", ink);
    label(f, "Optional details can help us review your request faster.", 148, 198, 13, "Regular", muted);

    label(f, "Company website (optional)", 148, 240, 12, "Medium", muted);
    inputBox(f, 148, 260, 320, "www.yourcompany.com");
    label(f, "Social media profile (optional)", 488, 240, 12, "Medium", muted);
    inputBox(f, 488, 260, 320, "Instagram, LinkedIn, or other profile URL");

    label(f, "About your company (optional)", 148, 320, 12, "Medium", muted);
    rect(f, 148, 340, 660, 72, field, 4, line);
    label(f, "Tell us briefly about your projects or showroom focus", 160, 352, 12, "Regular", line);

    rect(f, 148, 435, 16, 16, white, 2, line);
    label(f, "I agree to the terms and conditions of Company XYZ *", 174, 435, 13, "Regular", ink);
    buttonRow(f, 148, 480, [
      { label: "Back", primary: false, width: 88 },
      { label: "Request access", primary: true, width: 150 },
    ]);
    return f;
  }

  function buildConfirmation() {
    const f = screenFrame("05 · Confirmation (100%)", 860);
    drawProgress(f, 80, "Step 4 of 4 — Confirmation", 100);
    rect(f, 120, 130, 720, 500, white, 8, line);
    rect(f, 148, 158, 664, 44, softOk, 6, line);
    label(f, "Thank you — your partner application is with our team.", 164, 172, 13, "Medium", ink);
    label(f, "You're one step closer", 148, 230, 28, "Bold", ink);
    label(f, "We're reviewing your details so we can welcome the right partners.", 148, 274, 13, "Regular", muted);
    label(f, "1  You'll receive an email confirming we have your application.", 148, 320, 14, "Regular", ink);
    label(f, "2  Our team carefully reviews every partner request.", 148, 352, 14, "Regular", ink);
    label(f, "3  You'll hear from us within 3 business days.", 148, 384, 14, "Regular", ink);
    label(f, "If approved, we'll show you how to get started.", 148, 408, 13, "Regular", muted);
    button(f, 148, 450, "Back to homepage", true, 170);
    return f;
  }

  const stack = [
    ["01 · Gateway", buildGateway()],
    ["02 · Contact (25%)", buildContact()],
    ["03a · Company — search", buildCompanySearch()],
    ["03b · Company — manual entry", buildCompanyManual()],
    ["03c · Company — found / confirm", buildCompanyFound()],
    ["03d · Company — not found", buildCompanyNotFound()],
    ["03e · Company — details applied", buildCompanyApplied()],
    ["04 · About business (75%)", buildAbout()],
    ["05 · Confirmation (100%)", buildConfirmation()],
  ];

  let y = 0;
  const placed = [];
  for (const [name, frame] of stack) {
    const tag = T(name, 16, "Bold", ink);
    tag.x = 0;
    tag.y = y;
    figma.currentPage.appendChild(tag);
    frame.x = 0;
    frame.y = y + 28;
    figma.currentPage.appendChild(frame);
    placed.push(frame);
    y = frame.y + frame.height + 80;
  }

  const notes = figma.createFrame();
  notes.name = "Annotations";
  notes.resize(420, 260);
  notes.x = W + 80;
  notes.y = 0;
  notes.fills = fill(white);
  notes.strokes = fill(line);
  notes.cornerRadius = 8;
  figma.currentPage.appendChild(notes);
  label(notes, "Anonymous low-fi (v8)", 20, 20, 16, "Bold", ink);
  label(notes, "Combined rows: company|VAT, city|country", 20, 56, 12, "Regular", muted);
  label(notes, "About: website | social on one row", 20, 80, 12, "Regular", muted);
  label(notes, "03e applied = filled fields, no confirm card", 20, 104, 12, "Regular", muted);
  label(notes, "CTA: Go to homepage", 20, 128, 12, "Regular", muted);

  figma.currentPage.name = "Partner access — anonymous low-fi";
  const applied = stack.find((s) => s[0].includes("03b"));
  figma.viewport.scrollAndZoomIntoView([applied[1]]);
  figma.closePlugin("v8: combined input rows (company/VAT, website/social, address).");
})().catch((err) => {
  figma.closePlugin("Error: " + (err && err.message ? err.message : String(err)));
});
