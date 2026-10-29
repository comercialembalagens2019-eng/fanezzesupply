import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container-custom py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div className="space-y-3">
          <Link to="/" className="flex items-center" aria-label="FNZ Supply — início">
            <Logo className="h-9" />
          </Link>
          <p className="text-muted-foreground leading-relaxed">
            Distribuição de embalagens para empresas, com nota fiscal e preço de atacado.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-display font-bold text-base text-foreground">Navegação</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/produtos" className="hover:text-foreground transition-colors">Produtos</Link></li>
            <li><Link to="/pedidos" className="hover:text-foreground transition-colors">Meus pedidos</Link></li>
            <li><Link to="/cadastro" className="hover:text-foreground transition-colors">Cadastre sua empresa</Link></li>
            <li><Link to="/sobre" className="hover:text-foreground transition-colors">Sobre nós</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="font-display font-bold text-base text-foreground">Contato</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <a href="tel:+5547991490027" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Phone className="w-4 h-4" aria-hidden="true" /> (47) 99149-0027
              </a>
            </li>
            <li>
              <a href="mailto:vendas@fnzsupply.com.br" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" aria-hidden="true" /> vendas@fnzsupply.com.br
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              Av. Antonio Ramos Alvim, 1084 · Joinville/SC
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="font-display font-bold text-base text-foreground">Entrega</h2>
          <p className="text-muted-foreground">
            Frete grátis para Joinville. Demais localidades: R$ 19,90.
          </p>
          <p className="text-muted-foreground">Seg–Sex 8h–18h · Sáb 8h–12h</p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-custom py-5 flex flex-col sm:flex-row gap-3 justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} FNZ Supply · CNPJ 56.008.033/0001-32. Todos os direitos reservados.</span>
          <span className="flex gap-4">
            <Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
