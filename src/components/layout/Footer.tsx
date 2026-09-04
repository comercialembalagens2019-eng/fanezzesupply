import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
export function Footer() {
  return <footer className="bg-primary text-primary-foreground">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex" aria-label="FNZ Supply — início">
              <BrandLogo className="w-44" />
            </Link>
            <p className="text-beige/80 text-sm leading-relaxed">
              Distribuição de embalagens com qualidade para sua empresa.
            </p>
            <div className="flex items-center gap-2 text-sm bg-beige/10 rounded-lg px-3 py-2 mt-2">
              <MapPin className="w-4 h-4 text-beige/60" />
              <span className="text-beige/80 font-medium">Frete grátis para Joinville • R$ 19,90 demais localidades</span>
            </div>
            <div className="flex items-center gap-3">
              
              
              
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-lg">Links Úteis</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/produtos" className="text-beige/80 hover:text-beige transition-colors text-sm">
                  Nossos Produtos
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-beige/80 hover:text-beige transition-colors text-sm">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/cadastro" className="text-beige/80 hover:text-beige transition-colors text-sm">
                  Cadastre sua Empresa
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-beige/80 hover:text-beige transition-colors text-sm">
                  Fale Conosco
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-lg">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-beige/60" />
                <span className="text-beige/80">+55 (47) 99149-0027</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-beige/60" />
                <span className="text-beige/80">vendas@fnzsupply.com.br</span>
              </li>
            </ul>
          </div>
        </div>


        {/* Consulte-nos */}
        <div className="mt-8 pt-8 border-t border-beige/10">
          <div className="rounded-lg bg-beige/10 p-6 text-center">
            <p className="font-display text-xl font-bold">Consulte-nos</p>
            <p className="text-beige/80 text-sm mt-1">
              Precisa de outros produtos, quantidades maiores ou personalização? Fale com nossa equipe.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 mt-3 text-sm">
              <a href="tel:+5547991490027" className="font-semibold hover:underline">
                (47) 99149-0027
              </a>
              <a href="mailto:vendas@fnzsupply.com.br" className="font-semibold hover:underline">
                vendas@fnzsupply.com.br
              </a>
            </div>
          </div>
        </div>
      </div>


      {/* Bottom Bar */}
      <div className="border-t border-beige/10">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-beige/60">
            <p>© 2024 FNZ Supply. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              <Link to="/termos" className="hover:text-beige transition-colors">
                Termos de Uso
              </Link>
              <Link to="/privacidade" className="hover:text-beige transition-colors">
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>;
}