import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { translateAuthError } from "@/lib/authErrors";
import { supabase } from "@/integrations/supabase/client";

const maskPhone = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{4,5})(\d{4})$/, "$1-$2")
    .slice(0, 15);

const Cadastro = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !email.trim() || !telefone.trim() || !senha) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, e-mail, telefone e senha.",
        variant: "destructive",
      });
      return;
    }

    // Same rule as the password-reset function.
    const passwordProblem =
      senha.length < 8
        ? "A senha deve ter pelo menos 8 caracteres."
        : !/[A-Z]/.test(senha)
          ? "A senha deve ter pelo menos uma letra maiúscula."
          : !/[0-9]/.test(senha)
            ? "A senha deve ter pelo menos um número."
            : null;
    if (passwordProblem) {
      toast({ title: "Senha fraca", description: passwordProblem, variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nome: nome.trim(), telefone },
      },
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro no cadastro",
        description: translateAuthError(error),
        variant: "destructive",
      });
      return;
    }

    // With e-mail confirmation on, signUp returns no session until the link is clicked.
    if (!data.session) {
      toast({
        title: "Confirme seu e-mail",
        description: `Enviamos um link de confirmação para ${email.trim()}. Verifique também o spam.`,
      });
      navigate("/login");
      return;
    }

    toast({
      title: "Cadastro realizado!",
      description: "Sua conta foi criada com sucesso.",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Criar conta — FNZ Supply"
        description="Crie sua conta na FNZ Supply para comprar embalagens no atacado."
        path="/cadastro"
      />
      <header className="py-4">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center" aria-label="FNZ Supply — início">
            <Logo className="h-10" />
          </Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Já tem conta? Entrar
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8 md:py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Criar conta
            </h1>
            <p className="text-muted-foreground">
              Preencha seus dados para começar
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="tile p-6 md:p-8 space-y-5">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-foreground mb-2">
                  Nome *
                </label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  E-mail *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-foreground mb-2">
                  Telefone *
                </label>
                <input
                  id="telefone"
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(maskPhone(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-foreground mb-2">
                  Senha *
                </label>
                <div className="relative">
                  <input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="8+ caracteres, com maiúscula e número"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar conta"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Ao criar a conta, você concorda com os{" "}
                <Link to="/termos" className="text-foreground underline underline-offset-2">Termos de Uso</Link> e a{" "}
                <Link to="/privacidade" className="text-foreground underline underline-offset-2">Política de Privacidade</Link>.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
