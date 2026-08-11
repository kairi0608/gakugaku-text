import { getAppUrl } from "./app-url";

export type EmailDiagnostics = {
  currentEnvironment: string;
  applicationUrl: string | null;
  callbackUrl: string | null;
  appUrlConfigured: boolean;
  supabaseUrlConfigured: boolean;
  supabaseAnonKeyConfigured: boolean;
};

export function getEmailDiagnostics(env: NodeJS.ProcessEnv = process.env): EmailDiagnostics {
  let applicationUrl: string | null = null;
  try {
    applicationUrl = getAppUrl(env);
  } catch {
    applicationUrl = null;
  }

  return {
    currentEnvironment: env.VERCEL_ENV?.trim() || env.NODE_ENV?.trim() || "unknown",
    applicationUrl,
    callbackUrl: applicationUrl ? `${applicationUrl}/auth/callback` : null,
    appUrlConfigured: Boolean(env.NEXT_PUBLIC_APP_URL?.trim()),
    supabaseUrlConfigured: Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    supabaseAnonKeyConfigured: Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
  };
}
