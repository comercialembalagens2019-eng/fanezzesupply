import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { products } from "@/data/products";
import { ABACATEPAY_PUBLIC_KEY, CardPayment, type CardCustomer } from "@/components/checkout/CardPayment";
import { supabase } from "@/integrations/supabase/client";
import { getFunctionErrorMessage } from "@/lib/functionErrors";
import { getUnitPrice, shippingFor } from "@/lib/pricing";
import { toast } from "@/hooks/use-toast";
import { Loader2, QrCode, Building2, MapPin, Phone, ChevronRight, ChevronLeft, CheckCircle, Copy, Home, ShoppingBag, PartyPopper, CreditCard, LogIn, FileText, ExternalLink, Lock, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
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

const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
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

// Pix first and suggested: it confirms in seconds and costs the customer nothing extra.
const PAYMENT_OPTIONS = [
  { id: 'pix', label: 'Pix', hint: 'Aprovação na hora, sem taxa extra', icon: QrCode, badge: 'Recomendado' },
  { id: 'boleto', label: 'Boleto', hint: 'Vence em 3 dias · também traz um Pix', icon: FileText, badge: null },
  { id: 'card', label: 'Cartão de crédito', hint: 'Visa e Mastercard, à vista', icon: CreditCard, badge: null },
] as const;

export const CheckoutModal = ({ open, onOpenChange }: CheckoutModalProps) => {
  const { items, getTotal, clearCart } = useCart();
  const { user, isAdmin } = useAuth();
  // Admin buying only the test product: billed to FNZ itself, so the company form is skipped.
  const isTestOrder =
    isAdmin && items.length > 0 && items.every((item) => products.find((p) => p.id === item.product.id)?.adminOnly);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [brCode, setBrCode] = useState<string | null>(null);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [existingCompanyId, setExistingCompanyId] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentPixId, setCurrentPixId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'card'>('pix');
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [boletoLine, setBoletoLine] = useState<string | null>(null);
  const [chargedTotal, setChargedTotal] = useState<number | null>(null);
  const [cardCustomer, setCardCustomer] = useState<CardCustomer | null>(null);
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

  // Load existing company data for logged-in users
  useEffect(() => {
    const loadUserCompany = async () => {
      // Don't load/change step if payment was already created
      if (!user || !open || paymentCreated) return;
      if (isTestOrder) {
        setStep(4);
        return;
      }
      
      setIsLoadingCompany(true);
      try {
        const { data: company, error } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
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
          
          // Skip directly to step 4 (payment) if all required data is filled
          if (company.razao_social && company.cnpj && company.whatsapp) {
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
  }, [user, open, paymentCreated, isTestOrder]);

  // Handle payment confirmation - verify DB status before confirming
  const handlePaymentConfirmed = async () => {
    if (paymentConfirmed) return; // Prevent duplicate calls
    
    console.log('Payment confirmation triggered, verifying DB status...');
    
    // Double-check the database to ensure payment is really confirmed
    if (currentOrderId) {
      try {
        const { data: order, error } = await supabase
          .from('orders')
          .select('status')
          .eq('id', currentOrderId)
          .maybeSingle();
        
        if (error) {
          console.error('Error verifying payment status:', error);
          return;
        }
        
        if (order?.status !== 'paid') {
          console.log('Payment not yet confirmed in DB, waiting...');
          return;
        }
        
        console.log('Payment verified in DB as paid!');
      } catch (error) {
        console.error('Error in payment verification:', error);
        return;
      }
    }
    
    setPaymentConfirmed(true);
    toast({
      title: "🎉 Pagamento Confirmado!",
      description: "Seu pedido foi pago com sucesso. Redirecionando...",
    });
    
    // Clear cart immediately
    clearCart();
    
    // Redirect after animation
    setTimeout(() => {
      onOpenChange(false);
      navigate('/pedidos');
    }, 3000);
  };

  // Listen for payment confirmation via AbacatePay status checks + Realtime + DB polling
  useEffect(() => {
    if (!paymentCreated || !currentOrderId || paymentConfirmed) return;

    console.log('Starting payment status monitoring for order:', currentOrderId, 'pixId:', currentPixId);

    // Setup Supabase Realtime subscription for instant updates from webhook
    const channel = supabase
      .channel(`order-${currentOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${currentOrderId}`,
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          if (payload.new && (payload.new as { status: string }).status === 'paid') {
            handlePaymentConfirmed();
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Ask AbacatePay for the Pix status (the server confirms the order if it is paid)
    const checkPixStatus = async () => {
      if (!currentPixId) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('check-abacate-payment', {
          body: { orderId: currentOrderId },
        });

        if (error) {
          console.error('Error checking PIX status:', error);
          return;
        }

        console.log('PIX status response:', data);
        
        if (data?.status === 'PAID') {
          // Server already updated the DB, but verify before confirming
          handlePaymentConfirmed();
        }
      } catch (error) {
        console.error('Error in PIX status check:', error);
      }
    };

    // DB polling fallback - check more frequently
    const checkDbStatus = async () => {
      try {
        const { data: order, error } = await supabase
          .from('orders')
          .select('status')
          .eq('id', currentOrderId)
          .maybeSingle();

        if (error) {
          console.error('Error checking DB status:', error);
          return;
        }

        console.log('DB status check:', order?.status);

        if (order?.status === 'paid') {
          handlePaymentConfirmed();
        }
      } catch (error) {
        console.error('Error in DB polling:', error);
      }
    };

    // Check immediately
    checkPixStatus();
    checkDbStatus();

    // Poll the Asaas status and the DB every 5 seconds
    const pixIntervalId = setInterval(checkPixStatus, 5000);
    const dbIntervalId = setInterval(checkDbStatus, 5000);

    return () => {
      console.log('Cleaning up payment monitoring');
      supabase.removeChannel(channel);
      clearInterval(pixIntervalId);
      clearInterval(dbIntervalId);
    };
  }, [paymentCreated, currentOrderId, currentPixId, paymentConfirmed, clearCart, onOpenChange, navigate]);

  // Charged by the server from the company's saved address; shown here before paying.
  const shipping = isTestOrder ? 0 : shippingFor(addressData.cidade, addressData.estado);

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
          responsavel_nome: companyData.nomeFantasia, // Use company name as fallback
          responsavel_cpf: '00000000000', // Placeholder
          responsavel_rg: '',
          responsavel_cargo: 'socio',
          responsavel_nascimento: null,
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
        responsavel_nome: companyData.nomeFantasia,
        responsavel_cpf: '00000000000',
        responsavel_rg: '',
        responsavel_cargo: 'socio',
        responsavel_nascimento: null,
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
        responsavel_nome: companyData.nomeFantasia,
        responsavel_cpf: '00000000000',
        responsavel_rg: '',
        responsavel_cargo: 'socio',
        responsavel_nascimento: null,
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

      // The CNPJ is unique; another account's company is invisible here because of RLS.
      if (error?.code === '23505') {
        throw new Error('Este CNPJ já está cadastrado em outra conta. Entre em contato conosco para vincular.');
      }
      if (error) throw error;
      return data;
    }
  };

  // One server call creates the order and its AbacatePay charge; prices come from the server.
  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const company = isTestOrder ? null : await saveCompanyData();
      if (company) setExistingCompanyId(company.id);

      const { data, error } = await supabase.functions.invoke('create-abacate-payment', {
        body: {
          ...(company ? { companyId: company.id } : { testOrder: true }),
          method: paymentMethod,
          items: items.map(item => ({ productId: item.product.id, quantity: item.quantity })),
        },
      });
      if (error) {
        throw new Error(await getFunctionErrorMessage(error, 'Erro ao criar pagamento'));
      }
      if (!data?.orderId) throw new Error('Resposta de pagamento inválida');

      setCurrentOrderId(data.orderId);
      setChargedTotal(typeof data.totalCents === 'number' ? data.totalCents / 100 : null);

      if (paymentMethod === 'card') {
        // The order exists now; the card form charges exactly its total.
        setCardCustomer(data.customer ?? null);
      } else if (paymentMethod === 'pix') {
        setQrCodeImage(data.pix?.image ?? null);
        setBrCode(data.pix?.payload ?? null);
        // Enables the status polling below.
        setCurrentPixId(data.orderId);
        toast({ title: "Pedido registrado!", description: "Escaneie o QR Code ou copie o código Pix para pagar." });
      } else {
        setBoletoUrl(data.boleto?.url ?? null);
        setBoletoLine(data.boleto?.identificationField ?? null);
        toast({ title: "Boleto gerado!", description: "Abra o boleto ou copie a linha digitável para pagar." });
      }
      setPaymentCreated(true);
      setStep(5);
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
        return true;
      case 3:
        return !!(contactData.whatsapp && contactData.email);
      case 4:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      // Step 2 (address) was removed: go straight from company to contacts
      setStep(prev => Math.min(prev === 1 ? 3 : prev + 1, 5));
    } else {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de continuar.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => setStep(prev => (prev === 3 ? 1 : Math.max(prev - 1, 1)));

  const stepTitles = [
    { icon: Building2, label: "Empresa", step: 1 },
    { icon: Phone, label: "Contatos", step: 3 },
    { icon: QrCode, label: "Pagamento", step: 4 },
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
    setBoletoUrl(null);
    setBoletoLine(null);
    setCardCustomer(null);
    setChargedTotal(null);
    setCurrentPixId(null);
    setPaymentCreated(false);
    setPaymentConfirmed(false);
    setCurrentOrderId(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">
            Finalizar Pedido
          </DialogTitle>
          <DialogDescription>
            {user ? "Confirme os dados e escolha a forma de pagamento" : "Faça login para continuar com o pedido"}
          </DialogDescription>
        </DialogHeader>

        {/* Login Required Screen */}
        {!user && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Login Necessário</h3>
              <p className="text-muted-foreground max-w-sm">
                Para finalizar seu pedido, é necessário estar logado em sua conta. 
                Se ainda não possui uma conta, você pode criar uma gratuitamente.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <Button asChild className="flex-1">
                <Link to="/login" state={{ from: "/carrinho" }} onClick={() => onOpenChange(false)}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Fazer Login
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/cadastro" onClick={() => onOpenChange(false)}>
                  Criar Conta
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Authenticated User Content */}
        {user && (
          <>
        {/* Stepper */}
        <div className="flex items-center justify-between mb-6 px-2">
          {stepTitles.map((s, index) => {
            const StepIcon = s.icon;
            const isActive = step === s.step || (step === 5 && index === stepTitles.length - 1);
            const isCompleted = step > s.step;
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

        {/* Step 4: Payment Selection */}
        {step === 4 && !paymentCreated && (
          <div className="space-y-5">
            {/* Order summary: transparent pricing, total stated once and clearly */}
            <div className="rounded-2xl bg-secondary/50 p-4">
              <h4 className="font-semibold text-foreground mb-3">Resumo do pedido</h4>
              <div className="space-y-2 text-sm">
                {items.map(item => (
                  <div key={item.product.id} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      {item.product.name} × {item.quantity.toLocaleString("pt-BR")}
                    </span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatPrice(getUnitPrice(item.product.id, item.quantity, item.product.price) * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    Frete{addressData.cidade ? ` (${addressData.cidade}/${addressData.estado})` : ""}
                  </span>
                  {shipping === 0 ? (
                    <span className="font-semibold text-success">Grátis</span>
                  ) : (
                    <span className="font-medium text-foreground tabular-nums">{formatPrice(shipping)}</span>
                  )}
                </div>
                <div className="border-t border-border pt-3 mt-1 flex items-baseline justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-extrabold text-foreground tabular-nums">{formatPrice(getTotal() + shipping)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground">Frete grátis para Joinville/SC.</p>
                )}
              </div>
            </div>

            {/* Payment method: radio group, Pix suggested first */}
            <div>
              <h4 id="payment-method-label" className="font-semibold text-foreground mb-3">Como você prefere pagar?</h4>
              <div role="radiogroup" aria-labelledby="payment-method-label" className="space-y-2">
                {PAYMENT_OPTIONS.filter((option) => option.id !== 'card' || ABACATEPAY_PUBLIC_KEY).map((option) => {
                  const selected = paymentMethod === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setPaymentMethod(option.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      )}
                    >
                      <span className={cn("w-10 h-10 rounded-lg grid place-items-center shrink-0", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <option.icon className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{option.label}</span>
                          {option.badge && (
                            <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-success/15 text-success">{option.badge}</span>
                          )}
                        </span>
                        <span className="block text-xs text-muted-foreground">{option.hint}</span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn("w-5 h-5 rounded-full border-2 grid place-items-center shrink-0", selected ? "border-primary" : "border-muted-foreground/40")}
                      >
                        {selected && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quiet trust signals */}
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" aria-hidden="true" /> Pagamento seguro</li>
              <li className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" aria-hidden="true" /> NF-e em todo pedido</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Dados protegidos</li>
            </ul>
          </div>
        )}

        {/* Step 5: Payment - PIX */}
        {step === 5 && paymentCreated && paymentMethod === 'pix' && (
          <div className="text-center space-y-6 py-4">
            {/* Payment Confirmed Animation */}
            {paymentConfirmed ? (
              <div className="animate-scale-in">
                <div className="w-24 h-24 mx-auto bg-success/15 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <PartyPopper className="w-12 h-12 text-success" />
                </div>
                <h3 className="font-display text-2xl font-bold text-success mb-2">
                  Pagamento Confirmado!
                </h3>
                <p className="text-muted-foreground">
                  Obrigado pela compra! Redirecionando para seus pedidos...
                </p>
                <div className="mt-4 flex justify-center">
                  <div className="w-8 h-8 border-4 border-success border-t-transparent rounded-full animate-spin" />
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
                
                {chargedTotal !== null && (
                  <div className="p-4 rounded-lg bg-secondary/50 border">
                    <p className="text-sm text-muted-foreground">Valor a pagar</p>
                    <p className="text-2xl font-display font-bold text-primary tabular-nums">{formatPrice(chargedTotal)}</p>
                  </div>
                )}
                
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

        {/* Step 5: Payment - Boleto */}
        {step === 5 && paymentCreated && paymentMethod === 'boleto' && (
          <div className="text-center space-y-6 py-4">
            {paymentConfirmed ? (
              <div className="animate-scale-in">
                <div className="w-24 h-24 mx-auto bg-success/15 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <PartyPopper className="w-12 h-12 text-success" />
                </div>
                <h3 className="font-display text-2xl font-bold text-success mb-2">
                  Pagamento Confirmado!
                </h3>
                <p className="text-muted-foreground">
                  Obrigado pela compra! Redirecionando para seus pedidos...
                </p>
                <div className="mt-4 flex justify-center">
                  <div className="w-8 h-8 border-4 border-success border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    Boleto Gerado!
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Clique no botão abaixo para abrir e pagar o boleto.
                  </p>
                </div>
                
                {chargedTotal !== null && (
                  <div className="p-4 rounded-lg bg-secondary/50 border">
                    <p className="text-sm text-muted-foreground">Valor a pagar</p>
                    <p className="text-2xl font-display font-bold text-primary tabular-nums">{formatPrice(chargedTotal)}</p>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-warning-soft border border-warning/30 text-warning-soft-foreground text-sm">
                  <strong>Importante:</strong> O boleto vence em 3 dias. Após o pagamento, a compensação leva até 3 dias úteis.
                </div>
                
                {boletoLine && (
                  <div className="space-y-2 text-left">
                    <p className="text-xs text-muted-foreground">Linha digitável:</p>
                    <div className="flex gap-2">
                      <Input value={boletoLine} readOnly className="text-xs font-mono" />
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Copiar linha digitável"
                        onClick={() => {
                          navigator.clipboard.writeText(boletoLine);
                          toast({ title: "Linha digitável copiada!", description: "Cole no app do seu banco para pagar." });
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {boletoUrl && (
                  <Button
                    size="lg"
                    className="gap-2 w-full"
                    onClick={() => window.open(boletoUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir Boleto
                  </Button>
                )}
                
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
                    variant="outline"
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

        {/* Step 5: Payment - Card */}
        {step === 5 && paymentCreated && paymentMethod === 'card' && (
          <div className="text-center space-y-6 py-4">
            {paymentConfirmed ? (
              <div className="animate-scale-in">
                <div className="w-24 h-24 mx-auto bg-success/15 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <PartyPopper className="w-12 h-12 text-success" />
                </div>
                <h3 className="font-display text-2xl font-bold text-success mb-2">Pagamento Confirmado!</h3>
                <p className="text-muted-foreground">Obrigado pela compra! Redirecionando para seus pedidos...</p>
              </div>
            ) : currentOrderId && cardCustomer && chargedTotal !== null ? (
              <>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-1">Pagamento com cartão</h3>
                  <p className="text-muted-foreground text-sm">Valor: {formatPrice(chargedTotal)}</p>
                </div>
                <CardPayment
                  orderId={currentOrderId}
                  totalCents={Math.round(chargedTotal * 100)}
                  customer={cardCustomer}
                  formattedTotal={formatPrice(chargedTotal)}
                  onPaid={handlePaymentConfirmed}
                />
              </>
            ) : null}
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 5 && !paymentCreated && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1 || isTestOrder}
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
                onClick={handlePayment}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : paymentMethod === 'pix' ? (
                  <>
                    <QrCode className="w-4 h-4" />
                    Pagar {formatPrice(getTotal() + shipping)} com Pix
                  </>
                ) : paymentMethod === 'boleto' ? (
                  <>
                    <FileText className="w-4 h-4" />
                    Gerar boleto de {formatPrice(getTotal() + shipping)}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pagar {formatPrice(getTotal() + shipping)} no cartão
                  </>
                )}
              </Button>
            )}
          </div>
        )}
          </>
        )}

      </DialogContent>
    </Dialog>
  );
};
