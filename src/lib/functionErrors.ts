import { FunctionsHttpError } from "@supabase/supabase-js";

// supabase.functions.invoke reports non-2xx responses as a generic
// "Edge Function returned a non-2xx status code"; the useful message is in the body.
export async function getFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === "string" && body.error.length > 0) return body.error;
    } catch {
      // Body was not JSON
    }
  }
  return fallback;
}
