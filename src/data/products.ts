import { Product } from "@/types";
import sacoPlasticoImg from "@/assets/saco_plastico.webp";
import stretchImg from "@/assets/stretch.webp";

export const products: Product[] = [
  {
    id: "envelope",
    name: "Envelope",
    description:
      "Envelopes de segurança para e-commerce e logística. Disponíveis sem logo (preto ou branco) ou personalizados com a marca do cliente.",
    price: 0,
    unit: "unidade",
    minOrder: 2000,
    minOrderUnit: "unidades",
    minOrderLabel: "conforme fornecido",
    image: sacoPlasticoImg,
    category: "Envelopes",
    featured: true,
    productVariants: [
      {
        name: "Envelope sem logo (preto)",
        price: 0.08,
        sizes: ["20x30", "20x36", "32x40", "40x60", "30x70"],
        minOrderText: "Pedido mínimo: 2.000 unidades",
        note: "Disponível também na cor branca.",
      },
      {
        name: "Envelope personalizado (com logo do cliente)",
        note: "Envelope produzido de acordo com a logomarca e personalização do cliente. Prazo de entrega: 30 dias.",
        highlight: "A FNZ é fabricante e distribuidora",
      },
    ],
  },
  {
    id: "stretch-4kg",
    name: "Stretch 4kg",
    description:
      "Filme stretch em bobina de 4kg, ideal para paletização e unitização de cargas.",
    spec: "Tubete 500g",
    price: 0,
    unit: "unidade",
    minOrder: 1,
    minOrderUnit: "unidade",
    minOrderLabel: "conforme fornecido",
    image: stretchImg,
    category: "Plásticos",
    featured: true,
  },
];

export const categories = ["Todos", "Envelopes", "Plásticos"];
