import { describe, expect, it } from "vitest";
import { translateAuthError } from "@/lib/authErrors";

describe("translateAuthError", () => {
  it.each([
    ["Invalid login credentials", "E-mail ou senha incorretos."],
    ["Password should be at least 8 characters.", "A senha deve ter pelo menos 8 caracteres."],
    ["User already registered", "Este e-mail já está cadastrado. Faça login ou recupere sua senha."],
    ["Failed to fetch", "Sem conexão com o servidor. Verifique sua internet e tente novamente."],
  ])("%s", (message, expected) => {
    expect(translateAuthError(new Error(message))).toBe(expected);
  });

  it("falls back to a generic Portuguese message", () => {
    expect(translateAuthError(new Error("something odd"))).toBe("Ocorreu um erro. Tente novamente.");
    expect(translateAuthError(null, "Falhou")).toBe("Falhou");
  });
});
