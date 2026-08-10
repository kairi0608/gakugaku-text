type AuthErrorDetails = { code?: unknown; status?: unknown; name?: unknown };

export function logAuthError(operation: string, error: unknown) {
  const details = typeof error === "object" && error !== null ? error as AuthErrorDetails : {};
  console.error(`[auth:${operation}]`, {
    code: typeof details.code === "string" ? details.code : "unknown",
    status: typeof details.status === "number" ? details.status : null,
    name: typeof details.name === "string" ? details.name : "Error",
  });
}

export function isAuthRateLimit(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const details = error as AuthErrorDetails;
  return details.status === 429 || details.code === "over_email_send_rate_limit" || details.code === "over_request_rate_limit";
}

export function getAuthErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null) return "unknown";
  const code = (error as AuthErrorDetails).code;
  return typeof code === "string" ? code : "unknown";
}
