import { timingSafeEqual } from "node:crypto";

export function authorizedAction(request: Request) {
  const expected = process.env.GAKUGAKU_ACTION_API_KEY;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
