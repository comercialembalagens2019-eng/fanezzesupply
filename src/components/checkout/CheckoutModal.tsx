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
import { Loader2, QrCode, Building2, MapPin, Phone, ChevronRight, ChevronLeft, CheckCircle, Copy, Home, ShoppingBag, PartyPopper, CreditCard, LogIn, FileText, ExternalLink } from "lucide-react";
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
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentPixId, setCurrentPixId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto'>('pix');
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [boletoCpf, setBoletoCpf] = useState('');
  const navigate = useNavigate();

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  };

  const validateCPF = (cpfValue: string): boolean => {
    const cpfClean = cpfValue.replace(/\D/g, '');
    
    if (cpfClean.length !== 11) return false;
    
    // Check for known invalid patterns (all same digits)
    if (/^(\d)\1+$/.test(cpfClean)) return false;
    
    // Calculate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpfClean[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    let firstDigit = remainder === 10 ? 0 : remainder;
    
    if (parseInt(cpfClean[9]) !== firstDigit) return false;
    
    // Calculate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpfClean[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    let secondDigit = remainder === 10 ? 0 : remainder;
    
    return parseInt(cpfClean[10]) === secondDigit;
  };

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
          
          // Skip directly to step 4 (payment) if all required data is filled
          if (company.razao_social && company.cnpj && company.endereco && company.whatsapp) {
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

  // Listen for payment confirmation via AbacatePay API + Realtime + DB Polling
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

    // Check PIX status directly with AbacatePay API - now also updates DB on server side
    const checkPixStatus = async () => {
      if (!currentPixId) return;
      
      try {
        console.log('Checking PIX status via AbacatePay API...');
        const { data, error } = await supabase.functions.invoke('check-pix-status', {
          body: { pixId: currentPixId, orderId: currentOrderId },
        });

        if (error) {
          console.error('Error checking PIX status:', error);
          return;
        }

        console.log('PIX status response:', data);
        
        if (data?.data?.status === 'PAID') {
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

    // Poll PIX status every 3 seconds, DB every 5 seconds (more frequent)
    const pixIntervalId = setInterval(checkPixStatus, 3000);
    const dbIntervalId = setInterval(checkDbStatus, 5000);

    return () => {
      console.log('Cleaning up payment monitoring');
      supabase.removeChannel(channel);
      clearInterval(pixIntervalId);
      clearInterval(dbIntervalId);
    };
  }, [paymentCreated, currentOrderId, currentPixId, paymentConfirmed, clearCart, onOpenChange, navigate]);

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

      if (error) throw error;
      return data;
    }
  };

  const saveOrder = async (companyId: string, paymentUrl: string, method: 'pix' | 'card' | 'boleto') => {
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
        payment_method: method,
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

      // Use company name as customer name since we removed responsible person data
      const customer = {
        name: companyData.nomeFantasia || companyData.razaoSocial,
        cellphone: formatPhoneForApi(contactData.whatsapp),
        email: contactData.email,
        taxId: companyData.cnpj, // Use CNPJ
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
        
        // Save company ID
        setExistingCompanyId(company.id);
        
        // Store PIX ID for status checking
        if (paymentData.id) {
          setCurrentPixId(paymentData.id);
        }
        
        // Save order with brCode for reference and get order ID
        const savedOrder = await saveOrder(company.id, paymentData.brCode || paymentData.id, 'pix');
        console.log('Saved order:', savedOrder);
        setCurrentOrderId(savedOrder.id);
        
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

  const handleStripeCheckout = async () => {
    setIsLoading(true);
    try {
      // Save company data first
      const company = await saveCompanyData();
      setExistingCompanyId(company.id);

      // Build cart items for Stripe
      const cartItems = items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unit: item.product.unit,
        unitPrice: item.product.price,
        stripePriceId: item.product.stripePriceId,
      }));

      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          items: cartItems,
          companyId: company.id,
          customerEmail: contactData.email,
          customerName: companyData.nomeFantasia || companyData.razaoSocial,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao criar checkout');
      }

      if (data?.url) {
        // Redirect to Stripe checkout in the same window
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      toast({
        title: "Erro ao processar pagamento",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoletoPayment = async () => {
    setIsLoading(true);
    try {
      // Save company data first
      const company = await saveCompanyData();
      setExistingCompanyId(company.id);

      // Calculate total in cents (minimum R$5.00 for boleto)
      const totalInCents = Math.max(500, Math.round(getTotal() * 100));

      // Save order first
      const savedOrder = await saveOrder(company.id, 'boleto-pending', 'boleto');
      setCurrentOrderId(savedOrder.id);

      const { data, error } = await supabase.functions.invoke('create-boleto-payment', {
        body: {
          amount: totalInCents,
          customer_email: contactData.email,
          customer_name: companyData.nomeFantasia || companyData.razaoSocial,
          customer_cpf: boletoCpf.replace(/\D/g, ''),
          order_id: savedOrder.id,
          address: {
            line1: `${addressData.endereco}, ${addressData.numero}`,
            line2: addressData.complemento || undefined,
            city: addressData.cidade,
            state: addressData.estado,
            postal_code: addressData.cep.replace(/\D/g, ''),
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao criar boleto');
      }

      if (data?.boleto_url) {
        setBoletoUrl(data.boleto_url);
        setPaymentCreated(true);
        setStep(5);
        
        // Update order with payment intent ID
        await supabase
          .from('orders')
          .update({ payment_url: data.boleto_url })
          .eq('id', savedOrder.id);

        toast({
          title: "Boleto gerado!",
          description: "Clique para abrir e pagar o boleto.",
        });
      } else {
        // Boleto might need confirmation step - open Stripe page
        if (data?.client_secret) {
          toast({
            title: "Boleto em processamento",
            description: "O boleto será disponibilizado em breve.",
          });
          setPaymentCreated(true);
          setStep(5);
        } else {
          throw new Error('Resposta de boleto inválida');
        }
      }
    } catch (error) {
      console.error('Boleto payment error:', error);
      toast({
        title: "Erro ao gerar boleto",
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
        // For boleto, require valid CPF
        if (paymentMethod === 'boleto') {
          if (!validateCPF(boletoCpf)) {
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
    } else {
      // Custom error message for CPF validation
      if (step === 4 && paymentMethod === 'boleto') {
        const cpfDigits = boletoCpf.replace(/\D/g, '');
        if (cpfDigits.length !== 11) {
          toast({
            title: "CPF inválido",
            description: "O CPF deve ter 11 dígitos.",
            variant: "destructive",
          });
        } else if (!validateCPF(boletoCpf)) {
          toast({
            title: "CPF inválido",
            description: "Os dígitos verificadores do CPF são inválidos.",
            variant: "destructive",
          });
        }
        return;
      }
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de continuar.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const stepTitles = [
    { icon: Building2, label: "Empresa" },
    { icon: MapPin, label: "Endereço" },
    { icon: Phone, label: "Contatos" },
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
    setBoletoUrl(null);
    setBoletoCpf('');
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
                <Link to="/login" onClick={() => onOpenChange(false)}>
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
            const isActive = step === index + 1 || (step === 5 && index === 3);
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

        {/* Step 4: Payment Selection */}
        {step === 4 && !paymentCreated && (
          <div className="space-y-4">
            {/* Pickup Only Notice */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800 text-sm">Frete grátis para Joinville</p>
                <p className="text-amber-700 text-xs">Demais localidades: R$ 19,90.</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-4 rounded-lg bg-secondary/50 border">
              <h4 className="font-semibold text-foreground mb-3">Resumo do Pedido</h4>
              <div className="space-y-2 text-sm">
                {items.map(item => (
                  <div key={item.product.id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="font-medium text-primary">Consulte-nos</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">Consulte-nos</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">Forma de Pagamento</h4>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    paymentMethod === 'pix'
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <QrCode className={cn("w-8 h-8", paymentMethod === 'pix' ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("font-medium text-sm", paymentMethod === 'pix' ? "text-primary" : "text-foreground")}>PIX</span>
                  <span className="text-xs text-muted-foreground text-center">Instantâneo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('boleto')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    paymentMethod === 'boleto'
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <FileText className={cn("w-8 h-8", paymentMethod === 'boleto' ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("font-medium text-sm", paymentMethod === 'boleto' ? "text-primary" : "text-foreground")}>Boleto</span>
                  <span className="text-xs text-muted-foreground text-center">28 dias para pagar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    paymentMethod === 'card'
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <CreditCard className={cn("w-8 h-8", paymentMethod === 'card' ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("font-medium text-sm", paymentMethod === 'card' ? "text-primary" : "text-foreground")}>Cartão</span>
                  <span className="text-xs text-muted-foreground text-center">Crédito/Débito</span>
                </button>
              </div>
            </div>

            {/* CPF field for Boleto */}
            {paymentMethod === 'boleto' && (
              <div className="mt-4">
                <Label htmlFor="boletoCpf">CPF do Responsável *</Label>
                <Input
                  id="boletoCpf"
                  value={boletoCpf}
                  onChange={(e) => setBoletoCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O CPF é obrigatório para emissão do boleto bancário.
                </p>
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span>O boleto vence em <strong>28 dias</strong> após a emissão.</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Payment - PIX */}
        {step === 5 && paymentCreated && paymentMethod === 'pix' && (
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
                  <p className="text-sm font-medium text-foreground mb-2">Entre em contato para valores:</p>
                  <p className="text-lg font-display font-bold text-primary">Consulte-nos</p>
                  <p className="text-sm text-muted-foreground mt-1">(47) 99149-0027</p>
                  <p className="text-sm text-muted-foreground">vendas@fnzsupply.com.br</p>
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

        {/* Step 5: Payment - Boleto */}
        {step === 5 && paymentCreated && paymentMethod === 'boleto' && (
          <div className="text-center space-y-6 py-4">
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
                
                <div className="p-4 rounded-lg bg-secondary/50 border">
                  <p className="text-sm font-medium text-foreground mb-2">Entre em contato para valores:</p>
                  <p className="text-lg font-display font-bold text-primary">Consulte-nos</p>
                  <p className="text-sm text-muted-foreground mt-1">(47) 99149-0027</p>
                  <p className="text-sm text-muted-foreground">vendas@fnzsupply.com.br</p>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  <strong>Importante:</strong> O boleto vence em 28 dias. Após o pagamento, pode levar até 3 dias úteis para compensação.
                </div>
                
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

        {/* Navigation Buttons */}
        {step < 5 && !paymentCreated && (
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
                onClick={
                  paymentMethod === 'pix' 
                    ? handleCreatePayment 
                    : paymentMethod === 'boleto' 
                      ? handleBoletoPayment 
                      : handleStripeCheckout
                } 
                disabled={isLoading || (paymentMethod === 'boleto' && boletoCpf.replace(/\D/g, '').length !== 11)}
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
                    Gerar QR Code PIX
                  </>
                ) : paymentMethod === 'boleto' ? (
                  <>
                    <FileText className="w-4 h-4" />
                    Gerar Boleto
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pagar com Cartão
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
