import { Link } from "react-router-dom";
import { ArrowRight, Package, Truck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
export function HeroSection() {
  const {
    user
  } = useAuth();
  return <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-primary">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-beige blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-beige blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
      backgroundImage: `linear-gradient(hsl(var(--beige)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--beige)) 1px, transparent 1px)`,
      backgroundSize: '60px 60px'
    }} />

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-beige/10 border border-beige/20 text-beige text-sm animate-fade-in">
              <Package className="w-4 h-4" />
              <span>Distribuição B2B de Embalagens</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-beige leading-tight animate-slide-up">
              Distribuição de Embalagens para sua{" "}
              <span className="relative">
                <span className="relative z-10">Empresa</span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-beige/20 -skew-x-3" />
              </span>
            </h1>

            <p className="text-lg md:text-xl text-beige/80 max-w-xl animate-slide-up stagger-1">
              Qualidade e entrega rápida. Cadastre sua empresa e tenha acesso a condições exclusivas para atacado.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up stagger-2">
              <Link to={user ? "/produtos" : "/cadastro"}>
                <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                  {user ? "Comece a comprar" : "Cadastre-se e comece a comprar"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/produtos">
                <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                  Ver Produtos
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-8 pt-8 border-t border-beige/10 animate-slide-up stagger-3">
              <div className="space-y-1">
                <p className="font-display text-3xl font-bold text-beige">500+</p>
                <p className="text-sm text-beige/60">Clientes Ativos</p>
              </div>
              <div className="space-y-1">
                <p className="font-display text-3xl font-bold text-beige">40+</p>
                <p className="text-sm text-beige/60">Anos de Mercado</p>
              </div>
              <div className="space-y-1">
                <p className="font-display text-3xl font-bold text-beige">98%</p>
                <p className="text-sm text-beige/60">Satisfação</p>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative hidden lg:block animate-scale-in">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main Circle */}
              <div className="absolute inset-0 rounded-full bg-beige/5 border border-beige/10" />
              
              {/* Floating Elements */}
              <div className="absolute top-10 right-10 w-20 h-20 rounded-2xl bg-beige/10 backdrop-blur-sm border border-beige/20 flex items-center justify-center animate-float">
                <Package className="w-10 h-10 text-beige" />
              </div>
              <div className="absolute bottom-20 left-0 w-16 h-16 rounded-2xl bg-beige/10 backdrop-blur-sm border border-beige/20 flex items-center justify-center animate-float" style={{
              animationDelay: "1s"
            }}>
                <Truck className="w-8 h-8 text-beige" />
              </div>
              <div className="absolute top-1/2 right-0 w-14 h-14 rounded-2xl bg-beige/10 backdrop-blur-sm border border-beige/20 flex items-center justify-center animate-float" style={{
              animationDelay: "2s"
            }}>
                <Shield className="w-7 h-7 text-beige" />
              </div>

              {/* Center Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="w-24 h-24 mx-auto rounded-2xl bg-beige flex items-center justify-center">
                    <Package className="w-12 h-12 text-navy" />
                  </div>
                  <p className="text-beige font-display font-semibold text-lg">
                    Embalagens de Qualidade
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}