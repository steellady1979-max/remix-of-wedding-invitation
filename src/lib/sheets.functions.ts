import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SPREADSHEET_ID = "1Okt8t-VgO-TAPtGrLJkDla2llh8y-QodV60149X68Zg";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

async function appendRow(sheet: "RSVP" | "Wishes", values: (string | number)[]) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !sheetsKey) throw new Error("Google Sheets connection is not configured");

  const url = `${GATEWAY_URL}/spreadsheets/${SPREADSHEET_ID}/values/${sheet}!A:F:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": sheetsKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [values] }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Sheets append failed [${res.status}]: ${body}`);
    throw new Error(`Sheets append failed [${res.status}]: ${body}`);
  }
}

function nowTbilisi() {
  return new Date().toLocaleString("ka-GE", { timeZone: "Asia/Tbilisi" });
}

export const submitRsvp = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        fullName: z.string().trim().min(2).max(120),
        attending: z.enum(["yes", "no"]),
        guests: z.number().int().min(0).max(10),
        plusOneName: z.string().trim().max(120).nullable().optional(),
        message: z.string().trim().max(1000).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await appendRow("RSVP", [
      nowTbilisi(),
      data.fullName,
      data.attending === "yes" ? "დიახ" : "ვერ დავესწრები",
      data.guests,
      data.plusOneName ?? "",
      data.message ?? "",
    ]);
    return { ok: true };
  });

export const submitWish = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        message: z.string().trim().min(1).max(600),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await appendRow("Wishes", [nowTbilisi(), data.name, data.message]);
    return { ok: true };
  });
