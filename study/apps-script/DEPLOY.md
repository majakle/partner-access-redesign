# One-time setup: auto-upload to Google Drive

Participants cannot upload to Drive from GitHub Pages without a tiny free bridge.

## Deploy the bridge (once)

1. Open [script.google.com](https://script.google.com) while logged into the Google account that owns the Drive folder.
2. **New project** → paste everything from [`Code.gs`](Code.gs).
3. **Save**.
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize, copy the **Web app URL** (ends with `/exec`).
6. Paste it into [`../web/config.js`](../web/config.js) and [`../../mockups/study/config.js`](../../mockups/study/config.js):

```js
endpoint: "https://script.google.com/macros/s/XXXX/exec",
```

7. Commit & push `mockups/study/config.js` so GitHub Pages picks it up.
8. Confirm the folder is yours:  
   https://drive.google.com/drive/folders/1z114upASWme0DVJ-nbihWJu5nVRgOENk

## Test

Open the study app → complete a short session → you should see new `_results.json` and `_recording.webm` in that folder.
