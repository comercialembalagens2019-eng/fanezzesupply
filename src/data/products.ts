import { Product, SizePricing } from "@/types";
import envelopeImg from "@/assets/envelope.webp";
import envelopeCinzaImg from "@/assets/envelope-cinza.webp";
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
    image: envelopeImg,
    imageFit: "cover",
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
    image: envelopeImg,
    imageFit: "cover",
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
    image: envelopeCinzaImg,
    imageFit: "cover",
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
    image: envelopeImg,
    imageFit: "cover",
    category: "Envelopes",
    featured: true,
    quoteOnly: true,
  },
  {
    id: "produto-teste",
    name: "Produto teste (admin)",
    description:
      "Produto para testar pagamentos. Visível apenas para administradores. 100 unidades = R$ 1,00, o mínimo por cobrança no AbacatePay.",
    price: unitPrice("produto-teste"),
    unit: "unidade",
    minOrder: 100,
    minOrderUnit: "unidades",
    image: "/placeholder.svg",
    category: "Teste",
    adminOnly: true,
  },
];

export const categories = ["Todos", "Envelopes"];
