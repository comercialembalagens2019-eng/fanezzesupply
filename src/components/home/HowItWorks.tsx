import { Calculator, PackageSearch, Truck } from "lucide-react";

const steps = [
  { icon: PackageSearch, title: "Escolha suas embalagens", text: "Material e tamanho certos para o que você envia." },
  { icon: Calculator, title: "Calcule quantidade e preço", text: "O preço por unidade cai conforme a quantidade." },
  { icon: Truck, title: "Finalize e acompanhe", text: "Pague por Pix, boleto ou cartão e acompanhe em Meus pedidos." },
];

export function HowItWorks() {
  return (
    <section className="container-custom mt-12" aria-labelledby="how-heading">
      <h2 id="how-heading" className="text-2xl md:text-3xl font-extrabold mb-5">Como funciona</h2>
      <ol className="grid gap-3 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="tile p-6 flex md:flex-col gap-4">
            <span className="relative w-12 h-12 rounded-xl bg-primary text-beige grid place-items-center shrink-0">
              <step.icon className="w-5 h-5" aria-hidden="true" />
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-beige text-navy text-xs font-extrabold grid place-items-center">
                {i + 1}
              </span>
            </span>
            <span>
              <b className="block font-extrabold text-lg">{step.title}</b>
              <span className="block text-sm text-muted-foreground mt-1">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
