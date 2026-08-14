export async function requestJson<T>(input: RequestInfo | URL, init: RequestInit, fallback: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    throw new Error(fallback);
  }

  let result: unknown = null;
  try {
    result = await response.json();
  } catch {
    if (!response.ok) throw new Error(fallback);
  }

  if (!response.ok) {
    const message = result && typeof result === "object" && "error" in result && typeof result.error === "string" ? result.error : fallback;
    throw new Error(message);
  }
  return result as T;
}

export function userErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
