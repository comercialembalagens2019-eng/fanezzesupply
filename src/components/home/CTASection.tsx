import { Link } from "react-router-dom";
import { ArrowRight, CreditCard, Package, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="container-custom mt-10 grid gap-4 md:grid-cols-3" aria-label="Condições para empresas">
      <div className="md:col-span-2 rounded-3xl bg-primary text-primary-foreground p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-beige">
            <Sparkles className="w-4 h-4" aria-hidden="true" /> Envelope personalizado
          </span>
          <h2 className="mt-3 text-2xl md:text-3xl font-extrabold text-primary-foreground">Envelope com a sua logomarca</h2>
          <p className="mt-2 text-white/75">Produção em 30 dias, a partir de 2.000 unidades. A FNZ é fabricante e distribuidora.</p>
        </div>
        <Link
          to="/contato"
          className="inline-flex justify-center items-center gap-2 bg-beige text-navy font-bold px-6 py-3.5 rounded-xl hover:bg-beige-light transition-colors shrink-0"
        >
          Pedir orçamento <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid gap-4">
        <div className="tile p-6 flex items-start gap-4">
          <Package className="w-6 h-6 shrink-0" aria-hidden="true" />
          <div>
            <b className="font-extrabold block">Pedido mínimo acessível</b>
            <span className="text-sm text-muted-foreground">A partir de 500 unidades por tamanho.</span>
          </div>
        </div>
        <Link to="/cadastro" className="tile p-6 flex items-start gap-4 hover:shadow-hover transition-shadow">
          <CreditCard className="w-6 h-6 shrink-0" aria-hidden="true" />
          <div>
            <b className="font-extrabold block">Cadastre sua empresa</b>
            <span className="text-sm text-muted-foreground">Compre com CNPJ e acompanhe seus pedidos.</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
