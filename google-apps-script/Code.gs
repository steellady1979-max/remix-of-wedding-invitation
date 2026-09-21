const SPREADSHEET_ID = "1hFW7SxiVZj4t5XI4wSO2LwajsGQFtE-q8m-ajrPhRkA";
const TIME_ZONE = "Asia/Tbilisi";

function doGet() {
  return jsonResponse({ ok: true, service: "wedding-invitation-sheets" });
}

function doPost(event) {
  try {
    const data = JSON.parse(event.postData.contents || "{}");
    authorize(data.secret);

    if (data.action === "rsvp") return saveRsvp(data);
    if (data.action === "wish") return saveWish(data);
    if (data.action === "listWishes") return getWishes();

    throw new Error("Unknown action");
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: error.message || "Request failed" });
  }
}

function saveRsvp(data) {
  const fullName = requiredText(data.fullName, "fullName", 2, 120);
  const attending = oneOf(data.attending, "attending", ["yes", "no"]);
  const guests = integerInRange(data.guests, "guests", 0, 10);
  const plusOneName = optionalText(data.plusOneName, "plusOneName", 120);

  if (attending === "yes" && guests < 1) throw new Error("Invalid guest count");
  if (attending === "no" && guests !== 0) throw new Error("Invalid guest count");

  appendRow("RSVP", [
    nowTbilisi(),
    safeCell(fullName),
    attending === "yes" ? "დიახ" : "ვერ დავესწრები",
    guests,
    safeCell(plusOneName),
  ]);

  return jsonResponse({ ok: true });
}

function saveWish(data) {
  const name = requiredText(data.name, "name", 1, 80);
  const message = requiredText(data.message, "message", 1, 2000);

  appendRow("Wishes", [nowTbilisi(), safeCell(name), safeCell(message)]);
  return jsonResponse({ ok: true });
}

function getWishes() {
  const sheet = spreadsheet().getSheetByName("Wishes");
  if (!sheet) throw new Error("Wishes sheet was not found");

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ ok: true, wishes: [] });

  const wishes = sheet
    .getRange(2, 1, lastRow - 1, 3)
    .getDisplayValues()
    .filter(function (row) {
      return row[1].trim() && row[2].trim();
    })
    .map(function (row) {
      return { date: row[0], name: row[1], message: row[2] };
    });

  return jsonResponse({ ok: true, wishes: wishes });
}

function appendRow(sheetName, values) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = spreadsheet().getSheetByName(sheetName);
    if (!sheet) throw new Error(sheetName + " sheet was not found");
    sheet.appendRow(values);
  } finally {
    lock.releaseLock();
  }
}

function spreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function authorize(receivedSecret) {
  const expectedSecret = PropertiesService.getScriptProperties().getProperty("API_SECRET");
  if (!expectedSecret) throw new Error("API_SECRET is not configured");
  if (typeof receivedSecret !== "string" || receivedSecret !== expectedSecret) {
    throw new Error("Unauthorized");
  }
}

function requiredText(value, field, minLength, maxLength) {
  if (typeof value !== "string") throw new Error("Invalid " + field);
  const text = value.trim();
  if (text.length < minLength || text.length > maxLength) throw new Error("Invalid " + field);
  return text;
}

function optionalText(value, field, maxLength) {
  if (value === null || typeof value === "undefined" || value === "") return "";
  if (typeof value !== "string") throw new Error("Invalid " + field);
  const text = value.trim();
  if (text.length > maxLength) throw new Error("Invalid " + field);
  return text;
}

function oneOf(value, field, allowed) {
  if (allowed.indexOf(value) === -1) throw new Error("Invalid " + field);
  return value;
}

function integerInRange(value, field, min, max) {
  if (typeof value !== "number" || value % 1 !== 0 || value < min || value > max) {
    throw new Error("Invalid " + field);
  }
  return value;
}

function safeCell(value) {
  if (typeof value !== "string") return value;
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function nowTbilisi() {
  return Utilities.formatDate(new Date(), TIME_ZONE, "dd.MM.yyyy HH:mm:ss");
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
