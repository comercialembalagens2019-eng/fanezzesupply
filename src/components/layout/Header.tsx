import { useMemo, useState, FormEvent, KeyboardEvent } from "react";
import { Logo } from "@/components/Logo";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, User, LogOut, Users, Search } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { products } from "@/data/products";
import { searchSuggestions, type SearchSuggestion } from "@/lib/productSearch";

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

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = useMemo(
    () => searchSuggestions(products.filter((p) => !p.adminOnly || isAdmin), query),
    [query, isAdmin]
  );
  const suggestionsOpen = showSuggestions && suggestions.length > 0;

  const goSearch = (q: string) => {
    const term = q.trim();
    navigate(term ? `/produtos?q=${encodeURIComponent(term)}` : "/produtos");
    setShowSuggestions(false);
    setActiveIndex(-1);
    setIsMobileMenuOpen(false);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const picked: SearchSuggestion | undefined = suggestionsOpen ? suggestions[activeIndex] : undefined;
    if (picked) setQuery(picked.query);
    goSearch(picked ? picked.query : query);
  };

  // Arrow keys move through the suggestions; Enter picks one, Escape closes the list.
  const handleSearchKeys = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(`${href}/`);
  const linkClass = (href: string) =>
    cn(
      "relative text-sm font-semibold transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4",
      // A short underline marks the page the visitor is on.
      "after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-0.5 after:rounded-full after:bg-foreground after:transition-opacity",
      isActive(href) ? "text-foreground after:opacity-100" : "text-muted-foreground hover:text-foreground after:opacity-0"
    );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md">
      <div className="container-custom">
        <div className="flex items-center gap-3 md:gap-5 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0" aria-label="FNZ Supply — início">
            <Logo className="h-10 md:h-12" />
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} role="search" className="relative flex-1 max-w-xl">
            <label className="flex items-center gap-2 h-11 rounded-xl bg-card ring-1 ring-black/5 px-3.5 focus-within:ring-2 focus-within:ring-ring transition-shadow">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="sr-only">Buscar produtos</span>
              <input
                type="search"
                role="combobox"
                aria-expanded={suggestionsOpen}
                aria-controls="search-suggestions"
                aria-autocomplete="list"
                aria-activedescendant={suggestionsOpen && activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                  setActiveIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setShowSuggestions(false)}
                onKeyDown={handleSearchKeys}
                placeholder="Buscar envelope ou tamanho…"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
            {suggestionsOpen && (
              <ul
                id="search-suggestions"
                role="listbox"
                aria-label="Sugestões"
                className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-card ring-1 ring-black/10 shadow-lg p-1.5 animate-enter"
              >
                {suggestions.map((s, i) => (
                  <li
                    key={s.key}
                    id={`search-option-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    // mousedown keeps focus in the input so blur does not close the list first
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setQuery(s.query);
                      goSearch(s.query);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm",
                      i === activeIndex ? "bg-muted" : ""
                    )}
                  >
                    <span className="font-semibold text-foreground truncate">{s.label}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{s.detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 ml-auto" aria-label="Principal">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} className={linkClass(link.href)} aria-current={isActive(link.href) ? "page" : undefined}>
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className={cn(linkClass("/admin"), "flex items-center gap-1")}>
                <Users className="w-4 h-4" aria-hidden="true" />
                Painel admin
              </Link>
            )}
            {user ? (
              <button onClick={handleSignOut} className={cn(linkClass("/sair"), "flex items-center gap-1.5 after:hidden")}>
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
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-muted-foreground hover:bg-muted"
                >
                  <Users className="w-4 h-4" aria-hidden="true" />
                  Painel admin
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
