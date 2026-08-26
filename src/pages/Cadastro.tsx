import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Building2, MapPin, Phone, Lock, Check, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";

const steps = [
  { id: 1, title: "Dados da Empresa", icon: Building2 },
  { id: 2, title: "Endereço", icon: MapPin },
  { id: 3, title: "Contatos", icon: Phone },
  { id: 4, title: "Senha", icon: Lock },
];

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const Cadastro = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 - Company Data
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [isento, setIsento] = useState(false);
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState("");
  const [dataAbertura, setDataAbertura] = useState("");

  // Step 2 - Address
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  // Step 3 - Contact
  const [telefoneFixo, setTelefoneFixo] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  // Step 4 - Password
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [aceitaTermos, setAceitaTermos] = useState(false);

  // Masks
  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4,5})(\d{4})$/, "$1-$2")
      .slice(0, 15);
  };

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);
  };

  const validateCNPJ = (cnpjValue: string): boolean => {
    const cnpjClean = cnpjValue.replace(/\D/g, "");
    
    if (cnpjClean.length !== 14) return false;
    
    // Check for known invalid patterns
    if (/^(\d)\1+$/.test(cnpjClean)) return false;
    
    // Calculate first check digit
    let sum = 0;
    let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpjClean[i]) * weight[i];
    }
    let remainder = sum % 11;
    let firstDigit = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cnpjClean[12]) !== firstDigit) return false;
    
    // Calculate second check digit
    sum = 0;
    weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpjClean[i]) * weight[i];
    }
    remainder = sum % 11;
    let secondDigit = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(cnpjClean[13]) === secondDigit;
  };

  const fetchAddress = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setEndereco(data.logradouro || "");
          setBairro(data.bairro || "");
          setCidade(data.localidade || "");
          setEstado(data.uf || "");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!razaoSocial.trim() || !nomeFantasia.trim() || !cnpj.trim() || !dataAbertura) {
          toast({
            title: "Campos obrigatórios",
            description: "Preencha todos os campos obrigatórios antes de continuar.",
            variant: "destructive",
          });
          return false;
        }
        if (cnpj.replace(/\D/g, "").length !== 14) {
          toast({
            title: "CNPJ inválido",
            description: "O CNPJ deve ter 14 dígitos.",
            variant: "destructive",
          });
          return false;
        }
        if (!validateCNPJ(cnpj)) {
          toast({
            title: "CNPJ inválido",
            description: "Os dígitos verificadores do CNPJ são inválidos.",
            variant: "destructive",
          });
          return false;
        }
        // Validate opening date
        const openingDate = new Date(dataAbertura);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (openingDate > today) {
          toast({
            title: "Data de abertura inválida",
            description: "A data de abertura não pode ser no futuro.",
            variant: "destructive",
          });
          return false;
        }
        // Minimum date: 1900 (no company can be older than that)
        const minDate = new Date(1900, 0, 1);
        if (openingDate < minDate) {
          toast({
            title: "Data de abertura inválida",
            description: "A data de abertura é muito antiga.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 2:
        if (!cep.trim() || !endereco.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !estado) {
          toast({
            title: "Campos obrigatórios",
            description: "Preencha todos os campos obrigatórios do endereço.",
            variant: "destructive",
          });
          return false;
        }
        const cepClean = cep.replace(/\D/g, "");
        if (cepClean.length !== 8) {
          toast({
            title: "CEP inválido",
            description: "O CEP deve ter 8 dígitos.",
            variant: "destructive",
          });
          return false;
        }
        // Validate CEP format (Brazilian CEPs: 01000-000 to 99999-999)
        const cepNum = parseInt(cepClean);
        if (cepNum < 1000000 || cepNum > 99999999) {
          toast({
            title: "CEP inválido",
            description: "O CEP informado não existe.",
            variant: "destructive",
          });
          return false;
        }
        // Validate number field (must contain at least one digit)
        if (!/\d/.test(numero) && numero.toLowerCase() !== "s/n") {
          toast({
            title: "Número inválido",
            description: "Digite o número do endereço ou 'S/N' se não houver.",
            variant: "destructive",
          });
          return false;
        }
        // Validate city name (only letters and spaces)
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(cidade.trim())) {
          toast({
            title: "Cidade inválida",
            description: "O nome da cidade deve conter apenas letras.",
            variant: "destructive",
          });
          return false;
        }
        // Validate bairro (only letters, spaces, and numbers)
        if (!/^[a-zA-ZÀ-ÿ0-9\s]+$/.test(bairro.trim())) {
          toast({
            title: "Bairro inválido",
            description: "O nome do bairro contém caracteres inválidos.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 3:
        if (!whatsapp.trim() || !email.trim()) {
          toast({
            title: "Campos obrigatórios",
            description: "Preencha o WhatsApp e o e-mail.",
            variant: "destructive",
          });
          return false;
        }
        if (whatsapp.replace(/\D/g, "").length < 10) {
          toast({
            title: "WhatsApp inválido",
            description: "O WhatsApp deve ter pelo menos 10 dígitos.",
            variant: "destructive",
          });
          return false;
        }
        if (!email.includes("@") || !email.includes(".")) {
          toast({
            title: "E-mail inválido",
            description: "Digite um e-mail válido.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < 4 && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (senha !== confirmarSenha) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (!aceitaTermos) {
      toast({
        title: "Erro",
        description: "Você deve aceitar os termos de uso.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Cadastro realizado!",
      description: "Para funcionalidade completa, conecte o Supabase.",
    });

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-secondary">
      <SEO
        title="Cadastre sua Empresa — FNZ Supply"
        description="Crie sua conta empresarial na FNZ Supply e compre embalagens no atacado com nota fiscal e preços B2B."
        path="/cadastro"
      />
      {/* Header */}
      <header className="bg-card border-b border-border py-4">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                FNZ Supply
              </span>
            </Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Já tem conta? Entrar
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Cadastro de Empresa
            </h1>
            <p className="text-muted-foreground">
              Preencha os dados para criar sua conta corporativa
            </p>
          </div>

          {/* Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all",
                        currentStep === step.id
                          ? "bg-primary text-primary-foreground"
                          : currentStep > step.id
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-2 hidden md:block text-center",
                        currentStep >= step.id
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2",
                        currentStep > step.id ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
              {/* Step 1 - Company Data */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                    Dados Cadastrais da Empresa
                  </h2>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground">Razão Social *</label>
                      <input
                        type="text"
                        value={razaoSocial}
                        onChange={(e) => setRazaoSocial(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground">Nome Fantasia *</label>
                      <input
                        type="text"
                        value={nomeFantasia}
                        onChange={(e) => setNomeFantasia(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">CNPJ *</label>
                      <input
                        type="text"
                        value={cnpj}
                        onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                        placeholder="00.000.000/0000-00"
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Inscrição Estadual</label>
                      <div className="flex items-center gap-3 mt-1.5">
                        <input
                          type="text"
                          value={inscricaoEstadual}
                          onChange={(e) => setInscricaoEstadual(e.target.value)}
                          disabled={isento}
                          className="flex-1 h-11 px-4 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                        />
                        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isento}
                            onChange={(e) => setIsento(e.target.checked)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          Isento
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Inscrição Municipal</label>
                      <input
                        type="text"
                        value={inscricaoMunicipal}
                        onChange={(e) => setInscricaoMunicipal(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Data de Abertura *</label>
                      <input
                        type="date"
                        value={dataAbertura}
                        onChange={(e) => setDataAbertura(e.target.value)}
                        min="1900-01-01"
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 - Address */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                    Endereço Completo
                  </h2>

                  <div className="p-4 rounded-lg bg-accent/50 border border-accent flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">
                      <strong>Importante:</strong> Preencha o endereço exatamente como aparece na Receita Federal para evitar rejeição da NF-e.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-5">
                    <div>
                      <label className="text-sm font-medium text-foreground">CEP *</label>
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => {
                          const value = maskCEP(e.target.value);
                          setCep(value);
                          fetchAddress(value);
                        }}
                        placeholder="00000-000"
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground">Endereço *</label>
                      <input
                        type="text"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Número *</label>
                      <input
                        type="text"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Complemento</label>
                      <input
                        type="text"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Bairro *</label>
                      <input
                        type="text"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Cidade *</label>
                      <input
                        type="text"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Estado *</label>
                      <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      >
                        <option value="">Selecione</option>
                        {estados.map((uf) => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 - Contact */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-fade-in">
                  <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                    Contatos da Empresa
                  </h2>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-medium text-foreground">Telefone Fixo</label>
                      <input
                        type="text"
                        value={telefoneFixo}
                        onChange={(e) => setTelefoneFixo(maskPhone(e.target.value))}
                        placeholder="(00) 0000-0000"
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">WhatsApp Comercial *</label>
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground">E-mail para NF-e e Boletos *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="financeiro@empresa.com.br"
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 - Password */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-fade-in">
                  <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                    Criar Senha
                  </h2>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-medium text-foreground">Senha *</label>
                      <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        minLength={8}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Confirmar Senha *</label>
                      <input
                        type="password"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={aceitaTermos}
                          onChange={(e) => setAceitaTermos(e.target.checked)}
                          className="w-4 h-4 mt-1 rounded border-border text-primary focus:ring-primary"
                          required
                        />
                        <span className="text-sm text-muted-foreground">
                          Aceito os{" "}
                          <Link to="/termos" className="text-primary hover:underline">
                            termos de uso
                          </Link>{" "}
                          e a{" "}
                          <Link to="/privacidade" className="text-primary hover:underline">
                            política de privacidade
                          </Link>
                          .
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>

                {currentStep < 4 ? (
                  <Button type="button" onClick={handleNext} className="gap-2">
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading} className="gap-2">
                    {isLoading ? "Cadastrando..." : "Finalizar Cadastro"}
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
