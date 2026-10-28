import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";

const NotFound = () => (
  <Layout>
    <SEO title="Página não encontrada — FNZ Supply" description="A página que você procura não existe." path="/404" />
    <section className="container-custom pt-4">
      <div className="tile p-10 md:p-16 text-center max-w-2xl mx-auto">
        <span className="w-14 h-14 rounded-2xl bg-muted grid place-items-center mx-auto">
          <Search className="w-6 h-6" aria-hidden="true" />
        </span>
        <p className="mt-6 text-sm font-bold text-muted-foreground">Erro 404</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">Página não encontrada</h1>
        <p className="mt-3 text-muted-foreground">O endereço pode ter mudado ou não existe mais.</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="inline-flex justify-center items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3.5 rounded-xl hover:bg-navy-light transition-colors">
            Voltar ao início
          </Link>
          <Link to="/produtos" className="inline-flex justify-center items-center gap-2 ring-1 ring-black/10 font-bold px-6 py-3.5 rounded-xl hover:bg-muted transition-colors">
            Ver produtos <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  </Layout>
);

export default NotFound;
