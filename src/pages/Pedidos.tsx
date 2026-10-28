import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Package, Clock, CheckCircle, XCircle, Loader2, Building2, PartyPopper, QrCode, CreditCard, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  company_id: string;
  payment_url: string | null;
  payment_method: string | null;
  total_amount: number;
  status: string;
  items: OrderItem[];
  created_at: string;
  companies: {
    nome_fantasia: string;
    cnpj: string;
  } | null;
}

const getPaymentMethodConfig = (method: string | null) => {
  switch (method) {
    case 'pix':
      return { label: 'PIX', icon: QrCode, color: 'bg-success-soft text-success-soft-foreground border-success/30' };
    case 'card':
      return { label: 'Cartão', icon: CreditCard, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    case 'boleto':
      return { label: 'Boleto', icon: FileText, color: 'bg-warning-soft text-warning-soft-foreground border-warning/30' };
    default:
      return { label: 'Não informado', icon: Package, color: 'bg-muted text-muted-foreground border-border' };
  }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCNPJ = (cnpj: string) => {
  return cnpj
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'completed':
    case 'paid':
      return { label: 'Pago', icon: CheckCircle, color: 'bg-success-soft text-success-soft-foreground border-success/30' };
    case 'pending':
      return { label: 'Pendente', icon: Clock, color: 'bg-warning-soft text-warning-soft-foreground border-warning/30' };
    case 'processing':
      return { label: 'Processando', icon: Loader2, color: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'cancelled':
      return { label: 'Cancelado', icon: XCircle, color: 'bg-destructive-soft text-destructive-soft-foreground border-destructive/30' };
    case 'failed':
      return { label: 'Falhou', icon: XCircle, color: 'bg-destructive-soft text-destructive-soft-foreground border-destructive/30' };
    case 'expired':
      return { label: 'Expirado', icon: Clock, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    default:
      return { label: status, icon: Package, color: 'bg-muted text-muted-foreground border-border' };
  }
};

export default function Pedidos() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [companyIds, setCompanyIds] = useState<string[]>([]);

  // Track recently paid orders for animation
  const [recentlyPaidOrders, setRecentlyPaidOrders] = useState<Set<string>>(new Set());

  // Auto-fetch orders for logged-in users
  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      fetchUserOrders();
    }
  }, [user, authLoading]);

  const fetchUserOrders = async () => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      // A user can own more than one company (one per CNPJ used at checkout)
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user!.id);

      if (companyError) throw companyError;

      const ids = (companies || []).map(c => c.id);
      if (ids.length === 0) {
        setOrders([]);
        setCompanyIds([]);
        setIsLoading(false);
        return;
      }

      setCompanyIds(ids);

      // Fetch orders for these companies
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          companies (
            nome_fantasia,
            cnpj
          )
        `)
        .in('company_id', ids)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Parse items JSON properly
      const parsedOrders = (ordersData || []).map(order => ({
        ...order,
        items: (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) as OrderItem[]
      })) as Order[];

      setOrders(parsedOrders);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      toast({
        title: "Erro ao buscar pedidos",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Realtime subscription for order status updates
  useEffect(() => {
    if (companyIds.length === 0) return;

    const channel = supabase
      .channel('orders-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `company_id=in.(${companyIds.join(',')})`
        },
        (payload) => {
          const updatedOrder = payload.new as Order & { updated_at: string };
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === updatedOrder.id 
                ? { 
                    ...order, 
                    status: updatedOrder.status,
                    payment_url: updatedOrder.payment_url,
                    updated_at: updatedOrder.updated_at
                  }
                : order
            )
          );
          
          // Show toast and trigger animation when payment is confirmed
          if (updatedOrder.status === 'paid') {
            // Add to recently paid set for animation
            setRecentlyPaidOrders(prev => new Set(prev).add(updatedOrder.id));
            
            toast({
              title: "🎉 Pagamento confirmado!",
              description: `Pedido #${updatedOrder.id.slice(0, 8).toUpperCase()} foi pago com sucesso.`,
            });
            
            // Remove from animation set after animation completes
            setTimeout(() => {
              setRecentlyPaidOrders(prev => {
                const newSet = new Set(prev);
                newSet.delete(updatedOrder.id);
                return newSet;
              });
            }, 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyIds]);

  // Also subscribe for new orders (INSERT) when user is logged in
  useEffect(() => {
    if (companyIds.length === 0) return;

    const channel = supabase
      .channel('orders-new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `company_id=in.(${companyIds.join(',')})`
        },
        async (payload) => {
          const newOrder = payload.new as Pick<Order, 'id'>;
          
          // Fetch the complete order with company data
          const { data: orderData, error } = await supabase
            .from('orders')
            .select(`
              *,
              companies (
                nome_fantasia,
                cnpj
              )
            `)
            .eq('id', newOrder.id)
            .maybeSingle();

          if (!error && orderData) {
            const parsedOrder = {
              ...orderData,
              items: (typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items) as OrderItem[]
            } as Order;

            setOrders(prevOrders => [parsedOrder, ...prevOrders]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyIds]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background pt-8 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/pedidos" }} />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-8 pb-16">
        <div className="container-custom">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Meus Pedidos
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Acompanhe todos os seus pedidos realizados.
            </p>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Results */}
          {hasSearched && !isLoading && (
            <div className="max-w-4xl mx-auto">
              {orders.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                      Nenhum pedido encontrado
                    </h3>
                    <p className="text-muted-foreground">
                      Você ainda não realizou nenhum pedido.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Company Info */}
                  {orders[0]?.companies && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-semibold text-foreground">{orders[0].companies.nome_fantasia}</p>
                            <p className="text-sm text-muted-foreground">CNPJ: {formatCNPJ(orders[0].companies.cnpj)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Orders List */}
                  {orders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const StatusIcon = statusConfig.icon;
                    const paymentMethodConfig = getPaymentMethodConfig(order.payment_method);
                    const PaymentIcon = paymentMethodConfig.icon;
                    const items = order.items as OrderItem[];

                    const isRecentlyPaid = recentlyPaidOrders.has(order.id);

                    return (
                      <Card 
                        key={order.id} 
                        className={cn(
                          "overflow-hidden transition-all duration-500 relative",
                          isRecentlyPaid && "ring-2 ring-success ring-offset-2 animate-scale-in"
                        )}
                      >
                        {/* Payment Confirmed Overlay */}
                        {isRecentlyPaid && (
                          <div className="absolute inset-0 bg-success/10 pointer-events-none animate-fade-in z-10 flex items-center justify-center">
                            <div className="bg-success text-success-foreground px-4 py-2 rounded-full flex items-center gap-2 animate-scale-in shadow-lg">
                              <PartyPopper className="w-5 h-5" />
                              <span className="font-semibold">Pagamento Confirmado!</span>
                            </div>
                          </div>
                        )}
                        
                        <CardHeader className={cn(
                          "bg-muted/50 py-4 transition-colors duration-500",
                          isRecentlyPaid && "bg-success-soft"
                        )}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Package className={cn(
                                "w-5 h-5 text-primary transition-colors duration-500",
                                isRecentlyPaid && "text-success"
                              )} />
                              <div>
                                <p className="font-mono text-sm text-muted-foreground">
                                  Pedido #{order.id.slice(0, 8).toUpperCase()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(order.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={cn(
                                "gap-1 transition-all duration-500",
                                isRecentlyPaid 
                                  ? "bg-success text-success-foreground border-success scale-110" 
                                  : statusConfig.color
                              )}>
                                <StatusIcon className={cn("w-3 h-3", isRecentlyPaid && "animate-pulse")} />
                                {statusConfig.label}
                              </Badge>
                              <Badge className={cn("gap-1", paymentMethodConfig.color)}>
                                <PaymentIcon className="w-3 h-3" />
                                {paymentMethodConfig.label}
                              </Badge>
                              <span className="font-display font-bold text-primary">
                                Consulte-nos
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="space-y-2">
                            {items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {item.productName} x {item.quantity} {item.unit}
                                </span>
                                <span className="font-medium text-primary">
                                  Consulte-nos
                                </span>
                            </div>
                            ))}
                          </div>

                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
