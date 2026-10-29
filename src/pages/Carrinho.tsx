import { useState } from "react";
import { productImageClass } from "@/lib/productImage";
import { Link } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { getUnitPrice, SHIPPING_FEE } from "@/lib/pricing";
import { SEO } from "@/components/SEO";
const Carrinho = () => {
  const { items, removeFromCart, updateQuantity, getTotal, clearCart, isMinOrderMet, allMinOrdersMet } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <Layout>
        <section className="pt-6 pb-16">
          <div className="container-custom">
            <div className="max-w-lg mx-auto text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-3">
                Seu carrinho está vazio
              </h1>
              <p className="text-muted-foreground mb-8">
                Adicione produtos ao seu carrinho para continuar suas compras.
              </p>
              <Link to="/produtos">
                <Button size="lg" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Ver Produtos
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Carrinho — FNZ Supply"
        description="Revise os itens do seu carrinho e finalize seu pedido de embalagens na FNZ Supply."
        path="/carrinho"
      />
      <section className="pt-6 pb-16">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Carrinho de Compras
            </h1>
            <Button variant="ghost" onClick={clearCart} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              Limpar carrinho
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const minMet = isMinOrderMet(item.product.id);
                return (
                  <div
                    key={item.product.id}
                    className={cn(
                      "bg-card rounded-3xl border p-4 md:p-6 transition-all",
                      minMet ? "border-border" : "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Image */}
                      <div className="relative w-24 h-24 rounded-2xl bg-card ring-1 ring-black/5 overflow-hidden flex-shrink-0">
                        <img
                          src={item.product.image}
                          loading="lazy"
                          alt=""
                          className={productImageClass(item.product)}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-display font-semibold text-foreground">
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground font-medium mt-1">
                              {formatPrice(getUnitPrice(item.product.id, item.quantity, item.product.price))} / {item.product.unit}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            aria-label={`Remover ${item.product.name}`}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                          {/* Quantity */}
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              aria-label={`Diminuir quantidade de ${item.product.name}`}
                              disabled={item.quantity <= 1}
                              className="h-9 w-9"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <input
                              type="number"
                              aria-label={`Quantidade de ${item.product.name}`}
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(
                                  item.product.id,
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              className="w-20 h-9 text-center border border-border rounded-lg bg-background text-foreground font-semibold"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              aria-label={`Aumentar quantidade de ${item.product.name}`}
                              className="h-9 w-9"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Subtotal */}
                          <p className="font-display font-bold text-lg text-primary">
                            {formatPrice(getUnitPrice(item.product.id, item.quantity, item.product.price) * item.quantity)}
                          </p>
                        </div>

                        {/* Min Order Warning */}
                        {!minMet && (
                          <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>
                              Pedido mínimo: {item.product.minOrder} {item.product.minOrderUnit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="tile p-6 sticky top-20">
                <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                  Resumo do Pedido
                </h2>

                <div className="space-y-3 pb-4 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground font-medium tabular-nums">
                      {formatPrice(getTotal())}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground shrink-0 mr-4">Frete</span>
                    <span className="text-muted-foreground text-right">Grátis em Joinville · {formatPrice(SHIPPING_FEE)} demais cidades (calculado no checkout)</span>
                  </div>
                </div>

                <div className="flex justify-between py-4">
                  <span className="font-semibold text-foreground">Total <span className="text-xs font-normal text-muted-foreground">(sem frete)</span></span>
                  <span className="font-display font-extrabold text-xl text-foreground tabular-nums">
                    {formatPrice(getTotal())}
                  </span>
                </div>

                {!allMinOrdersMet() && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Alguns produtos não atingem o pedido mínimo
                    </p>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full gap-2"
                  disabled={!allMinOrdersMet()}
                  onClick={() => setCheckoutOpen(true)}
                >
                  Finalizar Pedido
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <CheckoutModal open={checkoutOpen} onOpenChange={setCheckoutOpen} />

                <Link to="/produtos">
                  <Button variant="ghost" className="w-full mt-3 gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Continuar Comprando
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Carrinho;
