import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function createClient() { const store = await cookies(); const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; if (!url || !key) throw new Error("Supabase環境変数が設定されていません"); return createServerClient(url, key, { cookies: { getAll: () => store.getAll(), setAll: values => { try { values.forEach(v => store.set(v.name, v.value, v.options)); } catch {} } } }); }
