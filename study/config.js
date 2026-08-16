/**
 * Upload bridge config.
 * After deploying apps-script/Code.gs, paste the Web app URL below.
 */
window.STUDY_UPLOAD = {
  /** @type {string} Google Apps Script web app URL */
  endpoint: "https://script.google.com/macros/s/AKfycbxMJM_KJkINBjbpJtG0efbsqLSI6YGnXmHLhCQSxvTPDkbLJd0cOhUCMehrbw0_UenI/exec",
  folderId: "1z114upASWme0DVJ-nbihWJu5nVRgOENk",
  folderUrl:
    "https://drive.google.com/drive/folders/1z114upASWme0DVJ-nbihWJu5nVRgOENk?usp=sharing",
  secret: "abba-thesis-2026",
  /** Apps Script request limit ~50MB; keep video under this (base64 expands ~33%) */
  maxVideoBytes: 28 * 1024 * 1024,
};
