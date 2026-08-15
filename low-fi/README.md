# Modeus signup — low-fi for Figma

## Important: reload the plugin after code changes

Figma often keeps an old copy of the plugin. After updates:

1. **Plugins → Development → Modeus Signup Low-fi → Remove** (or Import again)
2. **Plugins → Development → Import plugin from manifest…**
3. Select `mockups/low-fi/figma-plugin/manifest.json`
4. Run **Modeus Signup Low-fi**

You should land zoomed on **05 · Confirmation (100%)** at the top of the page.

## If Confirmation still missing — drag this SVG in

1. Open Finder at `mockups/low-fi/05-confirmation.svg`
2. Drag the file onto the Figma canvas  
   (or **Edit → Place image…** / drag from desktop)

That file is the confirmation screen only.

## What the plugin creates

Stacked top → bottom:

1. **05 · Confirmation (100%)** ← created first, fixed 960×780
2. 01 · Gateway
3. 02 · Contact
4. 03 · Company
5. 04 · About business
6. Annotations (to the right)

Also open [`index.html`](index.html) in a browser for a full grayscale preview.
