import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computeOrderTotalCents } from "../_shared/catalog.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Customer {
  name: string;
  cellphone: string;
  email: string;
  taxId: string; // CPF ou CNPJ
}

interface CreatePaymentRequest {
  amount: number; // em centavos (ignorado: recalculado no servidor)
  items: Array<{ productId: string; quantity: number }>;
  description: string;
  customer: Customer;
  externalId?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

// Validate CPF check digits
function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[10])) return false;
  
  return true;
}

// Validate CNPJ check digits
function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  
  // Check for known invalid CNPJs
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  
  // Validate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleaned[12])) return false;
  
  // Validate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleaned[13])) return false;
  
  return true;
}

// Validate tax ID (CPF or CNPJ)
function isValidTaxId(taxId: string): boolean {
  const cleaned = taxId.replace(/\D/g, '');
  if (cleaned.length === 11) return isValidCPF(cleaned);
  if (cleaned.length === 14) return isValidCNPJ(cleaned);
  return false;
}

// Validate Brazilian phone number
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate the request data
function validateRequest(data: CreatePaymentRequest): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Amount validation
  if (!data.amount || typeof data.amount !== 'number') {
    errors.push({ field: 'amount', message: 'Valor é obrigatório' });
  } else if (data.amount < 100) {
    errors.push({ field: 'amount', message: 'Valor mínimo é R$ 1,00 (100 centavos)' });
  } else if (data.amount > 100000000) { // Max R$ 1,000,000
    errors.push({ field: 'amount', message: 'Valor máximo excedido' });
  }
  
  // Description validation
  if (!data.description || data.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Descrição é obrigatória' });
  } else if (data.description.length > 500) {
    errors.push({ field: 'description', message: 'Descrição muito longa' });
  }
  
  // Customer validation
  if (!data.customer) {
    errors.push({ field: 'customer', message: 'Dados do cliente são obrigatórios' });
    return errors;
  }
  
  // Name validation
  if (!data.customer.name || data.customer.name.trim().length < 2) {
    errors.push({ field: 'customer.name', message: 'Nome é obrigatório (mínimo 2 caracteres)' });
  } else if (data.customer.name.length > 100) {
    errors.push({ field: 'customer.name', message: 'Nome muito longo' });
  }
  
  // Email validation
  if (!data.customer.email) {
    errors.push({ field: 'customer.email', message: 'Email é obrigatório' });
  } else if (!isValidEmail(data.customer.email)) {
    errors.push({ field: 'customer.email', message: 'Email inválido' });
  }
  
  // Phone validation
  if (!data.customer.cellphone) {
    errors.push({ field: 'customer.cellphone', message: 'Telefone é obrigatório' });
  } else if (!isValidPhone(data.customer.cellphone)) {
    errors.push({ field: 'customer.cellphone', message: 'Telefone deve ter 10-11 dígitos' });
  }
  
  // Tax ID validation (CPF or CNPJ)
  if (!data.customer.taxId) {
    errors.push({ field: 'customer.taxId', message: 'CPF/CNPJ é obrigatório' });
  } else if (!isValidTaxId(data.customer.taxId)) {
    errors.push({ field: 'customer.taxId', message: 'CPF/CNPJ inválido' });
  }
  
  return errors;
}

// Mask sensitive data for logging
function maskSensitiveData(data: CreatePaymentRequest): object {
  return {
    amount: data.amount,
    description: data.description?.substring(0, 50) + (data.description?.length > 50 ? '...' : ''),
    customer: {
      name: data.customer?.name?.substring(0, 3) + '***',
      email: data.customer?.email ? '***@***' : undefined,
      cellphone: '***',
      taxId: '***',
    },
    externalId: data.externalId,
  };
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: authErr } = await authClient.auth.getUser(token);
    if (authErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const authedUserId = userData.user.id;

    const apiKey = Deno.env.get('ABACATEPAY_API_KEY');
    
    if (!apiKey) {
      console.error('[PIX] API key not configured');
      throw new Error('API key not configured');
    }

    const requestData: CreatePaymentRequest = await req.json();
    
    // Log masked data only
    console.log('[PIX] Processing payment request:', JSON.stringify(maskSensitiveData(requestData)));

    // Validate request data
    const validationErrors = validateRequest(requestData);
    if (validationErrors.length > 0) {
      console.log('[PIX] Validation failed:', validationErrors.map(e => e.field).join(', '));
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify externalId (company_id) belongs to authenticated user, if provided
    if (requestData.externalId) {
      const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { data: company } = await serviceClient
        .from('companies')
        .select('user_id')
        .eq('id', requestData.externalId)
        .maybeSingle();
      if (company && company.user_id !== authedUserId) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Clean and prepare data
    const cleanTaxId = requestData.customer.taxId.replace(/\D/g, '');
    const cleanCellphone = requestData.customer.cellphone.replace(/\D/g, '');

    const pixPayload = {
      amount: requestData.amount,
      expiresIn: 3600,
      description: requestData.description.trim(),
      customer: {
        name: requestData.customer.name.trim(),
        cellphone: cleanCellphone,
        email: requestData.customer.email.trim().toLowerCase(),
        taxId: cleanTaxId,
      },
      metadata: {
        externalId: requestData.externalId || Date.now().toString(),
      },
    };

    console.log('[PIX] Sending request to AbacatePay, amount:', pixPayload.amount);

    const response = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pixPayload),
    });

    const responseText = await response.text();
    console.log('[PIX] AbacatePay response status:', response.status);

    if (!response.ok) {
      console.error('[PIX] AbacatePay error, status:', response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to create PIX QR Code', details: 'Payment provider error' }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = JSON.parse(responseText);
    console.log('[PIX] Payment created successfully, id:', data?.data?.id);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[PIX] Error:', error instanceof Error ? error.message : 'Unknown error');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
