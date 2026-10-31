type ReturnDestination = "/carrinho" | "/produtos";

function allowedDestination(value: unknown): ReturnDestination | null {
  return value === "/carrinho" || value === "/produtos" ? value : null;
}

// Query strings and navigation state are both untrusted inputs.
export function authReturnDestination(search: string, state: unknown): ReturnDestination | null {
  const explicit = allowedDestination(new URLSearchParams(search).get("returnTo"));
  return explicit ?? allowedDestination(legacyLoginDestination(state));
}

// Preserve existing login callers, without extending the returnTo allowlist.
export function legacyLoginDestination(state: unknown): string | null {
  const from = state && typeof state === "object" && "from" in state ? state.from : null;
  return typeof from === "string" && /^\/(?![/\\])[^\\]*$/.test(from) ? from : null;
}

export function authPagePath(page: "/login" | "/cadastro", destination: unknown): string {
  const validated = allowedDestination(destination);
  return validated ? `${page}?${new URLSearchParams({ returnTo: validated })}` : page;
}
