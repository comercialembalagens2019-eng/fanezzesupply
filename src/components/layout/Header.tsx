import { useState, FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, User, Package, LogOut, Users, Search } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const baseNavLinks = [
  { href: "/produtos", label: "Produtos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { items } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  // Number of distinct products; quantities run into the thousands in B2B orders.
  const itemCount = items.length;
  const navLinks = user
    ? [baseNavLinks[0], { href: "/pedidos", label: "Meus pedidos" }, ...baseNavLinks.slice(1)]
    : baseNavLinks;

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/produtos?q=${encodeURIComponent(q)}` : "/produtos");
    setIsMobileMenuOpen(false);
  };

  const linkClass = (href: string) =>
    cn(
      "text-sm font-semibold transition-colors",
      location.pathname === href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md">
      <div className="container-custom">
        <div className="flex items-center gap-3 md:gap-5 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="FNZ Supply — início">
            <span className="w-9 h-9 rounded-xl bg-primary text-beige grid place-items-center">
              <Package className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="hidden sm:inline font-display font-extrabold text-lg text-foreground">FNZ Supply</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} role="search" className="flex-1 max-w-xl">
            <label className="flex items-center gap-2 h-11 rounded-xl bg-card ring-1 ring-black/5 px-3.5 focus-within:ring-2 focus-within:ring-ring transition-shadow">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="sr-only">Buscar produtos</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar envelope, tamanho ou stretch…"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Principal">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin/clientes" className={cn(linkClass("/admin/clientes"), "flex items-center gap-1")}>
                <Users className="w-4 h-4" aria-hidden="true" />
                Clientes
              </Link>
            )}
            {user ? (
              <button onClick={handleSignOut} className={cn(linkClass("/sair"), "flex items-center gap-1.5")}>
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Sair
              </button>
            ) : (
              <Link to="/login" className={cn(linkClass("/login"), "flex items-center gap-1.5")}>
                <User className="w-4 h-4" aria-hidden="true" />
                Entrar
              </Link>
            )}
          </nav>

          {/* Cart */}
          <Link
            to="/carrinho"
            className="relative w-11 h-11 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0 hover:bg-navy-light transition-colors"
            aria-label={itemCount > 0 ? `Carrinho, ${itemCount} ${itemCount === 1 ? "produto" : "produtos"}` : "Carrinho"}
          >
            <ShoppingCart className="w-5 h-5" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-beige text-navy text-[10px] font-extrabold rounded-full grid place-items-center">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          {/* Mobile menu button */}
          <button
            className="lg:hidden w-11 h-11 grid place-items-center rounded-xl hover:bg-card transition-colors shrink-0"
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden tile mb-3 p-2 animate-fade-in">
            <nav className="flex flex-col" aria-label="Menu">
              {[{ href: "/", label: "Início" }, ...navLinks].map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl font-semibold transition-colors",
                    location.pathname === link.href ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin/clientes"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-muted-foreground hover:bg-muted"
                >
                  <Users className="w-4 h-4" aria-hidden="true" />
                  Clientes (Admin)
                </Link>
              )}
              <div className="border-t border-border mt-2 pt-2">
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-3 w-full rounded-xl font-semibold text-muted-foreground hover:bg-muted"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Sair
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-muted-foreground hover:bg-muted"
                  >
                    <User className="w-4 h-4" aria-hidden="true" />
                    Entrar / Cadastrar
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
