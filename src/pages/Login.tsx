import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { translateAuthError } from "@/lib/authErrors";
import { useAuth } from "@/contexts/AuthContext";
import { SEO } from "@/components/SEO";
import { authPagePath, authReturnDestination, legacyLoginDestination } from "@/lib/authReturn";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const destination = authReturnDestination(location.search, location.state);
  const redirectTo = destination ?? legacyLoginDestination(location.state);

  useEffect(() => {
    if (user && !authLoading) {
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, isAdmin, authLoading, redirectTo, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Não foi possível entrar",
          description: translateAuthError(error),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta.",
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Erro",
        description: translateAuthError(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex gap-4 p-4">
      <SEO
        title="Entrar — FNZ Supply"
        description="Acesse sua conta empresarial na FNZ Supply para acompanhar pedidos e comprar embalagens no atacado."
        path="/login"
      />
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-beige blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-beige blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16">
          <Link to="/" className="flex items-center mb-12" aria-label="FNZ Supply — início">
            <Logo className="h-12" onDark />
          </Link>

          <h1 className="font-display text-4xl lg:text-5xl font-bold text-beige mb-6">
            Bem-vindo de volta
          </h1>
          <p className="text-lg text-beige/80 max-w-md">
            Acesse sua conta e continue comprando as melhores embalagens para sua empresa.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center md:p-8">
        <div className="w-full max-w-md tile p-6 md:p-10">
          {/* Mobile Logo */}
          <Link to="/" className="flex lg:hidden items-center mb-8 justify-center" aria-label="FNZ Supply — início">
            <Logo className="h-10" />
          </Link>

          <div className="text-center lg:text-left mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Entrar na sua conta
            </h2>
            <p className="text-muted-foreground">
              Digite seu email e senha para acessar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <Link
                  to="/recuperar-senha"
                  className="text-sm text-primary hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-12 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="remember" className="text-sm text-muted-foreground">
                Lembrar-me
              </label>
            </div>

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Link to full registration */}
          <p className="text-center mt-8 text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link 
              to={authPagePath("/cadastro", destination)}
              className="text-primary font-medium hover:underline"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
