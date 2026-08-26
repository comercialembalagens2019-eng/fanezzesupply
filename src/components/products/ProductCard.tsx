import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(price);

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card hover:border-primary/20 transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative aspect-square bg-secondary overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Min Order Badge */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          Mínimo: {product.minOrderLabel ?? `${product.minOrder} ${product.minOrderUnit}`}
        </div>
        {product.spec && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
            {product.spec}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {product.category}
          </span>
          <h3 className="font-display font-semibold text-foreground mt-1 mb-2">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {product.description}
          </p>
        </div>

        {/* Variants */}
        {product.productVariants && (
          <div className="space-y-3 mb-4">
            {product.productVariants.map((variant) => (
              <div
                key={variant.name}
                className="rounded-lg border border-border bg-secondary/30 p-4"
              >
                <p className="font-semibold text-sm text-foreground">{variant.name}</p>
                {variant.price !== undefined && (
                  <p className="font-display text-lg font-bold text-primary mt-1">
                    {formatPrice(variant.price)}
                  </p>
                )}
                {variant.sizes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tamanhos: {variant.sizes.join(" • ")}
                  </p>
                )}
                {variant.minOrderText && (
                  <p className="text-xs text-muted-foreground mt-1">{variant.minOrderText}</p>
                )}
                {variant.note && (
                  <p className="text-xs text-muted-foreground mt-1">{variant.note}</p>
                )}
                {variant.highlight && (
                  <p className="text-xs font-semibold text-primary mt-2">{variant.highlight}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-auto">
          <div className="rounded-lg border border-border bg-secondary/40 p-4 text-center">
            <p className="font-display text-lg font-bold text-primary mb-1">Consulte-nos</p>
            <a
              href="tel:+5547991490027"
              className="block font-semibold text-primary hover:underline"
            >
              (47) 99149-0027
            </a>
            <a
              href="mailto:vendas@fnzsupply.com.br"
              className="block text-sm text-primary hover:underline mt-1"
            >
              vendas@fnzsupply.com.br
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
