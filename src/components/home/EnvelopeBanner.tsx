import envelopeCinzaAsset from "@/assets/envelope-cinza-banner.jpeg.asset.json";
import envelopeCoexAsset from "@/assets/envelope-coex-banner.png.asset.json";

export function EnvelopeBanner() {
  return (
    <section className="bg-background py-8 md:py-12" aria-label="Oferta de envelopes para e-commerce">
      <div className="container-custom">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <img
            src={envelopeCoexAsset.url}
            alt="Tabela de preços do envelope COEX FNZ Supply: branco por fora e cinza por dentro"
            className="h-auto w-full rounded-md border border-border object-contain shadow-md"
            loading="lazy"
          />
          <img
            src={envelopeCinzaAsset.url}
            alt="Tabela de preços do envelope cinza FNZ Supply para envio de e-commerce"
            className="h-auto w-full rounded-md border border-border object-contain shadow-md"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}