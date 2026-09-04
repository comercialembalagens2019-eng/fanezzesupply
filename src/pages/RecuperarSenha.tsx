import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const RecuperarSenha = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("request-password-reset", {
        body: {
          email: email.toLowerCase().trim(),
        },
      });

      if (error) throw error;

      if (data?.rateLimited) {
        toast({
          title: "Limite excedido",
          description: "Muitas tentativas. Aguarde 1 hora antes de tentar novamente.",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Código enviado!",
        description: "Verifique sua caixa de entrada e spam.",
      });

      // Navigate to code validation page (email kept in router state, not the URL)
      navigate("/validar-codigo", {
        state: { email: email.toLowerCase().trim() },
        replace: true,
      });
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            Recuperar Senha
          </h1>
          <p className="text-lg text-beige/80 max-w-md">
            Não se preocupe, vamos ajudá-lo a recuperar o acesso à sua conta.
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

          <div className="text-center lg:text-left mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Recuperar Senha
            </h2>
            <p className="text-muted-foreground">
              Digite seu e-mail cadastrado e enviaremos um código de 6 dígitos para redefinir sua senha.
            </p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-5">
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
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            {/* Info box */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                📱 Você receberá um código de 6 dígitos no email informado. O código expira em 15 minutos.
              </p>
            </div>

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando código...
                </>
              ) : (
                "Enviar código de verificação"
              )}
            </Button>
          </form>

          {/* Back to login */}
          <div className="text-center mt-8">
            <Link 
              to="/login"
              className="inline-flex items-center text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecuperarSenha;
