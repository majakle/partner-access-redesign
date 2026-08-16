# Researcher guide — AB/BA study app

**Live URL:** https://majakle.github.io/partner-access-redesign/study/

## How participants work

1. Forms open in a **new browser tab** (not embedded).
2. For each version, the browser asks to share a tab — participants choose **Chrome Tab → that form tab** only.
3. You get **two short recordings** (Version A + Version B). Questionnaires are not recorded.
4. Timers stop via `postMessage` when Version A shows success or Version B reaches confirmation.

## Auto-upload to Google Drive (required once)

See [`apps-script/DEPLOY.md`](../apps-script/DEPLOY.md) (or `study/apps-script/DEPLOY.md`).

Target folder:  
https://drive.google.com/drive/folders/1z114upASWme0DVJ-nbihWJu5nVRgOENk

## What you receive per participant

1. `{id}_{order}_{date}_results.json`
2. `{id}_{order}_{date}_VersionA_recording.webm`
3. `{id}_{order}_{date}_VersionB_recording.webm`

### Invite text

> Please open this link on a laptop/desktop with Chrome or Edge:  
> https://majakle.github.io/partner-access-redesign/study/  
> Use Chrome or Edge. For each version click **Start recording & open form**, choose **Window → Google Chrome**, then complete the form. On Mac, enable Chrome under System Settings → Privacy & Security → Screen Recording.

## SUS scoring (already in JSON)

Odd items (1,3,5,7,9): `rating − 1`  
Even items (2,4,6,8,10): `5 − rating`  
Sum × 2.5 → `susScore` 0–100 per version.

## Task time

`versions.A.taskTimeMs` / `versions.B.taskTimeMs` — from Open form until confirmation / finish.
