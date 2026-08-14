type AuthErrorDetails = { code?: unknown; status?: unknown };

export const authEmailMessages = {
  rateLimit: "メール送信回数の上限に達しました。しばらく待ってから再度お試しください。",
  unauthorizedAddress: "現在のメール送信設定では、このアドレスへ確認メールを送信できません。管理者にお問い合わせください。",
  sendFailure: "確認メールの送信に失敗しました。時間をおいて再度お試しください。",
} as const;

export function logAuthError(operation: string, error: unknown) {
  const details = typeof error === "object" && error !== null ? error as AuthErrorDetails : {};
  console.error("[auth]", {
    operation,
    code: typeof details.code === "string" ? details.code : "unknown",
    status: typeof details.status === "number" ? details.status : null,
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

export function getAuthEmailMessage(error: unknown) {
  if (isAuthRateLimit(error)) return authEmailMessages.rateLimit;
  if (getAuthErrorCode(error) === "email_address_not_authorized") return authEmailMessages.unauthorizedAddress;
  return authEmailMessages.sendFailure;
}
