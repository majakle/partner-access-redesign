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
 * 6. Paste that URL into study/config.js as endpoint
 * 7. Ensure this folder is in YOUR Google Drive (you own it):
 *    https://drive.google.com/drive/folders/1z114upASWme0DVJ-nbihWJu5nVRgOENk
 *
 * Client uploads in separate requests (stays under Apps Script ~50MB limit):
 *   action=uploadResults  → *_results.json
 *   action=uploadVideo    → *_VersionA/B_recording.webm (one video per request)
 * Legacy combined payloads are still accepted.
 *
 * AB/BA order is assigned alternately via action=nextOrder
 */

var FOLDER_ID = "1z114upASWme0DVJ-nbihWJu5nVRgOENk";
var SHARED_SECRET = "abba-thesis-2026";

function nextOrder_() {
  var props = PropertiesService.getScriptProperties();
  var n = Number(props.getProperty("assignCount") || "0");
  var order = n % 2 === 0 ? "AB" : "BA";
  props.setProperty("assignCount", String(n + 1));
  return { order: order, assignIndex: n + 1 };
}

function folder_() {
  return DriveApp.getFolderById(FOLDER_ID);
}

function makeBase_(data) {
  if (data.fileBase && String(data.fileBase).length) {
    return String(data.fileBase).replace(/[^\w.\-]+/g, "_");
  }
  return (
    (data.participantId || "Punknown") +
    "_" +
    (data.order || "XX") +
    "_" +
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd_HHmmss"
    )
  );
}

function saveResults_(data) {
  var folder = folder_();
  var base = makeBase_(data);
  var jsonName = base + "_results.json";
  var jsonBody =
    typeof data.resultsJson === "string"
      ? data.resultsJson
      : JSON.stringify(data.results || data, null, 2);
  var jsonFile = folder.createFile(
    Utilities.newBlob(jsonBody, "application/json", jsonName)
  );
  return {
    ok: true,
    fileBase: base,
    json: {
      id: jsonFile.getId(),
      name: jsonFile.getName(),
      url: jsonFile.getUrl(),
    },
    folderUrl: "https://drive.google.com/drive/folders/" + FOLDER_ID,
  };
}

function saveVideo_(data) {
  if (!data.base64) {
    return { ok: false, error: "Missing video data" };
  }
  var folder = folder_();
  var base = makeBase_(data);
  var mime = data.mime || "video/webm";
  var ver = data.version || "X";
  var videoName = base + "_Version" + ver + "_recording.webm";
  var decoded = Utilities.base64Decode(data.base64);
  var videoFile = folder.createFile(Utilities.newBlob(decoded, mime, videoName));
  return {
    ok: true,
    fileBase: base,
    video: {
      version: ver,
      id: videoFile.getId(),
      name: videoFile.getName(),
      url: videoFile.getUrl(),
    },
    folderUrl: "https://drive.google.com/drive/folders/" + FOLDER_ID,
  };
}

function saveLegacyCombined_(data) {
  var result = saveResults_(data);
  var videosMeta = [];

  if (data.videos && data.videos.length) {
    for (var i = 0; i < data.videos.length; i++) {
      var vid = data.videos[i];
      if (!vid || !vid.base64) continue;
      var one = saveVideo_({
        fileBase: result.fileBase,
        participantId: data.participantId,
        order: data.order,
        version: vid.version || String(i + 1),
        base64: vid.base64,
        mime: vid.mime || "video/webm",
      });
      if (one.ok && one.video) videosMeta.push(one.video);
    }
  } else if (data.videoBase64 && data.videoBase64.length > 0) {
    var legacy = saveVideo_({
      fileBase: result.fileBase,
      participantId: data.participantId,
      order: data.order,
      version: "A",
      base64: data.videoBase64,
      mime: data.videoMime || "video/webm",
    });
    if (legacy.ok && legacy.video) videosMeta.push(legacy.video);
  }

  return {
    ok: true,
    fileBase: result.fileBase,
    json: result.json,
    videos: videosMeta,
    video: videosMeta.length ? videosMeta[0] : null,
    folderUrl: result.folderUrl,
  };
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || "{}";
    var data = JSON.parse(raw);

    if (data.action === "nextOrder") {
      if (data.secret !== SHARED_SECRET) {
        return json_({ ok: false, error: "Unauthorized" });
      }
      var assigned = nextOrder_();
      return json_({
        ok: true,
        order: assigned.order,
        assignIndex: assigned.assignIndex,
        method: "apps-script-counter",
      });
    }

    if (data.secret !== SHARED_SECRET) {
      return json_({ ok: false, error: "Unauthorized" });
    }

    if (data.action === "uploadResults") {
      return json_(saveResults_(data));
    }

    if (data.action === "uploadVideo") {
      return json_(saveVideo_(data));
    }

    // Legacy: one request with JSON + both videos
    return json_(saveLegacyCombined_(data));
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.action === "nextOrder") {
      var assigned = nextOrder_();
      return json_({
        ok: true,
        order: assigned.order,
        assignIndex: assigned.assignIndex,
        method: "apps-script-counter",
      });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
  return json_({
    ok: true,
    service: "AB/BA study Drive uploader",
    folderId: FOLDER_ID,
    supports: ["nextOrder", "uploadResults", "uploadVideo", "legacy-combined"],
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
