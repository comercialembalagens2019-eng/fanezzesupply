// Supabase Auth returns English messages; customers see these Portuguese versions.
const MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada e o spam."],
  [/already registered|already been registered|user already exists/i, "Este e-mail já está cadastrado. Faça login ou recupere sua senha."],
  [/password should be at least (\d+)/i, "A senha deve ter pelo menos $1 caracteres."],
  [/password is known to be weak|pwned|weak password/i, "Essa senha é muito comum ou já apareceu em vazamentos. Escolha outra."],
  [/password should contain/i, "A senha deve conter letras maiúsculas, minúsculas e números."],
  [/new password should be different/i, "A nova senha precisa ser diferente da atual."],
  [/unable to validate email|invalid email|email address .* is invalid/i, "E-mail inválido."],
  [/signups? not allowed|signup is disabled/i, "Novos cadastros estão temporariamente desativados."],
  [/rate limit|too many requests|security purposes.*after (\d+) seconds/i, "Muitas tentativas. Aguarde um pouco e tente novamente."],
  [/token has expired|otp.*expired|link is invalid or has expired/i, "O link expirou. Solicite um novo."],
  [/network|failed to fetch/i, "Sem conexão com o servidor. Verifique sua internet e tente novamente."],
];

export function translateAuthError(error: unknown, fallback = "Ocorreu um erro. Tente novamente."): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  for (const [pattern, translation] of MESSAGES) {
    const match = message.match(pattern);
    if (match) return translation.replace("$1", match[1] ?? "");
  }
  return fallback;
}
