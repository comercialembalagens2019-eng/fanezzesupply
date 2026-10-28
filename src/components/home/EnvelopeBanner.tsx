import envelopeCinzaAsset from "@/assets/envelope-cinza-banner.jpeg.asset.json";
import envelopeCoexAsset from "@/assets/envelope-coex-banner.png.asset.json";

export function EnvelopeBanner() {
  return (
    <section className="container-custom mt-10" aria-labelledby="price-tables-heading">
      <h2 id="price-tables-heading" className="text-2xl font-extrabold mb-4">Tabelas de preço</h2>
      <div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <img
            src={envelopeCoexAsset.url}
            alt="Tabela de preços do envelope COEX FNZ Supply: branco por fora e cinza por dentro"
            className="h-auto w-full rounded-3xl ring-1 ring-black/5 object-contain bg-card"
            loading="lazy"
          />
          <img
            src={envelopeCinzaAsset.url}
            alt="Tabela de preços do envelope cinza FNZ Supply para envio de e-commerce"
            className="h-auto w-full rounded-3xl ring-1 ring-black/5 object-contain bg-card"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}