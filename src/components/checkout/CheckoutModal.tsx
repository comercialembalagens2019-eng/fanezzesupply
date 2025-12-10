import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, QrCode, Building2, MapPin, Phone, User, ChevronRight, ChevronLeft, CheckCircle, Copy, Home, ShoppingBag, PartyPopper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CompanyData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  isento: boolean;
  inscricaoMunicipal: string;
  dataAbertura: string;
  naturezaJuridica: string;
  cnae: string;
}

interface AddressData {
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface ContactData {
  telefoneFixo: string;
  whatsapp: string;
  email: string;
}

interface ResponsibleData {
  nomeCompleto: string;
  cpf: string;
  rg: string;
  cargo: string;
  dataNascimento: string;
}

const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
};

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d{4})/, '$1-$2')
    .slice(0, 15);
};

const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

export const CheckoutModal = ({ open, onOpenChange }: CheckoutModalProps) => {
  const { items, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [brCode, setBrCode] = useState<string | null>(null);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [existingCompanyId, setExistingCompanyId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [companyData, setCompanyData] = useState<CompanyData>({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',
    isento: false,
    inscricaoMunicipal: '',
    dataAbertura: '',
    naturezaJuridica: '',
    cnae: '',
  });

  const [addressData, setAddressData] = useState<AddressData>({
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  const [contactData, setContactData] = useState<ContactData>({
    telefoneFixo: '',
    whatsapp: '',
    email: '',
  });

  const [responsibleData, setResponsibleData] = useState<ResponsibleData>({
    nomeCompleto: '',
    cpf: '',
    rg: '',
    cargo: '',
    dataNascimento: '',
  });

  // Load existing company data for logged-in users
  useEffect(() => {
    const loadUserCompany = async () => {
      // Don't load/change step if payment was already created
      if (!user || !open || paymentCreated) return;
      
      setIsLoadingCompany(true);
      try {
        const { data: company, error } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading company:', error);
          return;
        }

        if (company) {
          setExistingCompanyId(company.id);
          setCompanyData({
            razaoSocial: company.razao_social || '',
            nomeFantasia: company.nome_fantasia || '',
            cnpj: formatCNPJ(company.cnpj || ''),
            inscricaoEstadual: company.inscricao_estadual || '',
            isento: company.isento || false,
            inscricaoMunicipal: company.inscricao_municipal || '',
            dataAbertura: company.data_abertura || '',
            naturezaJuridica: company.natureza_juridica || '',
            cnae: company.cnae || '',
          });
          setAddressData({
            cep: formatCEP(company.cep || ''),
            endereco: company.endereco || '',
            numero: company.numero || '',
            complemento: company.complemento || '',
            bairro: company.bairro || '',
            cidade: company.cidade || '',
            estado: company.estado || '',
          });
          setContactData({
            telefoneFixo: company.telefone_fixo || '',
            whatsapp: company.whatsapp || '',
            email: company.email || '',
          });
          setResponsibleData({
            nomeCompleto: company.responsavel_nome || '',
            cpf: formatCPF(company.responsavel_cpf || ''),
            rg: company.responsavel_rg || '',
            cargo: company.responsavel_cargo || '',
            dataNascimento: company.responsavel_nascimento || '',
          });
          
          // Skip directly to step 4 (summary) if all required data is filled
          if (company.razao_social && company.cnpj && company.endereco && company.whatsapp && company.responsavel_nome && company.responsavel_cpf) {
            setStep(4);
          }
        }
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    loadUserCompany();
  }, [user, open, paymentCreated]);

  // Listen for payment confirmation via Polling (every 5 seconds)
  useEffect(() => {
    if (!paymentCreated || !existingCompanyId || paymentConfirmed) return;

    const checkPaymentStatus = async () => {
      try {
        const { data: order, error } = await supabase
          .from('orders')
          .select('status')
          .eq('company_id', existingCompanyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error checking payment status:', error);
          return;
        }

        if (order?.status === 'paid') {
          setPaymentConfirmed(true);
          toast({
            title: "🎉 Pagamento Confirmado!",
            description: "Seu pedido foi pago com sucesso.",
          });
          
          // Auto close and redirect after 4 seconds
          setTimeout(() => {
            clearCart();
            onOpenChange(false);
            navigate('/pedidos');
          }, 4000);
        }
      } catch (error) {
        console.error('Error in payment polling:', error);
      }
    };

    // Check immediately
    checkPaymentStatus();

    // Then poll every 5 seconds
    const intervalId = setInterval(checkPaymentStatus, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [paymentCreated, existingCompanyId, paymentConfirmed, clearCart, onOpenChange, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setAddressData(prev => ({
            ...prev,
            endereco: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || '',
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const saveCompanyData = async () => {
    const cnpjClean = companyData.cnpj.replace(/\D/g, '');
    
    // If user is logged in and has existing company, update it
    if (existingCompanyId) {
      const { data, error } = await supabase
        .from('companies')
        .update({
          razao_social: companyData.razaoSocial,
          nome_fantasia: companyData.nomeFantasia,
          inscricao_estadual: companyData.isento ? null : companyData.inscricaoEstadual,
          isento: companyData.isento,
          inscricao_municipal: companyData.inscricaoMunicipal || null,
          data_abertura: companyData.dataAbertura || null,
          natureza_juridica: companyData.naturezaJuridica,
          cnae: companyData.cnae || '',
          cep: addressData.cep.replace(/\D/g, ''),
          endereco: addressData.endereco,
          numero: addressData.numero,
          complemento: addressData.complemento || null,
          bairro: addressData.bairro,
          cidade: addressData.cidade,
          estado: addressData.estado,
          telefone_fixo: contactData.telefoneFixo || null,
          whatsapp: contactData.whatsapp,
          email: contactData.email,
          responsavel_nome: responsibleData.nomeCompleto,
          responsavel_cpf: responsibleData.cpf.replace(/\D/g, ''),
          responsavel_rg: responsibleData.rg || '',
          responsavel_cargo: responsibleData.cargo,
          responsavel_nascimento: responsibleData.dataNascimento || null,
        })
        .eq('id', existingCompanyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Check if company with this CNPJ already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('cnpj', cnpjClean)
      .maybeSingle();

    if (existingCompany) {
      // Update existing company and link to user if logged in
      const updateData: Record<string, unknown> = {
        razao_social: companyData.razaoSocial,
        nome_fantasia: companyData.nomeFantasia,
        inscricao_estadual: companyData.isento ? null : companyData.inscricaoEstadual,
        isento: companyData.isento,
        inscricao_municipal: companyData.inscricaoMunicipal || null,
        data_abertura: companyData.dataAbertura || null,
        natureza_juridica: companyData.naturezaJuridica,
        cnae: companyData.cnae || '',
        cep: addressData.cep.replace(/\D/g, ''),
        endereco: addressData.endereco,
        numero: addressData.numero,
        complemento: addressData.complemento || null,
        bairro: addressData.bairro,
        cidade: addressData.cidade,
        estado: addressData.estado,
        telefone_fixo: contactData.telefoneFixo || null,
        whatsapp: contactData.whatsapp,
        email: contactData.email,
        responsavel_nome: responsibleData.nomeCompleto,
        responsavel_cpf: responsibleData.cpf.replace(/\D/g, ''),
        responsavel_rg: responsibleData.rg || '',
        responsavel_cargo: responsibleData.cargo,
        responsavel_nascimento: responsibleData.dataNascimento || null,
      };
      
      // Link to user if logged in
      if (user) {
        updateData.user_id = user.id;
      }

      const { data, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', existingCompany.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert new company
      const insertData: Record<string, unknown> = {
        razao_social: companyData.razaoSocial,
        nome_fantasia: companyData.nomeFantasia,
        cnpj: cnpjClean,
        inscricao_estadual: companyData.isento ? null : companyData.inscricaoEstadual,
        isento: companyData.isento,
        inscricao_municipal: companyData.inscricaoMunicipal || null,
        data_abertura: companyData.dataAbertura || null,
        natureza_juridica: companyData.naturezaJuridica,
        cnae: companyData.cnae || '',
        cep: addressData.cep.replace(/\D/g, ''),
        endereco: addressData.endereco,
        numero: addressData.numero,
        complemento: addressData.complemento || null,
        bairro: addressData.bairro,
        cidade: addressData.cidade,
        estado: addressData.estado,
        telefone_fixo: contactData.telefoneFixo || null,
        whatsapp: contactData.whatsapp,
        email: contactData.email,
        responsavel_nome: responsibleData.nomeCompleto,
        responsavel_cpf: responsibleData.cpf.replace(/\D/g, ''),
        responsavel_rg: responsibleData.rg || '',
        responsavel_cargo: responsibleData.cargo,
        responsavel_nascimento: responsibleData.dataNascimento || null,
      };
      
      // Link to user if logged in
      if (user) {
        insertData.user_id = user.id;
      }

      const { data, error } = await supabase
        .from('companies')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  };

  const saveOrder = async (companyId: string, paymentUrl: string) => {
    const orderItems = items.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unit: item.product.unit,
      unitPrice: item.product.price,
      totalPrice: item.product.price * item.quantity,
    }));

    const { data, error } = await supabase
      .from('orders')
      .insert({
        company_id: companyId,
        payment_url: paymentUrl,
        total_amount: getTotal(),
        status: 'pending',
        items: orderItems,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const handleCreatePayment = async () => {
    setIsLoading(true);
    try {
      // Save company data first
      const company = await saveCompanyData();

      // Build description from items
      const description = items.map(item => 
        `${item.product.name} x ${item.quantity} ${item.product.unit}`
      ).join(', ');

      // Calculate total in cents (minimum R$1.00 = 100 cents required by AbacatePay)
      const totalInCents = Math.max(100, Math.round(getTotal() * 100));

      // Format phone number for AbacatePay (expects format like "(11) 4002-8922")
      const formatPhoneForApi = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 11) {
          return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        } else if (digits.length === 10) {
          return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        }
        return phone;
      };

      // Use CPF with formatting for AbacatePay (expects format like "123.456.789-01")
      const customer = {
        name: responsibleData.nomeCompleto,
        cellphone: formatPhoneForApi(contactData.whatsapp),
        email: contactData.email,
        taxId: responsibleData.cpf, // CPF already formatted from form
      };

      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          amount: totalInCents,
          description: description.slice(0, 200), // Limit description length
          customer,
          externalId: company.id,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao criar pagamento');
      }

      console.log('AbacatePay response:', data);

      // The response should contain the QR code data
      if (data?.data) {
        const paymentData = data.data;
        
        // Save company ID for Realtime subscription
        setExistingCompanyId(company.id);
        
        // Save order with brCode for reference
        await saveOrder(company.id, paymentData.brCode || paymentData.id);
        
        // Set QR Code image (base64) and brCode for copy
        if (paymentData.brCodeBase64) {
          setQrCodeImage(paymentData.brCodeBase64);
        }
        if (paymentData.brCode) {
          setBrCode(paymentData.brCode);
        }
        
        setPaymentUrl(paymentData.url || null);
        setPaymentCreated(true);
        setStep(5);
        toast({
          title: "Pedido registrado!",
          description: "Escaneie o QR Code ou copie o código PIX para pagar.",
        });
      } else {
        throw new Error('Resposta de pagamento inválida');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Erro ao processar pedido",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(companyData.razaoSocial && companyData.nomeFantasia && companyData.cnpj && 
          (companyData.isento || companyData.inscricaoEstadual) && companyData.naturezaJuridica);
      case 2:
        return !!(addressData.cep && addressData.endereco && addressData.numero && 
          addressData.bairro && addressData.cidade && addressData.estado);
      case 3:
        return !!(contactData.whatsapp && contactData.email);
      case 4:
        return !!(responsibleData.nomeCompleto && responsibleData.cpf && responsibleData.cargo);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
    } else {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de continuar.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const stepTitles = [
    { icon: Building2, label: "Dados da Empresa" },
    { icon: MapPin, label: "Endereço" },
    { icon: Phone, label: "Contatos" },
    { icon: User, label: "Responsável" },
    { icon: QrCode, label: "Pagamento" },
  ];

  const handleClose = () => {
    if (paymentCreated || paymentConfirmed) {
      clearCart();
    }
    onOpenChange(false);
    setStep(1);
    setPaymentUrl(null);
    setQrCodeImage(null);
    setBrCode(null);
    setPaymentCreated(false);
    setPaymentConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">
            Finalizar Pedido
          </DialogTitle>
          <DialogDescription>
            Complete o cadastro da sua empresa para gerar o pagamento via PIX
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-6 px-2">
          {stepTitles.map((s, index) => {
            const StepIcon = s.icon;
            const isActive = step === index + 1;
            const isCompleted = step > index + 1;
            return (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      isActive && "bg-primary text-primary-foreground",
                      isCompleted && "bg-primary/20 text-primary",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span className={cn(
                    "text-xs mt-1 text-center hidden sm:block",
                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {s.label}
                  </span>
                </div>
                {index < stepTitles.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-1",
                    step > index + 1 ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Company Data */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="razaoSocial">Razão Social *</Label>
                <Input
                  id="razaoSocial"
                  value={companyData.razaoSocial}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, razaoSocial: e.target.value }))}
                  placeholder="Razão Social conforme CNPJ"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
                <Input
                  id="nomeFantasia"
                  value={companyData.nomeFantasia}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, nomeFantasia: e.target.value }))}
                  placeholder="Nome comercial da empresa"
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={companyData.cnpj}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <Label htmlFor="inscricaoEstadual">Inscrição Estadual {companyData.isento ? "(Isento)" : "*"}</Label>
                <Input
                  id="inscricaoEstadual"
                  value={companyData.inscricaoEstadual}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, inscricaoEstadual: e.target.value }))}
                  placeholder="Número da IE"
                  disabled={companyData.isento}
                />
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id="isento"
                    checked={companyData.isento}
                    onCheckedChange={(checked) => setCompanyData(prev => ({ 
                      ...prev, 
                      isento: checked as boolean,
                      inscricaoEstadual: checked ? '' : prev.inscricaoEstadual
                    }))}
                  />
                  <label htmlFor="isento" className="text-sm text-muted-foreground">Isento de IE</label>
                </div>
              </div>
              <div>
                <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
                <Input
                  id="inscricaoMunicipal"
                  value={companyData.inscricaoMunicipal}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, inscricaoMunicipal: e.target.value }))}
                  placeholder="Número da IM (se houver)"
                />
              </div>
              <div>
                <Label htmlFor="dataAbertura">Data de Abertura</Label>
                <Input
                  id="dataAbertura"
                  type="date"
                  value={companyData.dataAbertura}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, dataAbertura: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="naturezaJuridica">Natureza Jurídica *</Label>
                <Select 
                  value={companyData.naturezaJuridica} 
                  onValueChange={(value) => setCompanyData(prev => ({ ...prev, naturezaJuridica: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEI">MEI</SelectItem>
                    <SelectItem value="ME">ME - Microempresa</SelectItem>
                    <SelectItem value="EPP">EPP - Empresa de Pequeno Porte</SelectItem>
                    <SelectItem value="LTDA">LTDA</SelectItem>
                    <SelectItem value="SA">S/A</SelectItem>
                    <SelectItem value="EIRELI">EIRELI</SelectItem>
                    <SelectItem value="SLU">SLU - Sociedade Limitada Unipessoal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cnae">CNAE Principal</Label>
                <Input
                  id="cnae"
                  value={companyData.cnae}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, cnae: e.target.value }))}
                  placeholder="Ex: 4789-0/99"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <strong>Importante:</strong> Preencha o endereço exatamente como aparece na Receita Federal para evitar rejeição da NF-e.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  value={addressData.cep}
                  onChange={(e) => {
                    const formatted = formatCEP(e.target.value);
                    setAddressData(prev => ({ ...prev, cep: formatted }));
                    fetchAddressByCep(formatted);
                  }}
                  placeholder="00000-000"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  value={addressData.endereco}
                  onChange={(e) => setAddressData(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Rua, Avenida, etc."
                />
              </div>
              <div>
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  value={addressData.numero}
                  onChange={(e) => setAddressData(prev => ({ ...prev, numero: e.target.value }))}
                  placeholder="123"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={addressData.complemento}
                  onChange={(e) => setAddressData(prev => ({ ...prev, complemento: e.target.value }))}
                  placeholder="Sala, Andar, Bloco..."
                />
              </div>
              <div>
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  value={addressData.bairro}
                  onChange={(e) => setAddressData(prev => ({ ...prev, bairro: e.target.value }))}
                  placeholder="Bairro"
                />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={addressData.cidade}
                  onChange={(e) => setAddressData(prev => ({ ...prev, cidade: e.target.value }))}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Select 
                  value={addressData.estado} 
                  onValueChange={(value) => setAddressData(prev => ({ ...prev, estado: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contacts */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefoneFixo">Telefone Fixo</Label>
                <Input
                  id="telefoneFixo"
                  value={contactData.telefoneFixo}
                  onChange={(e) => setContactData(prev => ({ ...prev, telefoneFixo: formatPhone(e.target.value) }))}
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp Comercial *</Label>
                <Input
                  id="whatsapp"
                  value={contactData.whatsapp}
                  onChange={(e) => setContactData(prev => ({ ...prev, whatsapp: formatPhone(e.target.value) }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="email">E-mail para NF-e e Boletos *</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactData.email}
                  onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="financeiro@empresa.com.br"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Responsible */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
              Esses dados serão utilizados para análise de crédito em Serasa, Boa Vista e SPC.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                <Input
                  id="nomeCompleto"
                  value={responsibleData.nomeCompleto}
                  onChange={(e) => setResponsibleData(prev => ({ ...prev, nomeCompleto: e.target.value }))}
                  placeholder="Nome completo do responsável"
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={responsibleData.cpf}
                  onChange={(e) => setResponsibleData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={responsibleData.rg}
                  onChange={(e) => setResponsibleData(prev => ({ ...prev, rg: e.target.value }))}
                  placeholder="Número do RG"
                />
              </div>
              <div>
                <Label htmlFor="cargo">Cargo *</Label>
                <Select 
                  value={responsibleData.cargo} 
                  onValueChange={(value) => setResponsibleData(prev => ({ ...prev, cargo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="socio">Sócio</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="diretor">Diretor</SelectItem>
                    <SelectItem value="procurador">Procurador</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={responsibleData.dataNascimento}
                  onChange={(e) => setResponsibleData(prev => ({ ...prev, dataNascimento: e.target.value }))}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-6 p-4 rounded-lg bg-secondary/50 border">
              <h4 className="font-semibold text-foreground mb-3">Resumo do Pedido</h4>
              <div className="space-y-2 text-sm">
                {items.map(item => (
                  <div key={item.product.id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="font-medium">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(getTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Payment */}
        {step === 5 && paymentCreated && (
          <div className="text-center space-y-6 py-4">
            {/* Payment Confirmed Animation */}
            {paymentConfirmed ? (
              <div className="animate-scale-in">
                <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <PartyPopper className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="font-display text-2xl font-bold text-green-600 mb-2">
                  Pagamento Confirmado!
                </h3>
                <p className="text-muted-foreground">
                  Obrigado pela compra! Redirecionando para seus pedidos...
                </p>
                <div className="mt-4 flex justify-center">
                  <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    Cobrança PIX Gerada!
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Escaneie o QR Code abaixo ou copie o código PIX para pagar.
                  </p>
                </div>
                
                {/* QR Code Image */}
                {qrCodeImage && (
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg border-2 border-primary/20 shadow-lg">
                      <img 
                        src={qrCodeImage} 
                        alt="QR Code PIX" 
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                  </div>
                )}
                
                <div className="p-4 rounded-lg bg-secondary/50 border">
                  <p className="text-sm font-medium text-foreground mb-2">Total a pagar:</p>
                  <p className="text-2xl font-display font-bold text-primary">{formatPrice(getTotal())}</p>
                </div>
                
                {/* Copy PIX Code Button */}
                {brCode && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Ou copie o código PIX:</p>
                    <div className="flex gap-2">
                      <Input 
                        value={brCode} 
                        readOnly 
                        className="text-xs font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(brCode);
                          toast({
                            title: "Código copiado!",
                            description: "Cole no seu app de banco para pagar.",
                          });
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground animate-pulse">
                  Aguardando confirmação do pagamento...
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    variant="outline"
                    size="lg" 
                    className="flex-1 gap-2"
                    onClick={() => {
                      handleClose();
                      navigate('/');
                    }}
                  >
                    <Home className="w-4 h-4" />
                    Voltar ao Início
                  </Button>
                  <Button 
                    size="lg" 
                    className="flex-1 gap-2"
                    onClick={() => {
                      handleClose();
                      navigate('/pedidos');
                    }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Ver Meus Pedidos
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </Button>
            
            {step < 4 ? (
              <Button onClick={nextStep} className="gap-2">
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleCreatePayment} 
                disabled={isLoading || !validateStep(4)}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    Gerar QR Code PIX
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
