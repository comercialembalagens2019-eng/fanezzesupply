import { Product } from "@/types";

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Saco Plástico PP',
    description: 'Saco plástico de polipropileno de alta qualidade, ideal para embalagens diversas.',
    price: 32.90,
    unit: 'kg',
    minOrder: 30,
    minOrderUnit: 'kg',
    category: 'Plásticos',
    image: 'https://picsum.photos/400/400?random=1',
    inStock: true,
    featured: true
  },
  {
    id: '2',
    name: 'Saco Plástico PE',
    description: 'Saco plástico de polietileno, resistente e versátil para múltiplas aplicações.',
    price: 32.90,
    unit: 'kg',
    minOrder: 30,
    minOrderUnit: 'kg',
    category: 'Plásticos',
    image: 'https://picsum.photos/400/400?random=2',
    inStock: true,
    featured: true
  },
  {
    id: '3',
    name: 'Plástico Bolha 21mm',
    description: 'Plástico bolha com bolhas de 21mm, proteção eficiente para produtos frágeis.',
    price: 77.00,
    unit: 'un',
    minOrder: 20,
    minOrderUnit: 'unidades',
    category: 'Proteção',
    image: 'https://picsum.photos/400/400?random=3',
    inStock: true,
    featured: true
  },
  {
    id: '4',
    name: 'Plástico Bolha 30mm',
    description: 'Plástico bolha com bolhas de 30mm, maior proteção para itens delicados.',
    price: 99.90,
    unit: 'un',
    minOrder: 10,
    minOrderUnit: 'unidades',
    category: 'Proteção',
    image: 'https://picsum.photos/400/400?random=4',
    inStock: false
  },
  {
    id: '5',
    name: 'Desinfetante 5L',
    description: 'Desinfetante concentrado de 5 litros, alta performance de limpeza.',
    price: 10.50,
    unit: 'un',
    minOrder: 5,
    minOrderUnit: 'unidades',
    category: 'Limpeza',
    image: 'https://picsum.photos/400/400?random=5',
    inStock: true
  },
  {
    id: '6',
    name: 'Bobina Semi Kraft 1,20x200m',
    description: 'Bobina de papel semi kraft, dimensões 1,20m x 200m, ideal para embalagens.',
    price: 289.00,
    unit: 'un',
    minOrder: 1,
    minOrderUnit: 'unidade',
    category: 'Papel',
    image: 'https://picsum.photos/400/400?random=6',
    inStock: true,
    featured: true
  },
  {
    id: '7',
    name: 'Caixa Fita Adesiva Transparente 45x100',
    description: 'Caixa com 72 unidades de fita adesiva transparente 45mm x 100m.',
    price: 389.90,
    unit: 'cx',
    minOrder: 5,
    minOrderUnit: 'caixas',
    category: 'Adesivos',
    image: 'https://picsum.photos/400/400?random=7',
    inStock: true
  },
  {
    id: '8',
    name: 'Ondulado 270g com 50m',
    description: 'Papelão ondulado 270g com 50 metros, proteção e amortecimento.',
    price: 139.90,
    unit: 'un',
    minOrder: 5,
    minOrderUnit: 'unidades',
    category: 'Papel',
    image: 'https://picsum.photos/400/400?random=8',
    inStock: true
  },
  {
    id: '9',
    name: 'Ondulado por kg',
    description: 'Papelão ondulado vendido por quilo, ideal para grandes quantidades.',
    price: 7.99,
    unit: 'kg',
    minOrder: 1000,
    minOrderUnit: 'kg',
    category: 'Papel',
    image: 'https://picsum.photos/400/400?random=9',
    inStock: true
  },
  {
    id: '10',
    name: 'Saco de Lixo 30L',
    description: 'Fardo com 50 sacos de lixo de 30 litros, resistente e econômico.',
    price: 30.90,
    unit: 'fardo',
    minOrder: 3,
    minOrderUnit: 'fardos',
    category: 'Limpeza',
    image: 'https://picsum.photos/400/400?random=10',
    inStock: true
  },
  {
    id: '11',
    name: 'Saco de Lixo 50L',
    description: 'Fardo com 50 sacos de lixo de 50 litros, resistente e econômico.',
    price: 48.90,
    unit: 'fardo',
    minOrder: 3,
    minOrderUnit: 'fardos',
    category: 'Limpeza',
    image: 'https://picsum.photos/400/400?random=11',
    inStock: true
  },
  {
    id: '12',
    name: 'Saco de Lixo 100L',
    description: 'Fardo com 50 sacos de lixo de 100 litros, resistente e econômico.',
    price: 68.90,
    unit: 'fardo',
    minOrder: 3,
    minOrderUnit: 'fardos',
    category: 'Limpeza',
    image: 'https://picsum.photos/400/400?random=12',
    inStock: true
  },
  {
    id: '13',
    name: 'Saco de Lixo 150L',
    description: 'Fardo com 50 sacos de lixo de 150 litros, resistente e econômico.',
    price: 83.90,
    unit: 'fardo',
    minOrder: 3,
    minOrderUnit: 'fardos',
    category: 'Limpeza',
    image: 'https://picsum.photos/400/400?random=13',
    inStock: true
  },
  {
    id: '14',
    name: 'Saco de Lixo 200L',
    description: 'Fardo com 50 sacos de lixo de 200 litros, resistente e econômico.',
    price: 130.90,
    unit: 'fardo',
    minOrder: 3,
    minOrderUnit: 'fardos',
    category: 'Limpeza',
    image: 'https://picsum.photos/400/400?random=14',
    inStock: true
  },
  {
    id: '15',
    name: 'Stretch em Bobina 50cm (3,5kg)',
    description: 'Filme stretch em bobina de 50cm com 3,5kg, ideal para paletização.',
    price: 49.90,
    unit: 'un',
    minOrder: 20,
    minOrderUnit: 'unidades',
    category: 'Filmes',
    image: 'https://picsum.photos/400/400?random=15',
    inStock: true,
    featured: true
  }
];

export const products = PRODUCTS;

export const categories = [
  "Todos",
  "Plásticos",
  "Proteção",
  "Limpeza",
  "Papel",
  "Adesivos",
  "Filmes"
];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
