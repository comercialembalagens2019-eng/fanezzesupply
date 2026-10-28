import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Package, 
  Search, 
  Loader2, 
  Users, 
  ShoppingCart,
  Calendar,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  QrCode,
  CreditCard,
  FileText,
  Truck,
  PackageCheck,
  Undo2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { OrderProgress } from "@/components/orders/OrderProgress";

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
  payment_url: string | null;
  payment_method: string | null;
  total_amount: number;
  shipping_amount?: number;
  shipped_at?: string | null;
  delivered_at?: string | null;
  status: string;
  items: OrderItem[];
  created_at: string;
}

interface Company {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email: string;
  whatsapp: string;
  cidade: string;
  estado: string;
  created_at: string;
  orders: Order[];
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
      return { label: 'Pago', color: 'bg-success-soft text-success-soft-foreground' };
    case 'pending':
      return { label: 'Pendente', color: 'bg-warning-soft text-warning-soft-foreground' };
    case 'shipped':
      return { label: 'Enviado', color: 'bg-info-soft text-info-soft-foreground' };
    case 'delivered':
      return { label: 'Entregue', color: 'bg-success-soft text-success-soft-foreground' };
    case 'cancelled':
    case 'failed':
      return { label: 'Cancelado', color: 'bg-destructive-soft text-destructive-soft-foreground' };
    default:
      return { label: status, color: 'bg-muted text-muted-foreground' };
  }
};

const getPaymentMethodConfig = (method: string | null) => {
  switch (method) {
    case 'pix':
      return { label: 'PIX', icon: QrCode, color: 'bg-success-soft text-success-soft-foreground' };
    case 'card':
      return { label: 'Cartão', icon: CreditCard, color: 'bg-indigo-100 text-indigo-800' };
    case 'boleto':
      return { label: 'Boleto', icon: FileText, color: 'bg-warning-soft text-warning-soft-foreground' };
    default:
      return { label: 'N/A', icon: Package, color: 'bg-muted text-muted-foreground' };
  }
};

// Next fulfillment step for a paid order. Customer e-mails (Resend) will hook in here later.
const FULFILLMENT_NEXT: Record<string, { status: string; label: string; icon: typeof Truck } | undefined> = {
  paid: { status: "shipped", label: "Marcar como enviado", icon: Truck },
  shipped: { status: "delivered", label: "Marcar como entregue", icon: PackageCheck },
};
const FULFILLMENT_PREV: Record<string, string | undefined> = { shipped: "paid", delivered: "shipped" };

function FulfillmentActions({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [saving, setSaving] = useState(false);
  const next = FULFILLMENT_NEXT[order.status];
  const prev = FULFILLMENT_PREV[order.status];
  if (!next && !prev) return null;

  const setStatus = async (status: string) => {
    setSaving(true);
    const { error } = await supabase.rpc("admin_set_fulfillment_status", { p_order_id: order.id, p_status: status });
    setSaving(false);
    if (error) {
      toast({ title: "Não foi possível atualizar o pedido", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pedido atualizado", description: `Status: ${getStatusConfig(status).label}` });
    onChanged();
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      <OrderProgress status={order.status} shippedAt={order.shipped_at} deliveredAt={order.delivered_at} />
      <div className="flex flex-wrap gap-2 justify-end">
        {prev && (
          <Button variant="ghost" size="sm" disabled={saving} onClick={() => setStatus(prev)}>
            <Undo2 className="w-4 h-4 mr-1" aria-hidden="true" /> Desfazer
          </Button>
        )}
        {next && (
          <Button size="sm" disabled={saving} onClick={() => setStatus(next.status)} className="rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <next.icon className="w-4 h-4 mr-1" aria-hidden="true" />}
            {next.label}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AdminClientes() {
  const { isAdmin, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (!authLoading && user && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, authLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchCompanies();
    }
  }, [isAdmin]);

  // Realtime subscription for order updates (admin panel)
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-orders-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Admin: Order update received:', payload);
          // Refresh companies data when any order changes
          fetchCompanies();
        }
      )
      .subscribe((status) => {
        console.log('Admin realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      // Fetch orders for all companies (increased limit)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (ordersError) throw ordersError;

      // Map orders to companies
      const companiesWithOrders = (companiesData || []).map(company => ({
        ...company,
        orders: (ordersData || [])
          .filter(order => order.company_id === company.id)
          .map(order => ({
            ...order,
            items: (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) as OrderItem[]
          }))
      }));

      setCompanies(companiesWithOrders);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company => 
    company.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj.includes(searchTerm.replace(/\D/g, '')) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOrders = companies.reduce((acc, c) => acc + c.orders.length, 0);
  // Only paid orders count as revenue; pending/failed/cancelled ones were never received.
  const totalRevenue = companies.reduce((acc, c) =>
    acc + c.orders
      .filter(order => order.status === 'paid')
      .reduce((orderAcc, order) => orderAcc + Number(order.total_amount), 0), 0
  );

  if (authLoading || (!isAdmin && user)) {
    return (
      <Layout>
        <div className="min-h-screen bg-background pt-8 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-8 pb-16">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Painel de Clientes
            </h1>
            <p className="text-muted-foreground">
              Gerencie os clientes cadastrados e seus pedidos
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{companies.length}</p>
                  <p className="text-sm text-muted-foreground">Clientes cadastrados</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{totalOrders}</p>
                  <p className="text-sm text-muted-foreground">Pedidos realizados</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-primary">Consulte-nos</p>
                  <p className="text-sm text-muted-foreground">Valor total em pedidos</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Companies List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredCompanies.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  Nenhum cliente encontrado
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum resultado para sua busca." : "Ainda não há clientes cadastrados."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCompanies.map((company) => (
                <Card key={company.id} className="overflow-hidden">
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedCompany(expandedCompany === company.id ? null : company.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{company.nome_fantasia}</CardTitle>
                          <p className="text-sm text-muted-foreground">{formatCNPJ(company.cnpj)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="font-semibold text-foreground">{company.orders.length} pedido(s)</p>
                          <p className="text-sm text-muted-foreground">
                            Desde {formatDate(company.created_at)}
                          </p>
                        </div>
                        {expandedCompany === company.id ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {expandedCompany === company.id && (
                    <CardContent className="border-t">
                      {/* Company Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 mb-4 border-b">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{company.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{company.whatsapp}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{company.cidade} - {company.estado}</span>
                        </div>
                      </div>

                      {/* Orders */}
                      <div>
                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Pedidos
                        </h4>
                        
                        {company.orders.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4">Nenhum pedido realizado.</p>
                        ) : (
                          <div className="space-y-3">
                            {company.orders.map((order) => {
                              const statusConfig = getStatusConfig(order.status);
                              const paymentConfig = getPaymentMethodConfig(order.payment_method);
                              const PaymentIcon = paymentConfig.icon;
                              return (
                                <div key={order.id} className="p-3 rounded-lg bg-muted/50 border">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Calendar className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm">{formatDate(order.created_at)}</span>
                                      <Badge className={cn("text-xs", statusConfig.color)}>
                                        {statusConfig.label}
                                      </Badge>
                                      <Badge className={cn("text-xs gap-1", paymentConfig.color)}>
                                        <PaymentIcon className="w-3 h-3" />
                                        {paymentConfig.label}
                                      </Badge>
                                    </div>
                                    <span className="font-display font-extrabold text-foreground tabular-nums">
                                      {formatPrice(Number(order.total_amount))}
                                      {Number(order.shipping_amount) > 0 && (
                                        <span className="block text-xs font-normal text-muted-foreground text-right">
                                          inclui frete {formatPrice(Number(order.shipping_amount))}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {order.items.map((item, idx) => (
                                      <span key={idx}>
                                        {item.productName} x {item.quantity}
                                        {idx < order.items.length - 1 ? ', ' : ''}
                                      </span>
                                    ))}
                                  </div>
                                  <FulfillmentActions order={order} onChanged={fetchCompanies} />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}