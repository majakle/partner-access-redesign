# Researcher guide — AB/BA study app

**Live URL:** https://majakle.github.io/partner-access-redesign/study/

## Auto-upload to Google Drive (required once)

GitHub Pages cannot write to Drive by itself. Deploy the free Apps Script bridge (2 minutes):

See [`../apps-script/DEPLOY.md`](../apps-script/DEPLOY.md) (or `study/apps-script/DEPLOY.md` on the live site repo).

Target folder:  
https://drive.google.com/drive/folders/1z114upASWme0DVJ-nbihWJu5nVRgOENk

After you paste the Web app URL into `config.js` and push, each participant’s JSON + recording upload automatically at the end.

## What you receive per participant

1. `{id}_{order}_{date}_results.json` — consent, order (AB/BA), SUS answers + scores, task times (ms), comparative answers, background  
2. `{id}_{order}_{date}_recording.webm` — screen recording  

If upload is not configured or fails, participants get local downloads as a fallback.

## Recording tip for participants

When prompted, choose **Chrome Tab** → **this study tab** (not Entire Screen). Forms load inside the page, so the recording stays on the registration UI.

Timers stop automatically when Version A shows success or Version B reaches the confirmation page.

### Invite text

> Please open this link on a laptop/desktop with Chrome or Edge:  
> https://majakle.github.io/partner-access-redesign/study/  
> Allow screen recording when asked (choose **this Chrome tab**, not Entire Screen). At the end, results upload to Drive automatically.

## SUS scoring (already in JSON)

Odd items (1,3,5,7,9): `rating − 1`  
Even items (2,4,6,8,10): `5 − rating`  
Sum × 2.5 → `susScore` 0–100 per version (`versions.A.susScore`, `versions.B.susScore`).

## Task time

`versions.A.taskTimeMs` / `versions.B.taskTimeMs` — from Open Version until confirmation / finish.
