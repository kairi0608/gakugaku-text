import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
export function createClaimToken() { return randomBytes(32).toString("base64url"); }
export function hashClaimToken(token: string, secret = process.env.CLAIM_TOKEN_SECRET ?? "test-only-secret") { return createHash("sha256").update(`${secret}:${token}`).digest("hex"); }
export function tokenMatches(token: string, expected: string, secret?: string) { const actual = hashClaimToken(token, secret); return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected)); }
export function claimExpiresAt(now = new Date()) { return new Date(now.getTime() + 24 * 60 * 60 * 1000); }
export function isClaimExpired(expiresAt: string | Date, now = new Date()) { return new Date(expiresAt).getTime() <= now.getTime(); }
