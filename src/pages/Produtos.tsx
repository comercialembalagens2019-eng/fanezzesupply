import { useState, useMemo, useEffect, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Grid3X3, LayoutList } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Helmet } from "react-helmet-async";
import { ProductCard } from "@/components/products/ProductCard";
import { products, categories } from "@/data/products";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { matchesProduct } from "@/lib/productSearch";

type SortOption = "name-asc" | "name-desc";

const Produtos = () => {
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") ?? "");

  // The header search navigates here with ?q=
  useEffect(() => {
    setSearchTerm(searchParams.get("q") ?? "");
  }, [searchParams]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => !p.adminOnly || isAdmin);

    // Filter by search term
    if (searchTerm) {
      result = result.filter((p) => matchesProduct(p, searchTerm));
    }

    // Filter by category
    if (selectedCategory !== "Todos") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return result;
  }, [searchTerm, selectedCategory, sortBy, isAdmin]);

  return (
    <Layout>
      <SEO
        title="Nossos Produtos — FNZ Supply"
        description="Envelopes de segurança COEX, cinza e personalizados para empresas. Tabela de preço por quantidade e pedido mínimo acessível."
        path="/produtos"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Catálogo FNZ Supply",
          "itemListElement": products.filter((p) => !p.adminOnly).slice(0, 20).map((p, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": p.name,
          })),
        })}</script>
      </Helmet>
      {/* Header + filters */}
      <section className="container-custom pt-4">
        <div className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -right-16 -bottom-20 w-64 h-64 rounded-full bg-navy-light/60" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary-foreground">Nossos produtos</h1>
            <p className="mt-3 text-white/75">
              Preço por unidade conforme o tamanho e a quantidade. Pedido mínimo a partir de 500 unidades.
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-40 bg-background/90 backdrop-blur-md">
        <div className="container-custom py-3">
          <div className="tile p-3 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <label className="relative flex-1 max-w-md">
              <span className="sr-only">Buscar produtos</span>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-9 pr-4 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={selectedCategory === category}
                  className={cn(
                    "px-4 h-10 rounded-xl text-sm font-bold transition-colors",
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "ring-1 ring-black/10 text-foreground hover:bg-muted"
                  )}
                >
                  {category}
                </button>
              ))}

              <select
                aria-label="Ordenar produtos"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 px-3 rounded-xl ring-1 ring-black/10 bg-card text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="name-asc">Nome (A-Z)</option>
                <option value="name-desc">Nome (Z-A)</option>
              </select>

              <div className="hidden md:flex items-center rounded-xl ring-1 ring-black/10 overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Visualizar em grade"
                  aria-pressed={viewMode === "grid"}
                  className={cn("p-2.5 transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="Visualizar em lista"
                  aria-pressed={viewMode === "list"}
                  className={cn("p-2.5 transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="pt-4">
        <div className="container-custom">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                Nenhum produto encontrado.
              </p>
            </div>
          ) : (
            <>
              <h2 className="sr-only">Catálogo de produtos</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredProducts.length} produto{filteredProducts.length !== 1 && "s"} encontrado{filteredProducts.length !== 1 && "s"}
              </p>
              <div
                className={cn(
                  "grid gap-4",
                  viewMode === "grid"
                    ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1 max-w-3xl"
                )}
              >
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-enter"
                    style={{ "--enter-delay": `${Math.min(index, 8) * 40}ms` } as CSSProperties}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Produtos;
