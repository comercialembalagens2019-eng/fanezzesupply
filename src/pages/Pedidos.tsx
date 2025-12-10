import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Search, Package, Clock, CheckCircle, XCircle, ExternalLink, Loader2, Building2, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

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
  total_amount: number;
  status: string;
  items: OrderItem[];
  created_at: string;
  companies: {
    nome_fantasia: string;
    cnpj: string;
  } | null;
}

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
      return { label: 'Pago', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' };
    case 'pending':
      return { label: 'Pendente', icon: Clock, color: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'cancelled':
    case 'failed':
      return { label: 'Cancelado', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200' };
    default:
      return { label: status, icon: Package, color: 'bg-muted text-muted-foreground border-border' };
  }
};

export default function Pedidos() {
  const [cnpj, setCnpj] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const formatCNPJInput = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  // Track recently paid orders for animation
  const [recentlyPaidOrders, setRecentlyPaidOrders] = useState<Set<string>>(new Set());

  // Realtime subscription for order status updates
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel('orders-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          const updatedOrder = payload.new as any;
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
  }, [companyId]);

  const searchOrders = async () => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    if (cleanCnpj.length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "Digite um CNPJ válido com 14 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      // First find the company by CNPJ
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('cnpj', cleanCnpj)
        .maybeSingle();

      if (companyError) throw companyError;

      if (!company) {
        setOrders([]);
        setCompanyId(null);
        return;
      }

      setCompanyId(company.id);

      // Then fetch orders for this company
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          companies (
            nome_fantasia,
            cnpj
          )
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Parse items JSON properly
      const parsedOrders = (ordersData || []).map(order => ({
        ...order,
        items: (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) as OrderItem[]
      })) as Order[];

      setOrders(parsedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Erro ao buscar pedidos",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchOrders();
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="container-custom">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Histórico de Pedidos
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Consulte seus pedidos anteriores informando o CNPJ da sua empresa.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-12">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Digite o CNPJ da empresa"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJInput(e.target.value))}
                  onKeyPress={handleKeyPress}
                  className="h-12"
                />
              </div>
              <Button 
                onClick={searchOrders} 
                disabled={isLoading}
                className="h-12 px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Results */}
          {hasSearched && (
            <div className="max-w-4xl mx-auto">
              {orders.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                      Nenhum pedido encontrado
                    </h3>
                    <p className="text-muted-foreground">
                      Não encontramos pedidos para este CNPJ. Verifique se o número está correto.
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
                    const items = order.items as OrderItem[];

                    const isRecentlyPaid = recentlyPaidOrders.has(order.id);

                    return (
                      <Card 
                        key={order.id} 
                        className={cn(
                          "overflow-hidden transition-all duration-500 relative",
                          isRecentlyPaid && "ring-2 ring-green-500 ring-offset-2 animate-scale-in"
                        )}
                      >
                        {/* Payment Confirmed Overlay */}
                        {isRecentlyPaid && (
                          <div className="absolute inset-0 bg-green-500/10 pointer-events-none animate-fade-in z-10 flex items-center justify-center">
                            <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-scale-in shadow-lg">
                              <PartyPopper className="w-5 h-5" />
                              <span className="font-semibold">Pagamento Confirmado!</span>
                            </div>
                          </div>
                        )}
                        
                        <CardHeader className={cn(
                          "bg-muted/50 py-4 transition-colors duration-500",
                          isRecentlyPaid && "bg-green-100"
                        )}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Package className={cn(
                                "w-5 h-5 text-primary transition-colors duration-500",
                                isRecentlyPaid && "text-green-600"
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
                            <div className="flex items-center gap-3">
                              <Badge className={cn(
                                "gap-1 transition-all duration-500",
                                isRecentlyPaid 
                                  ? "bg-green-500 text-white border-green-500 scale-110" 
                                  : statusConfig.color
                              )}>
                                <StatusIcon className={cn("w-3 h-3", isRecentlyPaid && "animate-pulse")} />
                                {statusConfig.label}
                              </Badge>
                              <span className="font-display font-bold text-primary">
                                {formatPrice(Number(order.total_amount))}
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
                                <span className="font-medium">
                                  {formatPrice(item.totalPrice)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {order.payment_url && order.status === 'pending' && (
                            <div className="mt-4 pt-4 border-t">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="gap-2"
                                onClick={() => window.open(order.payment_url!, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                                Acessar Pagamento
                              </Button>
                            </div>
                          )}
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