import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ValidarCodigo = () => {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email || "";
  const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate("/recuperar-senha");
    }
  }, [email, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Enable resend after 60 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanResend(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCodigo = [...codigo];
    newCodigo[index] = value;
    setCodigo(newCodigo);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (index === 5 && value) {
      const completeCodigo = [...newCodigo];
      completeCodigo[5] = value;
      setTimeout(() => validateCode(completeCodigo.join("")), 100);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace: go to previous input
    if (e.key === "Backspace" && !codigo[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newCodigo = pastedData.split("").concat(Array(6 - pastedData.length).fill(""));
    setCodigo(newCodigo);

    // Focus next empty input or validate
    const nextEmpty = newCodigo.findIndex((c) => !c);
    if (nextEmpty !== -1) {
      inputRefs.current[nextEmpty]?.focus();
    } else {
      validateCode(newCodigo.join(""));
    }
  };

  const validateCode = async (codeString: string) => {
    if (codeString.length !== 6) {
      toast({
        title: "Código incompleto",
        description: "Digite os 6 dígitos do código.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("validate-reset-code", {
        body: {
          email: email,
          code: codeString,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Código inválido",
          description: data.error,
          variant: "destructive",
        });
        // Clear inputs
        setCodigo(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      toast({
        title: "Código validado!",
        description: "Agora você pode criar uma nova senha.",
      });

      // Navigate to new password page with reset token in router state (not the URL)
      navigate("/redefinir-senha", {
        state: { email, token: data.resetToken },
        replace: true,
      });
    } catch (error) {
      console.error("Code validation error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível validar o código. Tente novamente.",
        variant: "destructive",
      });
      setCodigo(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);

    try {
      const { data, error } = await supabase.functions.invoke("request-password-reset", {
        body: {
          email: email,
        },
      });

      if (error) throw error;

      if (data?.rateLimited) {
        toast({
          title: "Limite excedido",
          description: "Muitas tentativas. Aguarde antes de tentar novamente.",
          variant: "destructive",
        });
        return;
      }

      setTimeRemaining(900); // Reset timer
      setCodigo(["", "", "", "", "", ""]);
      setCanResend(false);
      inputRefs.current[0]?.focus();

      // Re-enable resend after 60 seconds
      setTimeout(() => setCanResend(true), 60000);

      toast({
        title: "Novo código enviado!",
        description: "Confira sua caixa de entrada.",
      });
    } catch (error) {
      console.error("Resend error:", error);
      toast({
        title: "Erro",
        description: "Erro ao reenviar código. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
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
          <Link to="/" className="inline-flex mb-12" aria-label="FNZ Supply — início">
            <BrandLogo className="w-56" />
          </Link>

          <h1 className="font-display text-4xl lg:text-5xl font-bold text-beige mb-6">
            Verificar Código
          </h1>
          <p className="text-lg text-beige/80 max-w-md">
            Digite o código de 6 dígitos que enviamos para seu email.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link to="/" className="flex lg:hidden mb-8 justify-center" aria-label="FNZ Supply — início">
            <BrandLogo className="w-44" />
          </Link>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Digite o Código
            </h2>
            <p className="text-muted-foreground">
              Enviamos um código de 6 dígitos para:
              <br />
              <strong className="text-foreground">{email}</strong>
            </p>
          </div>

          {/* Timer */}
          <div className="bg-muted/50 rounded-lg p-4 text-center mb-6">
            <p className="text-sm text-muted-foreground">
              ⏱️ Código expira em:{" "}
              <strong className={`text-lg ${timeRemaining < 60 ? "text-destructive" : "text-foreground"}`}>
                {formatTime(timeRemaining)}
              </strong>
            </p>
          </div>

          {/* Code inputs */}
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {codigo.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            ))}
          </div>

          {/* Validate button */}
          <Button
            onClick={() => validateCode(codigo.join(""))}
            className="w-full mb-4"
            size="lg"
            disabled={isLoading || codigo.some((d) => !d)}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validando...
              </>
            ) : (
              "Validar Código"
            )}
          </Button>

          {/* Resend */}
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Não recebeu o código?</p>
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={isResending || !canResend}
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {canResend ? "Reenviar Código" : "Aguarde 1 minuto..."}
                </>
              )}
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-800">
              💡 <strong>Dica:</strong> Verifique sua caixa de spam se não receber o email.
            </p>
          </div>

          {/* Back link */}
          <div className="text-center mt-8">
            <Link
              to="/recuperar-senha"
              className="inline-flex items-center text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Usar outro email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidarCodigo;
