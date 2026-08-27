import { Product } from "@/types";
import sacoPlasticoImg from "@/assets/saco_plastico.webp";
import stretchImg from "@/assets/stretch.webp";

export const products: Product[] = [
  {
    id: "envelope",
    name: "Envelope",
    description:
      "Envelopes de segurança para e-commerce e logística. Disponíveis nas cores preto ou branco.",
    price: 0.08,
    unit: "unidade",
    minOrder: 2000,
    minOrderUnit: "unidades",
    image: sacoPlasticoImg,
    category: "Envelopes",
    featured: true,
    colors: ["Preto", "Branco"],
    sizes: ["20x30", "20x36", "32x40", "40x60", "30x70"],
  },
  {
    id: "envelope-personalizado",
    name: "Envelope personalizado",
    description:
      "Envelope produzido de acordo com a logomarca e personalização do cliente. Prazo de entrega: 30 dias. A FNZ é fabricante e distribuidora.",
    price: 0,
    unit: "unidade",
    minOrder: 2000,
    minOrderUnit: "unidades",
    minOrderLabel: "conforme fornecido",
    image: sacoPlasticoImg,
    category: "Envelopes",
    featured: true,
    quoteOnly: true,
  },
  {
    id: "stretch-4kg",
    name: "Stretch 4kg",
    description:
      "Filme stretch em bobina de 4kg, ideal para paletização e unitização de cargas.",
    spec: "Tubete 500g",
    price: 26.9,
    unit: "kg",
    minOrder: 500,
    minOrderUnit: "kg",
    image: stretchImg,
    category: "Plásticos",
    featured: true,
  },
];

export const categories = ["Todos", "Envelopes", "Plásticos"];
