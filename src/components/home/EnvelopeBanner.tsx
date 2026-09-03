import envelopeBannerAsset from "@/assets/envelope-cinza-banner.jpeg.asset.json";

export function EnvelopeBanner() {
  return (
    <section className="bg-background py-8 md:py-12" aria-label="Oferta de envelopes para e-commerce">
      <div className="container-custom">
        <img
          src={envelopeBannerAsset.url}
          alt="Tabela de preços do envelope cinza FNZ Supply para envio de e-commerce"
          className="mx-auto h-auto w-full max-w-3xl rounded-md border border-border object-contain shadow-md"
          loading="lazy"
        />
      </div>
    </section>
  );
}