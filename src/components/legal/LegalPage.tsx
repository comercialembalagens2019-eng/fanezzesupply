import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";

// Identification shown on legal pages. Fill in razão social and CNPJ to complete them.
export const COMPANY = {
  name: "FNZ Supply",
  legalName: null as string | null,
  cnpj: null as string | null,
  address: "Av. Antonio Ramos Alvin, 1084 · Joinville/SC",
  email: "vendas@fnzsupply.com.br",
  phone: "(47) 99149-0027",
};

export const LEGAL_UPDATED_AT = "29/10/2026";

interface LegalPageProps {
  title: string;
  description: string;
  path: string;
  sections: { id: string; title: string; body: ReactNode }[];
}

export function LegalPage({ title, description, path, sections }: LegalPageProps) {
  return (
    <Layout>
      <SEO title={`${title} — ${COMPANY.name}`} description={description} path={path} />
      <section className="container-custom pt-4">
        <div className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary-foreground">{title}</h1>
          <p className="mt-3 text-white/75">Última atualização: {LEGAL_UPDATED_AT}</p>
        </div>
      </section>

      <section className="container-custom mt-4 grid gap-4 lg:grid-cols-[260px_1fr] items-start">
        <nav className="tile p-5 lg:sticky lg:top-20" aria-label="Seções">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Nesta página</p>
          <ol className="space-y-2 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-5 pt-4 border-t border-border text-sm text-muted-foreground">
            Veja também:{" "}
            {path === "/termos" ? (
              <Link to="/privacidade" className="font-semibold text-foreground underline underline-offset-4">Política de Privacidade</Link>
            ) : (
              <Link to="/termos" className="font-semibold text-foreground underline underline-offset-4">Termos de Uso</Link>
            )}
          </p>
        </nav>

        <article className="tile p-6 md:p-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-extrabold text-foreground">
                {i + 1}. {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </article>
      </section>
    </Layout>
  );
}

export function CompanyIdentification() {
  return (
    <ul className="list-disc pl-5 space-y-1">
      <li>
        {COMPANY.legalName ?? COMPANY.name}
        {COMPANY.cnpj && <>, CNPJ {COMPANY.cnpj}</>}
      </li>
      <li>Endereço: {COMPANY.address}</li>
      <li>
        E-mail: <a href={`mailto:${COMPANY.email}`} className="text-foreground underline underline-offset-4">{COMPANY.email}</a>
      </li>
      <li>Telefone/WhatsApp: {COMPANY.phone}</li>
    </ul>
  );
}
