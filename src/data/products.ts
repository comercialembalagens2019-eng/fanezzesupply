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
    id: "envelope-coex",
    name: "Envelope COEX",
    description:
      "Envelope de segurança COEX: branco por fora e cinza por dentro. Resistente, impermeável e ideal para e-commerce. Preço por unidade conforme o tamanho e a quantidade.",
    price: 0.27,
    unit: "unidade",
    minOrder: 500,
    minOrderUnit: "unidades",
    image: sacoPlasticoImg,
    category: "Envelopes",
    featured: true,
    sizes: ["19x25", "32x20", "30x40", "40x60", "50x70"],
    sizePricing: [
      { size: "19x25", tiers: [{ minQty: 500, price: 0.27 }, { minQty: 1000, price: 0.24 }] },
      { size: "32x20", tiers: [{ minQty: 500, price: 0.36 }, { minQty: 1000, price: 0.31 }] },
      { size: "30x40", tiers: [{ minQty: 500, price: 0.66 }, { minQty: 1000, price: 0.56 }] },
      { size: "40x60", tiers: [{ minQty: 500, price: 1.36 }, { minQty: 1000, price: 1.17 }] },
      { size: "50x70", tiers: [{ minQty: 500, price: 1.71 }, { minQty: 1000, price: 1.46 }] },
    ],
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
