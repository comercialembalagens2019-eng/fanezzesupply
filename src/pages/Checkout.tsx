import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Check, CreditCard, FileText, QrCode, Truck, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const paymentMethods = [
  { id: "boleto", label: "Boleto Bancário", icon: FileText, description: "28 dias para pagar" },
  { id: "pix", label: "PIX", icon: QrCode, description: "Pagamento instantâneo" },
  { id: "credito", label: "Crédito (Aprovados)", icon: CreditCard, description: "Para clientes com crédito aprovado" },
];

const Checkout = () => {
  const { items, getTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("boleto");
  const [observations, setObservations] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Pedido realizado com sucesso!",
      description: "Você receberá um e-mail com os detalhes do pedido.",
    });

    clearCart();
    navigate("/");
    setIsLoading(false);
  };

  if (items.length === 0) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom">
            <div className="max-w-lg mx-auto text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-3">
                Carrinho vazio
              </h1>
              <p className="text-muted-foreground mb-8">
                Adicione produtos ao carrinho para finalizar seu pedido.
              </p>
              <Link to="/produtos">
                <Button size="lg">Ver Produtos</Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding bg-background">
        <div className="container-custom">
          <Link to="/carrinho" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao carrinho
          </Link>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">
            Finalizar Pedido
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Order Summary */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                    Resumo do Pedido
                  </h2>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                        <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                          <img
                            src={item.product.image}
                            loading="lazy"
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} {item.product.minOrderUnit}
                          </p>
                        </div>
                        <p className="font-semibold text-primary">
                          Consulte-nos
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Truck className="w-5 h-5 text-primary" />
                    <h2 className="font-display font-semibold text-lg text-foreground">
                      Entrega
                    </h2>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-foreground font-medium">Envio</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enviamos o seu pedido para todo o Brasil.
                    </p>
                    <p className="text-sm text-primary mt-2">
                      Frete grátis para Joinville • R$ 19,90 para demais localidades.
                    </p>
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                    Forma de Pagamento
                  </h2>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                          paymentMethod === method.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="sr-only"
                        />
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          paymentMethod === method.id
                            ? "border-primary"
                            : "border-muted-foreground"
                        )}>
                          {paymentMethod === method.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          )}
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <method.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{method.label}</p>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Observations */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                    Observações
                  </h2>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Instruções especiais de entrega, horários, etc."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
              </div>

              {/* Order Total */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl border border-border p-6 lg:sticky top-[calc(var(--header-height)+1rem)]">
                  <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                    Total do Pedido
                  </h2>

                  <div className="space-y-3 pb-4 border-b border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({items.length} itens)</span>
                      <span className="text-foreground">Consulte-nos</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Frete</span>
                      <span className="text-muted-foreground">Grátis para Joinville • R$ 19,90 demais localidades</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-4">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-display font-bold text-xl text-primary">
                      Consulte-nos
                    </span>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? "Processando..." : "Confirmar Pedido"}
                    <Check className="w-4 h-4" />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Ao confirmar, você concorda com nossos termos de venda.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
