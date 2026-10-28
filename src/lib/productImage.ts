import type { Product } from "@/types";

// Absolutely positioned so percentage sizes resolve against the framed box (aspect-ratio
// containers have no definite height for in-flow children, which clipped the photo).
export const productImageClass = (product: Pick<Product, "imageFit">) =>
  product.imageFit === "cover"
    ? "absolute inset-0 w-full h-full object-cover"
    : "absolute inset-0 m-auto max-h-[75%] max-w-[80%] object-contain";
