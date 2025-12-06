import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Building2, MapPin, Phone, User, Lock, Check, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Dados da Empresa", icon: Building2 },
  { id: 2, title: "Endereço", icon: MapPin },
  { id: 3, title: "Contatos", icon: Phone },
  { id: 4, title: "Responsável", icon: User },
  { id: 5, title: "Senha", icon: Lock },
];

const naturezasJuridicas = [
  "MEI - Microempreendedor Individual",
  "ME - Microempresa",
  "EPP - Empresa de Pequeno Porte",
  "LTDA - Sociedade Limitada",
  "S/A - Sociedade Anônima",
  "EIRELI",
  "Outro",
];

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const cargos = ["Sócio", "Administrador", "Diretor", "Gerente", "Outro"];

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
  const [naturezaJuridica, setNaturezaJuridica] = useState("");
  const [cnae, setCnae] = useState("");

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

  // Step 4 - Responsible
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [cargo, setCargo] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  // Step 5 - Password
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

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .slice(0, 14);
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

  const handleNext = () => {
    if (currentStep < 5) {
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
      {/* Header */}
      <header className="bg-card border-b border-border py-4">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                Fanezze Supply
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
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Natureza Jurídica *</label>
                      <select
                        value={naturezaJuridica}
                        onChange={(e) => setNaturezaJuridica(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      >
                        <option value="">Selecione</option>
                        {naturezasJuridicas.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">CNAE Principal *</label>
                      <input
                        type="text"
                        value={cnae}
                        onChange={(e) => setCnae(e.target.value)}
                        placeholder="Ex: 4789-0/99"
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

              {/* Step 4 - Responsible */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-fade-in">
                  <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                    Dados do Responsável Legal
                  </h2>

                  <div className="p-4 rounded-lg bg-accent/50 border border-accent flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">
                      Esses dados serão utilizados para análise de crédito em Serasa, Boa Vista e SPC.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground">Nome Completo *</label>
                      <input
                        type="text"
                        value={nomeCompleto}
                        onChange={(e) => setNomeCompleto(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">CPF *</label>
                      <input
                        type="text"
                        value={cpf}
                        onChange={(e) => setCpf(maskCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">RG *</label>
                      <input
                        type="text"
                        value={rg}
                        onChange={(e) => setRg(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Cargo *</label>
                      <select
                        value={cargo}
                        onChange={(e) => setCargo(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      >
                        <option value="">Selecione</option>
                        {cargos.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Data de Nascimento *</label>
                      <input
                        type="date"
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        className="w-full h-11 px-4 mt-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5 - Password */}
              {currentStep === 5 && (
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

                {currentStep < 5 ? (
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
