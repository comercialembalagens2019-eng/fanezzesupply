import { Link } from "react-router-dom";
import { Package, Phone, Mail, MapPin, Instagram } from "lucide-react";
export function Footer() {
  return <footer className="bg-primary text-primary-foreground">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-beige flex items-center justify-center">
                <Package className="w-6 h-6 text-navy" />
              </div>
              <span className="font-display font-bold text-xl">
                Fanezze Supply
              </span>
            </Link>
            <p className="text-beige/80 text-sm leading-relaxed">
              Distribuição de embalagens com qualidade para sua empresa.
            </p>
            <div className="flex items-center gap-2 text-sm bg-beige/10 rounded-lg px-3 py-2 mt-2">
              <MapPin className="w-4 h-4 text-beige/60" />
              <span className="text-beige/80 font-medium">Somente retirada no local</span>
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
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-beige/60 mt-0.5" />
                <span className="text-beige/80">
                  Avenida Antonio Ramos Alvin, 1084<br />
                  Joinville - SC
                </span>
              </li>
            </ul>
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-lg">Horário de Atendimento</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between text-beige/80">
                <span>Segunda - Sexta:</span>
                <span>08h às 18h</span>
              </li>
              <li className="flex justify-between text-beige/80">
                <span>Sábado:</span>
                <span>08h às 12h</span>
              </li>
              <li className="flex justify-between text-beige/80">
                <span>Domingo:</span>
                <span>Fechado</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-8 pt-8 border-t border-beige/10">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 space-y-2">
              <h4 className="font-display font-semibold text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-beige/60" />
                Retire seu pedido aqui
              </h4>
              <p className="text-beige/80 text-sm">
                Avenida Antonio Ramos Alvin, 1084 - Joinville, SC
              </p>
              <p className="text-beige/60 text-xs">
                Somente retirada no local • Não realizamos entregas
              </p>
            </div>
            <div className="w-full lg:w-96 h-48 rounded-lg overflow-hidden border border-beige/20">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3578.5!2d-48.8494!3d-26.3044!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94de907b0a7e5b6f%3A0x0!2sAv.%20Antonio%20Ramos%20Alvim%2C%201084%20-%20Joinville%2C%20SC!5e0!3m2!1spt-BR!2sbr!4v1" width="100%" height="100%" style={{
              border: 0
            }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Localização Fanezze Supply" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-beige/10">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-beige/60">
            <p>© 2024 Fanezze Supply. Todos os direitos reservados.</p>
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