import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, CheckCircle2, ChevronDown, ChevronUp, Clock, CreditCard, FileText, Loader2, Mail, MapPin,
  Package, PackageCheck, Phone, QrCode, Search, ShoppingCart, Truck, Users, XCircle,
} from "lucide-react";
import { ListSkeleton } from "@/components/skeletons";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { parseCartItems } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { formatBRL, getUnitPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type CartRow = Database["public"]["Tables"]["carts"]["Row"];
type UserRow = Database["public"]["Functions"]["admin_list_users"]["Returns"][number];

interface OrderItem {
  productName: string;
  quantity: number;
  unit: string;
  totalPrice: number;
}

const PAID = ["paid", "shipped", "delivered"];

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Aguardando pagamento", className: "bg-warning-soft text-warning-soft-foreground" },
  processing: { label: "Processando pagamento", className: "bg-info-soft text-info-soft-foreground" },
  paid: { label: "Pedido recebido", className: "bg-success-soft text-success-soft-foreground" },
  shipped: { label: "Enviado", className: "bg-info-soft text-info-soft-foreground" },
  delivered: { label: "Entregue", className: "bg-primary text-primary-foreground" },
  failed: { label: "Pagamento falhou", className: "bg-destructive-soft text-destructive-soft-foreground" },
  cancelled: { label: "Cancelado", className: "bg-destructive-soft text-destructive-soft-foreground" },
};

const METHOD: Record<string, { label: string; icon: typeof QrCode }> = {
  pix: { label: "PIX", icon: QrCode },
  card: { label: "Cartão", icon: CreditCard },
  boleto: { label: "Boleto", icon: FileText },
};

// Fulfillment choices for paid orders; Resend e-mails will hook into this change later.
const FULFILLMENT = [
  { status: "paid", label: "Recebido", icon: CheckCircle2 },
  { status: "shipped", label: "Enviado", icon: Truck },
  { status: "delivered", label: "Entregue", icon: PackageCheck },
];

const ORDER_FILTERS = [
  { id: "all", label: "Todos", match: () => true },
  { id: "pending", label: "Aguardando pagamento", match: (s: string) => s === "pending" || s === "processing" },
  { id: "paid", label: "A enviar", match: (s: string) => s === "paid" },
  { id: "shipped", label: "Enviados", match: (s: string) => s === "shipped" },
  { id: "delivered", label: "Entregues", match: (s: string) => s === "delivered" },
  { id: "closed", label: "Cancelados/falhos", match: (s: string) => s === "failed" || s === "cancelled" },
];

const formatDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "—";

const formatCNPJ = (cnpj: string) =>
  cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");

const orderItems = (order: OrderRow) => (Array.isArray(order.items) ? (order.items as unknown as OrderItem[]) : []);

const cartTotal = (cart: CartRow) =>
  parseCartItems(cart.items).reduce(
    (sum, item) => sum + getUnitPrice(item.product.id, item.quantity, item.product.price) * item.quantity,
    0
  );

function StatusBadge({ status }: { status: string }) {
  const config = STATUS[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return <span className={cn("text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap", config.className)}>{config.label}</span>;
}

function FulfillmentControl({ order, onChanged }: { order: OrderRow; onChanged: () => void }) {
  const [saving, setSaving] = useState<string | null>(null);

  const setStatus = async (status: string) => {
    if (status === order.status) return;
    setSaving(status);
    const { error } = await supabase.rpc("admin_set_fulfillment_status", { p_order_id: order.id, p_status: status });
    setSaving(null);
    if (error) {
      toast({ title: "Não foi possível atualizar o pedido", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pedido atualizado", description: STATUS[status]?.label });
    // E-mails the customer; a failure here does not undo the status change.
    if (status === "shipped" || status === "delivered") {
      supabase.functions.invoke("notify-order-status", { body: { orderId: order.id } }).catch(() => undefined);
    }
    onChanged();
  };

  return (
    <div className="grid grid-cols-3 rounded-xl bg-muted p-1 gap-1" role="radiogroup" aria-label="Status de entrega">
      {FULFILLMENT.map((step) => {
        const active = order.status === step.status;
        return (
          <button
            key={step.status}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={saving !== null}
            onClick={() => setStatus(step.status)}
            className={cn(
              "h-9 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-card"
            )}
          >
            {saving === step.status ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <step.icon className="w-3.5 h-3.5" aria-hidden="true" />}
            {step.label}
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: string; icon: typeof Users; accent?: boolean }) {
  return (
    <div className={cn("p-5 rounded-3xl", accent ? "bg-beige" : "tile")}>
      <Icon className="w-5 h-5" aria-hidden="true" />
      <p className="mt-3 text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default function Admin() {
  const { isAdmin, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"orders" | "users" | "carts">("orders");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [carts, setCarts] = useState<CartRow[]>([]);
  const [orderFilter, setOrderFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/login", { state: { from: "/admin" } });
    else if (!isAdmin) navigate("/");
  }, [authLoading, user, isAdmin, navigate]);

  const fetchAll = useCallback(async () => {
    const [u, c, o, k] = await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.from("companies").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(2000),
      supabase.from("carts").select("*").order("updated_at", { ascending: false }),
    ]);
    const firstError = u.error ?? c.error ?? o.error ?? k.error;
    if (firstError) {
      toast({ title: "Erro ao carregar o painel", description: firstError.message, variant: "destructive" });
    }
    setUsers(u.data ?? []);
    setCompanies(c.data ?? []);
    setOrders(o.data ?? []);
    setCarts(k.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAll();
    const channel = supabase
      .channel("admin-panel")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "carts" }, () => fetchAll())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, fetchAll]);

  const companyById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);
  const companiesByUser = useMemo(() => {
    const map = new Map<string, CompanyRow[]>();
    companies.forEach((c) => map.set(c.user_id, [...(map.get(c.user_id) ?? []), c]));
    return map;
  }, [companies]);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const nonEmptyCarts = useMemo(() => carts.filter((c) => parseCartItems(c.items).length > 0), [carts]);

  const q = search.trim().toLowerCase();
  const matchesCompany = (c?: CompanyRow) =>
    !!c && [c.nome_fantasia, c.razao_social, c.cnpj, c.email, c.cidade].some((v) => v?.toLowerCase().includes(q));

  const filteredOrders = orders.filter((o) => {
    const filter = ORDER_FILTERS.find((f) => f.id === orderFilter)!;
    if (!filter.match(o.status)) return false;
    return !q || o.id.startsWith(q) || matchesCompany(companyById.get(o.company_id ?? ""));
  });
  const filteredUsers = users.filter(
    (u) => !q || u.email.toLowerCase().includes(q) || (companiesByUser.get(u.id) ?? []).some(matchesCompany)
  );

  const paidOrders = orders.filter((o) => PAID.includes(o.status));
  const revenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const toShip = orders.filter((o) => o.status === "paid").length;

  if (authLoading || !isAdmin) {
    return (
      <Layout>
        <div className="container-custom py-8"><ListSkeleton rows={4} /></div>
      </Layout>
    );
  }

  const tabs = [
    { id: "orders" as const, label: "Pedidos", count: orders.length },
    { id: "users" as const, label: "Cadastros", count: users.length },
    { id: "carts" as const, label: "Carrinhos", count: nonEmptyCarts.length },
  ];

  return (
    <Layout>
      <SEO title="Painel admin — FNZ Supply" description="Painel administrativo." path="/admin" />
      <section className="container-custom pt-4 space-y-4">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Stat label="Receita confirmada" value={formatBRL(revenue)} icon={CheckCircle2} accent />
          <Stat label="Pedidos a enviar" value={String(toShip)} icon={Truck} />
          <Stat label="Cadastros" value={String(users.length)} icon={Users} />
          <Stat label="Carrinhos com itens" value={String(nonEmptyCarts.length)} icon={ShoppingCart} />
        </div>

        <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md py-2">
          <div className="tile p-3 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex gap-1 rounded-xl bg-muted p-1" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "px-4 h-9 rounded-lg text-sm font-bold transition-colors",
                    tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label} <span className="text-muted-foreground font-semibold">{t.count}</span>
                </button>
              ))}
            </div>
            <label className="relative flex-1 lg:max-w-sm">
              <span className="sr-only">Buscar</span>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por empresa, CNPJ, e-mail ou nº do pedido"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
        </div>

        {loading ? (
          <ListSkeleton rows={4} />
        ) : tab === "orders" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {ORDER_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderFilter(f.id)}
                  aria-pressed={orderFilter === f.id}
                  className={cn(
                    "px-3 h-9 rounded-xl text-sm font-bold transition-colors",
                    orderFilter === f.id ? "bg-primary text-primary-foreground" : "ring-1 ring-black/10 hover:bg-card"
                  )}
                >
                  {f.label} <span className="opacity-60">{orders.filter((o) => f.match(o.status)).length}</span>
                </button>
              ))}
            </div>
            {filteredOrders.length === 0 && <p className="tile p-10 text-center text-muted-foreground">Nenhum pedido encontrado.</p>}
            {filteredOrders.map((order) => {
              const company = companyById.get(order.company_id ?? "");
              const method = METHOD[order.payment_method ?? ""];
              const MethodIcon = method?.icon ?? Package;
              return (
                <article key={order.id} className="tile p-5 grid gap-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <StatusBadge status={order.status} />
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <MethodIcon className="w-3.5 h-3.5" aria-hidden="true" /> {method?.label ?? "—"}
                      </span>
                    </div>
                    <p className="mt-1 font-extrabold truncate">{company?.nome_fantasia ?? "Empresa removida"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(order.created_at)}
                      {company && ` · ${company.cidade}/${company.estado}`}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {orderItems(order).map((item, i) => (
                      <p key={i} className="truncate">{item.productName} × {Number(item.quantity).toLocaleString("pt-BR")}</p>
                    ))}
                    <p className="mt-1 font-extrabold text-foreground tabular-nums">
                      {formatBRL(Number(order.total_amount))}
                      {Number(order.shipping_amount) > 0 && (
                        <span className="text-xs font-normal text-muted-foreground"> (frete {formatBRL(Number(order.shipping_amount))})</span>
                      )}
                    </p>
                  </div>
                  <div className="lg:w-72">
                    {PAID.includes(order.status) ? (
                      <FulfillmentControl order={order} onChanged={fetchAll} />
                    ) : (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {order.status === "pending" || order.status === "processing" ? <Clock className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {order.status === "pending" || order.status === "processing"
                          ? "O status de entrega libera após a confirmação do pagamento."
                          : "Pedido sem pagamento confirmado."}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : tab === "users" ? (
          <div className="space-y-3">
            {filteredUsers.length === 0 && <p className="tile p-10 text-center text-muted-foreground">Nenhum cadastro encontrado.</p>}
            {filteredUsers.map((u) => {
              const userCompanies = companiesByUser.get(u.id) ?? [];
              const userOrders = orders.filter((o) => userCompanies.some((c) => c.id === o.company_id));
              const paid = userOrders.filter((o) => PAID.includes(o.status));
              const cart = carts.find((c) => c.user_id === u.id);
              const cartItems = cart ? parseCartItems(cart.items) : [];
              const open = expandedUser === u.id;
              return (
                <article key={u.id} className="tile">
                  <button
                    className="w-full p-5 grid gap-3 sm:grid-cols-[1.4fr_1fr_auto] items-center text-left"
                    onClick={() => setExpandedUser(open ? null : u.id)}
                    aria-expanded={open}
                  >
                    <div className="min-w-0">
                      <p className="font-extrabold truncate">
                        {userCompanies[0]?.nome_fantasia ?? <span className="text-muted-foreground font-semibold">Sem empresa cadastrada</span>}
                        {u.is_admin && <span className="ml-2 text-[11px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-md align-middle">admin</span>}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Cadastro: {formatDateTime(u.created_at)}</p>
                      <p>Último acesso: {formatDateTime(u.last_sign_in_at)}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold tabular-nums">{paid.length} compra(s)</span>
                      {cartItems.length > 0 && (
                        <span className="text-xs font-bold bg-beige px-2 py-1 rounded-lg flex items-center gap-1">
                          <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" /> {cartItems.length}
                        </span>
                      )}
                      {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  {open && (
                    <div className="border-t border-border p-5 grid gap-5 lg:grid-cols-3 text-sm">
                      <div className="space-y-3">
                        <h3 className="font-extrabold flex items-center gap-2"><Building2 className="w-4 h-4" /> Empresa(s)</h3>
                        {userCompanies.length === 0 && <p className="text-muted-foreground">Nenhuma empresa cadastrada ainda.</p>}
                        {userCompanies.map((c) => (
                          <div key={c.id} className="rounded-2xl bg-muted p-3 space-y-1">
                            <p className="font-bold">{c.razao_social}</p>
                            <p className="text-muted-foreground">CNPJ {formatCNPJ(c.cnpj)}</p>
                            <p className="flex items-center gap-1.5 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> {c.email}</p>
                            <p className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {c.whatsapp}</p>
                            <p className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> {c.endereco}, {c.numero} · {c.cidade}/{c.estado}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-extrabold flex items-center gap-2"><Package className="w-4 h-4" /> Pedidos</h3>
                        {userOrders.length === 0 && <p className="text-muted-foreground">Nenhum pedido.</p>}
                        {userOrders.map((o) => (
                          <div key={o.id} className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">{formatDateTime(o.created_at)}</span>
                            <StatusBadge status={o.status} />
                            <b className="tabular-nums">{formatBRL(Number(o.total_amount))}</b>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-extrabold flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Carrinho atual</h3>
                        {cartItems.length === 0 ? (
                          <p className="text-muted-foreground">Vazio.</p>
                        ) : (
                          <>
                            {cartItems.map((item) => (
                              <p key={item.product.id} className="flex justify-between gap-2">
                                <span className="truncate">{item.product.name} × {item.quantity.toLocaleString("pt-BR")}</span>
                              </p>
                            ))}
                            <p className="font-bold">{formatBRL(cartTotal(cart!))} · atualizado {formatDateTime(cart!.updated_at)}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {nonEmptyCarts.length === 0 && (
              <p className="tile p-10 text-center text-muted-foreground">
                Nenhum carrinho com itens. Os carrinhos aparecem aqui quando um cliente logado adiciona produtos.
              </p>
            )}
            {nonEmptyCarts
              .filter((cart) => {
                if (!q) return true;
                const owner = userById.get(cart.user_id);
                return owner?.email.toLowerCase().includes(q) || (companiesByUser.get(cart.user_id) ?? []).some(matchesCompany);
              })
              .map((cart) => {
                const owner = userById.get(cart.user_id);
                const company = companiesByUser.get(cart.user_id)?.[0];
                return (
                  <article key={cart.user_id} className="tile p-5 grid gap-4 lg:grid-cols-[1.2fr_1.6fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <p className="font-extrabold truncate">{company?.nome_fantasia ?? owner?.email ?? "Cliente"}</p>
                      <p className="text-sm text-muted-foreground truncate">{owner?.email}</p>
                      {company?.whatsapp && <p className="text-xs text-muted-foreground">WhatsApp {company.whatsapp}</p>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {parseCartItems(cart.items).map((item) => (
                        <p key={item.product.id} className="truncate">
                          {item.product.name} × {item.quantity.toLocaleString("pt-BR")}
                        </p>
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold tabular-nums">{formatBRL(cartTotal(cart))}</p>
                      <p className="text-xs text-muted-foreground">atualizado {formatDateTime(cart.updated_at)}</p>
                    </div>
                  </article>
                );
              })}
          </div>
        )}
      </section>
    </Layout>
  );
}
