/**
 * AB/BA study → Google Drive upload bridge (FREE)
 *
 * SETUP (about 2 minutes):
 * 1. Open https://script.google.com → New project
 * 2. Delete any default code; paste this entire file into Code.gs
 * 3. Save (Ctrl/Cmd+S)
 * 4. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Deploy → copy the Web app URL
 * 6. Paste that URL into study/config.js as uploadEndpoint
 * 7. Ensure this folder is in YOUR Google Drive (you own it):
 *    https://drive.google.com/drive/folders/1z114upASWme0DVJ-nbihWJu5nVRgOENk
 *
 * After setup, participants’ JSON + video go into that folder automatically.
 */

var FOLDER_ID = "1z114upASWme0DVJ-nbihWJu5nVRgOENk";
var SHARED_SECRET = "abba-thesis-2026";

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || "{}";
    var data = JSON.parse(raw);

    if (data.secret !== SHARED_SECRET) {
      return json_({ ok: false, error: "Unauthorized" });
    }

    var folder = DriveApp.getFolderById(FOLDER_ID);
    var base =
      (data.participantId || "Punknown") +
      "_" +
      (data.order || "XX") +
      "_" +
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HHmmss");

    var jsonName = base + "_results.json";
    var jsonBody =
      typeof data.resultsJson === "string"
        ? data.resultsJson
        : JSON.stringify(data.results || data, null, 2);

    var jsonFile = folder.createFile(
      Utilities.newBlob(jsonBody, "application/json", jsonName)
    );

    var videoMeta = null;
    if (data.videoBase64 && data.videoBase64.length > 0) {
      var mime = data.videoMime || "video/webm";
      var videoName = base + "_recording.webm";
      var decoded = Utilities.base64Decode(data.videoBase64);
      var videoFile = folder.createFile(
        Utilities.newBlob(decoded, mime, videoName)
      );
      videoMeta = { id: videoFile.getId(), name: videoFile.getName(), url: videoFile.getUrl() };
    }

    return json_({
      ok: true,
      json: { id: jsonFile.getId(), name: jsonFile.getName(), url: jsonFile.getUrl() },
      video: videoMeta,
      folderUrl:
        "https://drive.google.com/drive/folders/" + FOLDER_ID,
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({
    ok: true,
    service: "AB/BA study Drive uploader",
    folderId: FOLDER_ID,
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
