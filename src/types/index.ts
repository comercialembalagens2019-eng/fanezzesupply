export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  minOrder: number;
  minOrderUnit: string;
  image: string;
  category: string;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
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
