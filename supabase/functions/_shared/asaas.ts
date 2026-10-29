// Asaas API client (https://docs.asaas.com). The key's prefix tells the environment:
// "$aact_hmlg_" keys only work on the sandbox, production keys on api.asaas.com.

export type AsaasBillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

// Asaas statuses that mean the money arrived (or the card was approved).
export const ASAAS_PAID_STATUSES = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];

export function asaasBaseUrl(apiKey: string): string {
  return apiKey.startsWith("$aact_hmlg_") ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3";
}

export class AsaasError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function asaas<T>(apiKey: string, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${asaasBaseUrl(apiKey)}${path}`, {
    method,
    headers: {
      access_token: apiKey,
      "User-Agent": "fnz-supply",
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    // Asaas error descriptions are already in Portuguese and safe to show the customer.
    const description = json?.errors?.map((e: { description?: string }) => e.description).filter(Boolean).join(" ");
    throw new AsaasError(description || `Asaas respondeu ${res.status}`, res.status);
  }
  return json as T;
}

export interface AsaasCompany {
  id: string;
  razao_social: string;
  cnpj: string;
  email: string;
  whatsapp: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
}

// Customers are looked up by CNPJ on every charge, so nothing environment-specific is stored.
export async function ensureAsaasCustomer(apiKey: string, company: AsaasCompany): Promise<string> {
  const cpfCnpj = company.cnpj.replace(/\D/g, "");
  const found = await asaas<{ data: { id: string }[] }>(apiKey, "GET", `/customers?cpfCnpj=${cpfCnpj}&limit=1`);
  if (found.data?.[0]?.id) return found.data[0].id;

  const created = await asaas<{ id: string }>(apiKey, "POST", "/customers", {
    name: company.razao_social,
    cpfCnpj,
    email: company.email,
    mobilePhone: company.whatsapp?.replace(/\D/g, "") || undefined,
    postalCode: company.cep?.replace(/\D/g, "") || undefined,
    address: company.endereco || undefined,
    addressNumber: company.numero || undefined,
    complement: company.complemento || undefined,
    province: company.bairro || undefined,
    externalReference: company.id,
    // Our own e-mails (Resend) tell the customer about the order.
    notificationDisabled: true,
  });
  return created.id;
}

/** YYYY-MM-DD in São Paulo, `days` from today. */
export function dueDate(days: number): string {
  const date = new Date(Date.now() + days * 86_400_000);
  return date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}
