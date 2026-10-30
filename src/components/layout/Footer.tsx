import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { COMPANY, MAPS_URL, WHATSAPP_URL } from "@/lib/company";

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
            <li><Link to="/contato" className="hover:text-foreground transition-colors">Contato</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="font-display font-bold text-base text-foreground">Contato</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <MessageCircle className="w-4 h-4" aria-hidden="true" /> WhatsApp {COMPANY.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" aria-hidden="true" /> {COMPANY.email}
              </a>
            </li>
            <li>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-foreground transition-colors">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                {COMPANY.shortAddress}
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="font-display font-bold text-base text-foreground">Entrega</h2>
          <p className="text-muted-foreground">
            Frete grátis para Joinville. Demais localidades: R$ 19,90.
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" aria-hidden="true" /> {COMPANY.hours}
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-custom py-5 flex flex-col sm:flex-row gap-3 justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} FNZ Supply · CNPJ {COMPANY.cnpj}. Todos os direitos reservados.</span>
          <span className="flex gap-4">
            <Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
