// AbacatePay API v2 client (https://docs.abacatepay.com). One base URL for both
// environments: the key decides whether charges are real (production) or simulated (dev mode).

const BASE = "https://api.abacatepay.com/v2";

export class AbacateError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function abacate<T>(apiKey: string, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: { data?: T; error?: string | null; success?: boolean } = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new AbacateError(`AbacatePay respondeu ${res.status}`, res.status);
  }
  if (!res.ok || json.success === false || json.data == null) {
    throw new AbacateError(json.error || `AbacatePay respondeu ${res.status}`, res.status);
  }
  return json.data;
}

export interface AbacateCustomer {
  name: string;
  email: string;
  taxId: string;
  cellphone: string;
}

export function formatCellphone(raw: string | null | undefined): string {
  const d = (raw ?? "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

// Public key AbacatePay documents for the X-Webhook-Signature HMAC (body integrity).
// It is the same for every account; the per-webhook secret is what proves origin.
const WEBHOOK_SIGNATURE_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function validWebhookSignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(WEBHOOK_SIGNATURE_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return constantTimeEqual(expected, signature);
}
