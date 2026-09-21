import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Wish = { date: string; name: string; message: string };

type AppsScriptResponse<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error?: string };

async function callGoogleSheets<T extends object>(payload: object): Promise<T> {
  const url = process.env["GOOGLE_APPS_SCRIPT_URL"];
  const secret = process.env["GOOGLE_APPS_SCRIPT_SECRET"];

  if (!url || !secret) {
    throw new Error("Google Sheets connection is not configured");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, secret }),
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script request failed [${response.status}]`);
  }

  const result = (await response.json()) as AppsScriptResponse<T>;
  if (!result.ok) {
    throw new Error(result.error || "Google Apps Script request failed");
  }

  return result;
}

export const submitRsvp = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        fullName: z.string().trim().min(2).max(120),
        attending: z.enum(["yes", "no"]),
        guests: z.number().int().min(0).max(10),
        plusOneName: z.string().trim().max(120).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await callGoogleSheets({ action: "rsvp", ...data });
    return { ok: true };
  });

export const submitWish = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        message: z.string().trim().min(1).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await callGoogleSheets({ action: "wish", ...data });
    return { ok: true };
  });

export const listWishes = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const result = await callGoogleSheets<{ wishes: Wish[] }>({ action: "listWishes" });
    return { wishes: result.wishes ?? [] };
  } catch (error) {
    console.error("Google Sheets read failed", error);
    return { wishes: [] as Wish[] };
  }
});
