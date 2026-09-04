export interface SizeVariation {
  thickness: string;
  sizes: string[];
}

export interface ProductVariant {
  name: string;
  price?: number;
  sizes?: string[];
  minOrderText?: string;
  note?: string;
  highlight?: string;
}

export interface PriceTier {
  minQty: number;
  price: number;
}

export interface SizePricing {
  size: string;
  tiers: PriceTier[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  spec?: string;
  price: number;
  unit: string;
  minOrder: number;
  minOrderUnit: string;
  minOrderLabel?: string;
  image: string;
  category: string;
  featured?: boolean;
  stripePriceId?: string;
  hasVariations?: boolean;
  variations?: SizeVariation[];
  productVariants?: ProductVariant[];
  colors?: string[];
  sizes?: string[];
  sizePricing?: SizePricing[];
  quoteOnly?: boolean;
}


export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariation?: string; // e.g., "20x30x0,07"
}

export interface CompanyData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  isento: boolean;
  inscricaoMunicipal?: string;
  dataAbertura: Date | null;
  naturezaJuridica: string;
  cnae: string;
}

export interface AddressData {
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface ContactData {
  telefoneFixo?: string;
  whatsapp: string;
  email: string;
}

export interface ResponsibleData {
  nomeCompleto: string;
  cpf: string;
  rg: string;
  cargo: string;
  dataNascimento: Date | null;
}

export interface PasswordData {
  senha: string;
  confirmarSenha: string;
  aceitaTermos: boolean;
}

export interface RegistrationData {
  company: CompanyData;
  address: AddressData;
  contact: ContactData;
  responsible: ResponsibleData;
  password: PasswordData;
}

export interface User {
  id: string;
  email: string;
  companyName: string;
  cnpj: string;
}
