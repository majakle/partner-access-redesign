# Researcher guide — AB/BA study app

**Live URL:** https://majakle.github.io/partner-access-redesign/study/

## How participants work

1. Inclusion: **desktop/laptop + Chrome or Edge** only.
2. Forms open in a **new browser tab**; share **Window → Google Chrome**.
3. AB/BA order is assigned **alternately** via the Apps Script counter (falls back to this browser’s localStorage if the counter is unavailable).
4. On finish: **Submitting… keep this page open** → wait for Drive upload → thank you (or error + retry).

## Auto-upload to Google Drive (required once)

See [`apps-script/DEPLOY.md`](../apps-script/DEPLOY.md). Redeploy after updating `Code.gs` so `nextOrder` works.

Target folder:  
https://drive.google.com/drive/folders/1z114upASWme0DVJ-nbihWJu5nVRgOENk

## What you receive per participant

1. `{id}_{order}_{date}_results.json` — includes `order`, `assignIndex`, `assignmentMethod`, `reachedConfirmationPage` / `reachedConfirmationAuto`
2. `{id}_{order}_{date}_VersionA_recording.webm`
3. `{id}_{order}_{date}_VersionB_recording.webm`

### Invite text

> Please open this link on a laptop/desktop with Chrome or Edge only:  
> https://majakle.github.io/partner-access-redesign/study/  
> For each version click **Start recording & open form**, choose **Window → Google Chrome**, then complete the form. Keep the page open until you see that your responses have been saved.

## SUS scoring (already in JSON)

Odd items (1,3,5,7,9): `rating − 1`  
Even items (2,4,6,8,10): `5 − rating`  
Sum × 2.5 → `susScore` 0–100 per version.

## Task time

`versions.A.taskTimeMs` / `versions.B.taskTimeMs` — measured silently from open form until confirmation / finish.
