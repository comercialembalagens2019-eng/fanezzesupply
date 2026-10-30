import { useState, useEffect, useMemo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ListSkeleton } from "@/components/skeletons";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Package, Clock, CheckCircle, XCircle, Building2, PartyPopper, QrCode, CreditCard, FileText, Truck,
  PackageCheck, PackageOpen, ChevronDown, Search, RotateCcw, ShoppingBag, ExternalLink, AlertTriangle,
} from "lucide-react";
import { OrderProgress } from "@/components/orders/OrderProgress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { getUnitPrice, resolveBaseProduct } from "@/lib/pricing";

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
  shipping_amount?: number;
  shipped_at?: string | null;
  delivered_at?: string | null;
  status: string;
  items: OrderItem[];
  created_at: string;
  companies: {
    nome_fantasia: string;
    cnpj: string;
  } | null;
}

interface Company {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
}

const PAYMENT_METHOD: Record<string, { label: string; icon: typeof QrCode }> = {
  pix: { label: "Pix", icon: QrCode },
  card: { label: "Cartão de crédito", icon: CreditCard },
  boleto: { label: "Boleto", icon: FileText },
};

const PAID_STATUSES = ["paid", "shipped", "delivered"];

// Payment and delivery are separate questions, so each gets its own badge.
const PAYMENT_STATUS: Record<string, { label: string; icon: typeof Clock; tone: string }> = {
  pending: { label: "Aguardando pagamento", icon: Clock, tone: "bg-warning-soft text-warning-soft-foreground" },
  processing: { label: "Aguardando pagamento", icon: Clock, tone: "bg-warning-soft text-warning-soft-foreground" },
  paid: { label: "Pago", icon: CheckCircle, tone: "bg-success-soft text-success-soft-foreground" },
  failed: { label: "Pagamento recusado", icon: XCircle, tone: "bg-destructive-soft text-destructive-soft-foreground" },
  cancelled: { label: "Cancelado", icon: XCircle, tone: "bg-destructive-soft text-destructive-soft-foreground" },
  expired: { label: "Pagamento expirado", icon: Clock, tone: "bg-muted text-muted-foreground" },
};

const DELIVERY_STATUS: Record<string, { label: string; icon: typeof Truck; tone: string }> = {
  paid: { label: "Em preparação", icon: PackageOpen, tone: "bg-info-soft text-info-soft-foreground" },
  shipped: { label: "Enviado", icon: Truck, tone: "bg-info-soft text-info-soft-foreground" },
  delivered: { label: "Entregue", icon: PackageCheck, tone: "bg-success-soft text-success-soft-foreground" },
};

const paymentStatus = (status: string) =>
  PAID_STATUSES.includes(status) ? PAYMENT_STATUS.paid : PAYMENT_STATUS[status] ?? { label: status, icon: Package, tone: "bg-muted text-muted-foreground" };

const FILTERS = [
  { id: "all", label: "Todos", match: () => true },
  { id: "pending", label: "Aguardando pagamento", match: (s: string) => s === "pending" || s === "processing" },
  { id: "active", label: "Em andamento", match: (s: string) => s === "paid" || s === "shipped" },
  { id: "delivered", label: "Entregues", match: (s: string) => s === "delivered" },
  { id: "closed", label: "Cancelados", match: (s: string) => ["cancelled", "failed", "expired"].includes(s) },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

const PAGE_SIZE = 10;

const formatPrice = (price: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCNPJ = (cnpj: string) =>
  cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");

const shortId = (id: string) => id.slice(0, 8).toUpperCase();

const parseOrder = (order: Record<string, unknown>) =>
  ({
    ...order,
    items: typeof order.items === "string" ? JSON.parse(order.items) : order.items,
  }) as Order;

const ORDER_SELECT = `*, companies ( nome_fantasia, cnpj )`;

export default function Pedidos() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [companyIds, setCompanyIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Track recently paid orders for animation
  const [recentlyPaidOrders, setRecentlyPaidOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authLoading || !user) return;
    fetchUserOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchUserOrders = async () => {
    setIsLoading(true);
    setLoadError(false);

    try {
      // A user can own more than one company (one per CNPJ used at checkout)
      const { data: companyRows, error: companyError } = await supabase
        .from("companies")
        .select("id, nome_fantasia, razao_social, cnpj")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });

      if (companyError) throw companyError;

      const ids = (companyRows || []).map((c) => c.id);
      setCompanies(companyRows || []);
      setCompanyIds(ids);
      if (ids.length === 0) {
        setOrders([]);
        return;
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .in("company_id", ids)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setOrders((ordersData || []).map((o) => parseOrder(o as Record<string, unknown>)));
    } catch (error) {
      console.error("Error fetching user orders:", error);
      setLoadError(true);
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
                    shipped_at: updatedOrder.shipped_at,
                    delivered_at: updatedOrder.delivered_at,
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
            .select(ORDER_SELECT)
            .eq('id', newOrder.id)
            .maybeSingle();

          if (!error && orderData) {
            const parsedOrder = parseOrder(orderData as Record<string, unknown>);
            setOrders(prevOrders => [parsedOrder, ...prevOrders.filter(o => o.id !== parsedOrder.id)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyIds]);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, orders.filter((o) => f.match(o.status)).length])) as Record<FilterId, number>,
    [orders]
  );

  const filtered = useMemo(() => {
    const q = query.trim().replace(/^#/, "").toUpperCase();
    const match = FILTERS.find((f) => f.id === filter)!.match;
    return orders.filter((o) => match(o.status) && (!q || shortId(o.id).includes(q)));
  }, [orders, filter, query]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Rebuilds the cart from a past order; prices are recalculated by today's table.
  const buyAgain = (order: Order) => {
    let added = 0;
    for (const item of order.items) {
      const base = resolveBaseProduct(item.productId);
      if (!base || (base.adminOnly && !isAdmin)) continue;
      addToCart(
        {
          ...base,
          id: item.productId,
          name: item.productName,
          price: getUnitPrice(item.productId, item.quantity, base.price),
        },
        item.quantity
      );
      added++;
    }
    if (added === 0) {
      toast({ title: "Produtos indisponíveis", description: "Os itens deste pedido não estão mais no catálogo.", variant: "destructive" });
      return;
    }
    navigate("/carrinho");
  };

  const company = companies[0];
  const stats = [
    { label: "Pedidos", value: orders.length, icon: Package },
    { label: "Aguardando pagamento", value: counts.pending ?? 0, icon: Clock },
    { label: "Em andamento", value: counts.active ?? 0, icon: Truck },
    { label: "Entregues", value: counts.delivered ?? 0, icon: PackageCheck },
  ];

  if (authLoading) {
    return (
      <Layout>
        <div className="container-custom pt-8 pb-16">
          <ListSkeleton />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/pedidos" }} />;
  }

  return (
    <Layout>
      <SEO title="Meus pedidos | FNZ Supply" description="Acompanhe seus pedidos, pagamentos e entregas na FNZ Supply." path="/pedidos" />
      <div className="container-custom pt-8 pb-16">
        {/* Page header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">Meus pedidos</h1>
            <p className="mt-2 text-muted-foreground">Acompanhe suas compras, pagamentos e entregas em um só lugar.</p>
          </div>
          {company && (
            <div className="flex items-center gap-3 rounded-2xl bg-card ring-1 ring-black/5 px-4 py-3 lg:max-w-sm">
              <span className="w-10 h-10 rounded-xl bg-muted text-foreground grid place-items-center shrink-0">
                <Building2 className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 text-sm leading-tight">
                <span className="block font-semibold text-foreground truncate">{company.nome_fantasia || company.razao_social}</span>
                <span className="block text-muted-foreground tabular-nums">CNPJ {formatCNPJ(company.cnpj)}</span>
                {companies.length > 1 && (
                  <span className="block text-xs text-muted-foreground">+ {companies.length - 1} {companies.length === 2 ? "outra empresa" : "outras empresas"}</span>
                )}
              </span>
            </div>
          )}
        </div>

        {isLoading && <ListSkeleton />}

        {!isLoading && loadError && (
          <div className="tile p-10 text-center" role="alert">
            <AlertTriangle className="w-10 h-10 mx-auto text-warning" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold text-foreground">Não foi possível carregar seus pedidos</h2>
            <p className="mt-1 text-muted-foreground">Verifique sua conexão e tente de novo.</p>
            <Button onClick={fetchUserOrders} className="mt-5 gap-2">
              <RotateCcw className="w-4 h-4" aria-hidden="true" /> Tentar de novo
            </Button>
          </div>
        )}

        {!isLoading && !loadError && orders.length === 0 && (
          <div className="tile p-10 md:p-14 text-center">
            <span className="w-16 h-16 mx-auto rounded-2xl bg-muted grid place-items-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-xl font-bold text-foreground">Você ainda não realizou seu primeiro pedido</h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Escolha seus envelopes, veja o preço por quantidade e finalize em poucos minutos.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/produtos">Conhecer produtos</Link>
            </Button>
          </div>
        )}

        {!isLoading && !loadError && orders.length > 0 && (
          <>
            {/* Indicators from the user's real orders */}
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {stats.map((stat) => (
                <div key={stat.label} className="tile p-4 sm:p-5 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-muted text-foreground grid place-items-center shrink-0">
                    <stat.icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <dd className="text-2xl font-extrabold text-foreground tabular-nums leading-none">{stat.value}</dd>
                    <dt className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</dt>
                  </span>
                </div>
              ))}
            </dl>

            {/* Filters and search */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1 md:pb-0" role="tablist" aria-label="Filtrar pedidos">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    role="tab"
                    aria-selected={filter === f.id}
                    onClick={() => {
                      setFilter(f.id);
                      setVisible(PAGE_SIZE);
                    }}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      filter === f.id ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-black/5 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.label}
                    <span className={cn("text-xs tabular-nums rounded-full px-1.5", filter === f.id ? "bg-white/15" : "bg-muted")}>{counts[f.id]}</span>
                  </button>
                ))}
              </div>
              <label className="md:ml-auto flex items-center gap-2 h-10 md:w-64 rounded-xl bg-card ring-1 ring-black/5 px-3 focus-within:ring-2 focus-within:ring-ring">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="sr-only">Buscar pelo número do pedido</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setVisible(PAGE_SIZE);
                  }}
                  placeholder="Nº do pedido"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </label>
            </div>

            {filtered.length === 0 ? (
              <div className="tile p-10 text-center">
                <p className="font-semibold text-foreground">Nenhum pedido encontrado com esses filtros.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setFilter("all");
                    setQuery("");
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {filtered.slice(0, visible).map((order) => {
                  const pay = paymentStatus(order.status);
                  const PayIcon = pay.icon;
                  const delivery = DELIVERY_STATUS[order.status];
                  const DeliveryIcon = delivery?.icon;
                  const method = PAYMENT_METHOD[order.payment_method ?? ""];
                  const isOpen = expanded.has(order.id);
                  const isRecentlyPaid = recentlyPaidOrders.has(order.id);
                  const units = order.items.reduce((sum, item) => sum + Number(item.quantity), 0);
                  const subtotal = order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
                  const shipping = Number(order.shipping_amount ?? 0);
                  const boletoUrl =
                    order.payment_method === "boleto" && order.status === "pending" && order.payment_url?.startsWith("http")
                      ? order.payment_url
                      : null;

                  return (
                    <li
                      key={order.id}
                      className={cn(
                        "tile overflow-hidden relative transition-shadow duration-300",
                        isRecentlyPaid && "ring-2 ring-success"
                      )}
                    >
                      {isRecentlyPaid && (
                        <div className="absolute inset-0 bg-success/10 pointer-events-none animate-fade-in z-10 flex items-center justify-center">
                          <div className="bg-success text-success-foreground px-4 py-2 rounded-full flex items-center gap-2 animate-scale-in shadow-lg">
                            <PartyPopper className="w-5 h-5" aria-hidden="true" />
                            <span className="font-semibold">Pagamento confirmado!</span>
                          </div>
                        </div>
                      )}

                      {/* Summary row: the whole header toggles the details */}
                      <button
                        type="button"
                        onClick={() => toggle(order.id)}
                        aria-expanded={isOpen}
                        aria-controls={`order-${order.id}`}
                        className="w-full text-left p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <span className="flex items-center gap-3 min-w-0 md:w-56 shrink-0">
                          <span className="w-10 h-10 rounded-xl bg-muted text-foreground grid place-items-center shrink-0">
                            <Package className="w-5 h-5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-bold text-foreground">Pedido #{shortId(order.id)}</span>
                            <span className="block text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
                          </span>
                        </span>

                        <span className="flex flex-wrap items-center gap-2 flex-1">
                          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", pay.tone)}>
                            <PayIcon className="w-3.5 h-3.5" aria-hidden="true" />
                            {pay.label}
                          </span>
                          {delivery && DeliveryIcon && (
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", delivery.tone)}>
                              <DeliveryIcon className="w-3.5 h-3.5" aria-hidden="true" />
                              {delivery.label}
                            </span>
                          )}
                          {method && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              <method.icon className="w-3.5 h-3.5" aria-hidden="true" />
                              {method.label}
                            </span>
                          )}
                        </span>

                        <span className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                          <span className="text-sm text-muted-foreground md:text-right">
                            {order.items.length} {order.items.length === 1 ? "produto" : "produtos"} · {units.toLocaleString("pt-BR")} un.
                          </span>
                          <span className="text-lg font-extrabold text-foreground tabular-nums">{formatPrice(Number(order.total_amount))}</span>
                          <ChevronDown
                            className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
                            aria-hidden="true"
                          />
                          <span className="sr-only">{isOpen ? "Ocultar detalhes" : "Ver detalhes"}</span>
                        </span>
                      </button>

                      {/* Always visible on wider screens; on phones it lives in the details to keep the list short */}
                      {PAID_STATUSES.includes(order.status) && (
                        <div className="hidden sm:block px-5 pb-5 pt-1">
                          <OrderProgress
                            status={order.status}
                            createdAt={order.created_at}
                            shippedAt={order.shipped_at}
                            deliveredAt={order.delivered_at}
                          />
                        </div>
                      )}

                      {isOpen && (
                        <div id={`order-${order.id}`} className="border-t border-border p-4 sm:p-5 animate-enter">
                          {PAID_STATUSES.includes(order.status) && (
                            <div className="sm:hidden mb-5">
                              <OrderProgress
                                status={order.status}
                                createdAt={order.created_at}
                                shippedAt={order.shipped_at}
                                deliveredAt={order.delivered_at}
                              />
                            </div>
                          )}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <caption className="sr-only">Itens do pedido #{shortId(order.id)}</caption>
                              <thead>
                                <tr className="text-left text-xs text-muted-foreground">
                                  <th scope="col" className="font-medium pb-2">Produto</th>
                                  <th scope="col" className="font-medium pb-2 text-right">Quantidade</th>
                                  <th scope="col" className="font-medium pb-2 text-right hidden sm:table-cell">Preço unit.</th>
                                  <th scope="col" className="font-medium pb-2 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {order.items.map((item, index) => (
                                  <tr key={index}>
                                    <td className="py-2.5 pr-3 text-foreground">{item.productName}</td>
                                    <td className="py-2.5 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                                      {Number(item.quantity).toLocaleString("pt-BR")} {item.unit === "unidade" ? "un." : item.unit}
                                    </td>
                                    <td className="py-2.5 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                                      {formatPrice(Number(item.unitPrice))}
                                    </td>
                                    <td className="py-2.5 text-right tabular-nums font-medium text-foreground">{formatPrice(Number(item.totalPrice))}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <dl className="text-sm space-y-1.5 md:order-2 md:max-w-xs md:ml-auto w-full">
                              <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Subtotal</dt>
                                <dd className="tabular-nums text-foreground">{formatPrice(subtotal)}</dd>
                              </div>
                              <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Frete</dt>
                                <dd className={cn("tabular-nums", shipping > 0 ? "text-foreground" : "text-success font-semibold")}>
                                  {shipping > 0 ? formatPrice(shipping) : "Grátis"}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-4 border-t border-border pt-2 mt-2">
                                <dt className="font-bold text-foreground">Total</dt>
                                <dd className="font-extrabold tabular-nums text-foreground">{formatPrice(Number(order.total_amount))}</dd>
                              </div>
                              {method && (
                                <div className="flex justify-between gap-4">
                                  <dt className="text-muted-foreground">Pagamento</dt>
                                  <dd className="text-foreground">{method.label}</dd>
                                </div>
                              )}
                            </dl>

                            <div className="flex flex-wrap items-end gap-2 md:order-1">
                              <Button variant="outline" className="gap-2" onClick={() => buyAgain(order)}>
                                <RotateCcw className="w-4 h-4" aria-hidden="true" /> Comprar novamente
                              </Button>
                              {boletoUrl && (
                                <Button asChild variant="outline" className="gap-2">
                                  <a href={boletoUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4" aria-hidden="true" /> Abrir boleto
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {filtered.length > visible && (
              <div className="mt-6 text-center">
                <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Mostrar mais pedidos ({filtered.length - visible})
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
