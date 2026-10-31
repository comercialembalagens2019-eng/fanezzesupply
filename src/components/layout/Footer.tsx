import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { COMPANY, MAPS_URL, WHATSAPP_URL } from "@/lib/company";

const navLinks = [
  { to: "/produtos", label: "Produtos" },
  { to: "/#personalizados", label: "Personalizados" },
  { to: "/pedidos", label: "Meus pedidos" },
  { to: "/cadastro", label: "Cadastre sua empresa" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
];

const linkClass = "inline-flex items-center min-h-11 hover:underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Footer() {
  return (
    <footer className="mt-16">
      <div className="container-custom">
        <div className="border-t border-border py-6 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-10">
          <Link to="/" className="flex items-center w-fit rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="FNZ Supply — início">
            <Logo className="h-10" />
          </Link>
          <nav aria-label="Rodapé" className="flex flex-wrap gap-x-8 gap-y-0 text-[15px] font-semibold text-primary lg:mx-auto">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className={linkClass}>{l.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-4 text-[15px] font-semibold text-primary lg:border-l lg:border-border lg:pl-8">
            <Link to="/termos" className={linkClass}>Termos de uso</Link>
            <span className="w-px h-4 bg-border" aria-hidden="true" />
            <Link to="/privacidade" className={linkClass}>Privacidade</Link>
          </div>
        </div>
        <div className="border-t border-border py-5 text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
          <span>© {new Date().getFullYear()} FNZ Supply · CNPJ {COMPANY.cnpj}</span>
          <span aria-hidden="true">·</span>
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">{COMPANY.shortAddress}</a>
          <span aria-hidden="true">·</span>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">WhatsApp {COMPANY.phone}</a>
          <span aria-hidden="true">·</span>
          <a href={`mailto:${COMPANY.email}`} className="hover:text-foreground">{COMPANY.email}</a>
          <span aria-hidden="true">·</span>
          <span>{COMPANY.hours}. Frete grátis em Joinville; demais localidades R$ 19,90.</span>
        </div>
      </div>
    </footer>
  );
}
