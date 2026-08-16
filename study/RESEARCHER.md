# Researcher guide — AB/BA study app

**Live URL (after deploy):** https://majakle.github.io/partner-access-redesign/study/

## What you receive per participant

1. `{id}_{order}_{date}_results.json` — consent, order (AB/BA), SUS answers + scores, task times (ms), comparative answers, background  
2. `{id}_{order}_{date}_recording.webm` — screen recording  

Participants are instructed to email both files to **maja.skale@student.um.si** (or upload to your Drive folder).

## Invite text (short)

> Please open this link on a laptop/desktop with Chrome or Edge:  
> https://majakle.github.io/partner-access-redesign/study/  
> Allow screen recording when asked (choose Entire Screen). At the end, download the two files and email them to maja.skale@student.um.si.

## SUS scoring (already in JSON)

Odd items (1,3,5,7,9): `rating − 1`  
Even items (2,4,6,8,10): `5 − rating`  
Sum × 2.5 → `susScore` 0–100 per version (`versions.A.susScore`, `versions.B.susScore`).

## Task time

`versions.A.taskTimeMs` / `versions.B.taskTimeMs` — from Open Version until “I finished”.

## Merge tips

Drop all JSON files in a folder and use a small script or spreadsheet import. Keep Phase 1 Google Form data separate from Phase 2 AB/BA files.
