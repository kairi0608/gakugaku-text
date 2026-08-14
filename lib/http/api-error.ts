import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/require-role";

export function apiError(error: unknown, fallback: string) {
  if (error instanceof AuthenticationError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: 403 });
  if (error instanceof ZodError) return NextResponse.json({ error: "入力内容を確認してください。", issues: error.issues }, { status: 400 });
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export function apiServiceUnavailable(error: unknown, fallback: string) {
  console.error(fallback, error);
  return NextResponse.json({ error: fallback, code: "service_not_configured" }, { status: 503 });
}
