import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const schema = z.object({ key: z.string().min(1).max(200) });

const ADMIN_ACCESS_KEY = "iosebi-mariami";
// These are public browser credentials, not privileged database secrets.
// Keeping them here makes the admin RPC independent from Vercel runtime env injection.
const BACKEND_URL = "https://mlrwpwfzsstlfmzilunz.supabase.co";
const BACKEND_PUBLISHABLE_KEY = "sb_publishable__GHPDwcba6wposjVVU8wtQ_p4BLLjSp";

export const fetchRsvps = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    if (data.key !== ADMIN_ACCESS_KEY) {
      return { ok: false as const, reason: "bad_key" as const, rows: [] };
    }

    const supabase = createClient<Database>(BACKEND_URL, BACKEND_PUBLISHABLE_KEY, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (h.get("Authorization") === `Bearer ${BACKEND_PUBLISHABLE_KEY}`) {
            h.delete("Authorization");
          }
          h.set("apikey", BACKEND_PUBLISHABLE_KEY);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: rows, error } = await supabase.rpc("admin_list_rsvps", {
      _key: data.key,
    });

    if (error) {
      console.error("[admin] rsvps fetch failed", error.message);
      return { ok: false as const, reason: "db" as const, rows: [] };
    }

    return { ok: true as const, reason: "ok" as const, rows: rows ?? [] };
  });

const deleteSchema = z.object({ key: z.string().min(1).max(200), id: z.string().uuid() });

export const deleteRsvp = createServerFn({ method: "POST" })
  .inputValidator((data) => deleteSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.key !== ADMIN_ACCESS_KEY) {
      return { ok: false as const, reason: "bad_key" as const };
    }

    const supabase = createClient<Database>(BACKEND_URL, BACKEND_PUBLISHABLE_KEY, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (h.get("Authorization") === `Bearer ${BACKEND_PUBLISHABLE_KEY}`) {
            h.delete("Authorization");
          }
          h.set("apikey", BACKEND_PUBLISHABLE_KEY);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: okRes, error } = await supabase.rpc("admin_delete_rsvp", {
      _key: data.key,
      _id: data.id,
    });

    if (error || okRes !== true) {
      console.error("[admin] rsvp delete failed", error?.message);
      return { ok: false as const, reason: "db" as const };
    }

    return { ok: true as const, reason: "ok" as const };
  });
