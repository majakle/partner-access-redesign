# Recording & timing helper (Form-first)

Use with the Google Form as the main questionnaire.

**Helper:** https://majakle.github.io/partner-access-redesign/study/  
**Form:** https://docs.google.com/forms/d/e/1FAIpQLSeXeWUYzFARmml6SxdrWYBA78pfs4-ltLulygOXVXgUJoUO_g/viewform

## What this page does

1. Screen share (Entire screen)  
2. Open Version 1 → auto timer → Finished  
3. Reminds you to complete SUS in the Form  
4. Open Version 2 → timer → Finished  
5. Download `*_recording.webm` + `*_times.json`

No SUS or comparative questions here — those stay in the Form.

## Local preview

```bash
cd ab-ba-study/harness && python3 -m http.server 8766
```

Optional query: `?pid=P21&order=AB`

## Deploy

```bash
cp -R ab-ba-study/harness/* mockups/study/
cd mockups && git add study && git commit -m "Slim study helper for Form-first AB/BA" && git push
```
