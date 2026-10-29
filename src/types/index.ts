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
  /** "cover": the photo is framed for the 4:3 card and fills it edge to edge. */
  imageFit?: "cover";
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
  /** Only shown to (and purchasable by) admins, e.g. the payment test product. */
  adminOnly?: boolean;
}


export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariation?: string; // e.g., "20x30x0,07"
}
