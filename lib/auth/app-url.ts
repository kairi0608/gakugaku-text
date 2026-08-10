export class AppUrlConfigurationError extends Error {
  constructor() {
    super("NEXT_PUBLIC_APP_URL is not configured correctly");
    this.name = "AppUrlConfigurationError";
  }
}

export function getAppUrl(env: NodeJS.ProcessEnv = process.env) {
  const configured = env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) {
    if (env.NODE_ENV === "development" || env.NODE_ENV === "test") return "http://localhost:3000";
    throw new AppUrlConfigurationError();
  }
  try {
    const url = new URL(configured);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      throw new AppUrlConfigurationError();
    }
    return url.origin;
  } catch (error) {
    if (error instanceof AppUrlConfigurationError) throw error;
    throw new AppUrlConfigurationError();
  }
}
