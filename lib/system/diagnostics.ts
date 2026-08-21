import "server-only";

import { getEmailDiagnostics } from "@/lib/auth/email-diagnostics";
import { createAdminClient } from "@/lib/supabase/admin";

export const requiredDatabaseTables = [
  "profiles",
  "hub_materials",
  "hub_material_versions",
  "hub_attempts",
  "hub_answers",
  "hub_answer_assets",
  "hub_feedback",
  "hub_characters",
  "hub_visual_assets",
  "hub_character_assets",
  "hub_user_settings",
  "hub_activity_logs",
  "hub_classrooms",
  "hub_classroom_members",
  "hub_assignments",
  "hub_assignment_submissions",
  "hub_ai_generations",
] as const;

export type DiagnosticCheck = {
  id: string;
  label: string;
  ready: boolean;
  code?: string;
};

function safeErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(error.code)) return error.code;
  return "check_failed";
}

export async function getSystemDiagnostics() {
  const email = getEmailDiagnostics();
  const publicSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const adminSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

  const database: DiagnosticCheck[] = requiredDatabaseTables.map(table => ({
    id: table,
    label: table,
    ready: false,
    code: adminSupabaseConfigured ? "not_checked" : "admin_connection_not_configured",
  }));
  const storage: DiagnosticCheck = {
    id: "gakugaku-assets",
    label: "gakugaku-assets（Private）",
    ready: false,
    code: adminSupabaseConfigured ? "not_checked" : "admin_connection_not_configured",
  };

  if (adminSupabaseConfigured) {
    const admin = createAdminClient();
    const tableResults = await Promise.all(requiredDatabaseTables.map(async table => {
      try {
        const { error } = await admin.from(table).select("*", { count: "exact", head: true });
        return { id: table, label: table, ready: !error, code: error ? safeErrorCode(error) : undefined } satisfies DiagnosticCheck;
      } catch (error) {
        return { id: table, label: table, ready: false, code: safeErrorCode(error) } satisfies DiagnosticCheck;
      }
    }));
    database.splice(0, database.length, ...tableResults);

    try {
      const { data, error } = await admin.storage.getBucket("gakugaku-assets");
      storage.ready = !error && Boolean(data) && data.public === false;
      storage.code = error ? safeErrorCode(error) : data?.public ? "bucket_must_be_private" : storage.ready ? undefined : "bucket_not_found";
    } catch (error) {
      storage.code = safeErrorCode(error);
    }
  }

  return {
    auth: {
      appUrl: email.applicationUrl,
      callbackUrl: email.callbackUrl,
      appUrlConfigured: email.appUrlConfigured,
      supabaseUrlConfigured: email.supabaseUrlConfigured,
      supabaseAnonKeyConfigured: email.supabaseAnonKeyConfigured,
      serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    database,
    storage,
    ai: {
      textConfigured: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_TEXT_MODEL),
      imageConfigured: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_IMAGE_MODEL),
    },
    publicSupabaseConfigured,
  };
}
