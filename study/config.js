/**
 * Upload bridge config.
 * After deploying apps-script/Code.gs, paste the Web app URL below.
 */
window.STUDY_UPLOAD = {
  /** @type {string} Google Apps Script web app URL */
  endpoint: "https://script.google.com/macros/s/AKfycbwHMWBmvXE9wRJBtDFaSnp15qGs_JmYrYlegVpaizER3rxmKzJok33HLSoh1U5At4Yt/exec",
  folderId: "1z114upASWme0DVJ-nbihWJu5nVRgOENk",
  folderUrl:
    "https://drive.google.com/drive/folders/1z114upASWme0DVJ-nbihWJu5nVRgOENk?usp=sharing",
  secret: "abba-thesis-2026",
  /** Apps Script ~50MB request limit; one video per request (base64 expands ~33%) */
  maxVideoBytes: 28 * 1024 * 1024,
};
