import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { required } from "./env";
import type { EklinkClaims } from "./eklink";

let cachedDb: SupabaseClient | null = null;
let cachedUrl: string | null = null;
let cachedKey: string | null = null;

export function getDb(): SupabaseClient {
  const url = required("SUPABASE_URL");
  const key = required("SUPABASE_SECRET_KEY");
  if (!cachedDb || cachedUrl !== url || cachedKey !== key) {
    cachedDb = createClient(url, key, { auth: { persistSession: false } });
    cachedUrl = url;
    cachedKey = key;
  }
  return cachedDb;
}

export const db: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export async function upsertPerson(c: EklinkClaims) {
  const client = getDb();
  const { error } = await client.from("people").upsert(
    {
      login_id: c.login_id,
      eklink_sub: c.sub,
      name: c.name,
      email: c.email,
      eklink_role: c.role,
      department: c.department,
      batch: c.batch,
      section: c.section,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "login_id" }
  );
  if (error) throw new Error("person_upsert_failed");
}
