# Full AB/BA study harness

**Live:** https://majakle.github.io/partner-access-redesign/study/

One link for participants: consent → screen record → Design 1 + SUS → Design 2 + SUS → download files → comparative questions.

Optional balanced invite: Apps Script Web App → opens  
`/study/?pid=P21&order=AB`

## Local preview

```bash
cd ab-ba-study/harness && python3 -m http.server 8766
```

## Deploy

```bash
cp -R ab-ba-study/harness/* mockups/study/
cd mockups && git add study && git commit -m "Restore full AB/BA study harness" && git push
```

Prefer Chrome or Edge. Choose **Entire screen** when sharing.
