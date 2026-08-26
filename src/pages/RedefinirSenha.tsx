import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Package, Lock, Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const RedefinirSenha = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const resetToken = searchParams.get("token") || "";
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  // Redirect if no email or token
  useEffect(() => {
    if (!email || !resetToken) {
      toast({
        title: "Link inválido",
        description: "Por favor, solicite um novo código de recuperação.",
        variant: "destructive",
      });
      navigate("/recuperar-senha");
    }
  }, [email, resetToken, navigate]);

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  const getPasswordStrength = () => {
    const checks = [hasMinLength, hasUpperCase, hasNumber];
    const passed = checks.filter(Boolean).length;
    if (passed === 0) return { label: "", color: "" };
    if (passed === 1) return { label: "Fraca", color: "text-red-500" };
    if (passed === 2) return { label: "Média", color: "text-yellow-500" };
    return { label: "Forte", color: "text-green-500" };
  };

  const isValidPassword = hasMinLength && hasUpperCase && hasNumber && passwordsMatch;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidPassword) {
      toast({
        title: "Senha inválida",
        description: "Verifique os requisitos da senha.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("reset-password-with-code", {
        body: {
          email: email,
          resetToken: resetToken,
          newPassword: password,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setIsSuccess(true);
      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi alterada com sucesso.",
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Password update error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a senha. O link pode ter expirado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-beige blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-beige blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-beige flex items-center justify-center">
              <Package className="w-7 h-7 text-navy" />
            </div>
            <span className="font-display font-bold text-2xl text-beige">
              FNZ Supply
            </span>
          </Link>

          <h1 className="font-display text-4xl lg:text-5xl font-bold text-beige mb-6">
            Criar Nova Senha
          </h1>
          <p className="text-lg text-beige/80 max-w-md">
            Defina uma nova senha segura para proteger sua conta.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              FNZ Supply
            </span>
          </Link>

          {isSuccess ? (
            // Success State
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Senha atualizada!
              </h2>
              <p className="text-muted-foreground mb-6">
                Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes.
              </p>
              <Link to="/login">
                <Button className="w-full">
                  Ir para o login
                </Button>
              </Link>
            </div>
          ) : (
            // Form State
            <>
              <div className="text-center lg:text-left mb-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto lg:mx-0 mb-4">
                  <Lock className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  Criar Nova Senha
                </h2>
                <p className="text-muted-foreground">
                  Código validado! ✓ Agora crie uma senha segura para: <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-5">
                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                      className="w-full h-12 pl-10 pr-12 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength */}
                  {password && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Força:</span>
                      <span className={`text-xs font-medium ${strength.color}`}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite novamente"
                      className="w-full h-12 pl-10 pr-12 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Match indicator */}
                  {confirmPassword && (
                    <div className="flex items-center gap-1">
                      {passwordsMatch ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-xs ${passwordsMatch ? "text-green-500" : "text-red-500"}`}>
                        {passwordsMatch ? "Senhas coincidem" : "Senhas não coincidem"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium text-foreground mb-2">Requisitos da senha:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {hasMinLength ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={`text-xs ${hasMinLength ? "text-green-600" : "text-muted-foreground"}`}>
                        Mínimo 8 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasUpperCase ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={`text-xs ${hasUpperCase ? "text-green-600" : "text-muted-foreground"}`}>
                        1 letra maiúscula
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasNumber ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={`text-xs ${hasNumber ? "text-green-600" : "text-muted-foreground"}`}>
                        1 número
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full" 
                  disabled={isLoading || !isValidPassword}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    "Redefinir Senha"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RedefinirSenha;
