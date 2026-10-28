import { Product, SizePricing } from "@/types";
import sacoPlasticoImg from "@/assets/saco_plastico.webp";
import stretchImg from "@/assets/stretch.webp";
// Single source of truth for prices: the same catalog the edge functions charge from.
import {
  PRODUCT_UNIT_PRICE_CENTS,
  SIZE_TIER_PRICES,
} from "../../supabase/functions/_shared/catalog.ts";

const unitPrice = (id: string) => PRODUCT_UNIT_PRICE_CENTS[id] / 100;

const sizePricing = (id: string): SizePricing[] =>
  Object.entries(SIZE_TIER_PRICES[id]).map(([size, tiers]) => ({
    size,
    tiers: tiers.map((t) => ({ minQty: t.minQty, price: t.priceCents / 100 })),
  }));

// Lowest-quantity tier of the first size, shown as the "a partir de" price.
const startingPrice = (id: string) => sizePricing(id)[0].tiers[0].price;

export const products: Product[] = [
  {
    id: "envelope",
    name: "Envelope",
    description:
      "Envelopes de segurança para e-commerce e logística. Disponíveis nas cores preto ou branco.",
    price: unitPrice("envelope"),
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
    price: startingPrice("envelope-coex"),
    unit: "unidade",
    minOrder: 500,
    minOrderUnit: "unidades",
    image: sacoPlasticoImg,
    category: "Envelopes",
    featured: true,
    sizes: ["19x25", "32x20", "30x40", "40x60", "50x70"],
    sizePricing: sizePricing("envelope-coex"),
  },
  {
    id: "envelope-cinza",
    name: "Envelope Cinza",
    description:
      "Envelope cinza para envio e-commerce: resistente, impermeável e com privacidade no envio. Preço por unidade conforme o tamanho e a quantidade.",
    price: startingPrice("envelope-cinza"),
    unit: "unidade",
    minOrder: 500,
    minOrderUnit: "unidades",
    image: sacoPlasticoImg,
    category: "Envelopes",
    featured: true,
    sizes: ["20x30", "26x36", "32x40", "40x50", "50x70", "70x60", "40x00", "50x90"],
    sizePricing: sizePricing("envelope-cinza"),
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
    price: unitPrice("stretch-4kg"),
    unit: "kg",
    minOrder: 500,
    minOrderUnit: "kg",
    image: stretchImg,
    category: "Plásticos",
    featured: true,
  },
];

export const categories = ["Todos", "Envelopes", "Plásticos"];
