# AB/BA study harness

Self-serve remote study app: consent → screen share → timed Design 1 → SUS → timed Design 2 → SUS → download recording + JSON → comparative questions.

## Live URL

https://majakle.github.io/partner-access-redesign/study/

## Local preview

```bash
cd ab-ba-study/harness
python3 -m http.server 8766
```

Open http://127.0.0.1:8766/ (screen capture requires a secure context: localhost is OK).

## Participant flow

1. Enter participant ID + consents  
2. Allow screen share — choose **Entire screen**  
3. Open Design 1 (timer starts) → finish → 10-item SUS  
4. Open Design 2 → finish → SUS  
5. Download `Pxx_recording.webm` and `Pxx_results.json`  
6. Answer 3 comparative questions + background  
7. Upload both files to your Google Drive / Form

## Order

Odd last digit of ID → **AB** (baseline then redesign). Even → **BA**. Codes `A`/`B` are only in the JSON, not shown as “old/new”.

## Deploy

Copy this folder’s files into the Pages repo at `study/`:

```bash
cp -R ab-ba-study/harness/* mockups/study/
cd mockups && git add study && git commit -m "Add AB/BA study harness" && git push
```

## Browser

Prefer **Chrome** or **Edge**. Safari MediaRecorder support is limited.
