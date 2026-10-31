import antesDeComprar from "@/assets/guia-antes-de-comprar.webp";
import naHoraDeEmbalar from "@/assets/guia-na-hora-de-embalar.webp";

// Packing tips stacked in the left margin of very wide screens. The column needs 332px
// (32px gap + 300px card) beside the 1440px content: (2104 - 1440) / 2 = 332.
export function SideGuides() {
  return (
    <aside
      aria-label="Dicas de embalagem"
      className="hidden min-[2104px]:block absolute top-0 bottom-0 right-full mr-8 w-[300px]"
    >
      <div className="sticky top-[calc(var(--header-height)+24px)] space-y-4">
        <a
          href="#guia-de-tamanhos"
          className="block tile p-2 hover:shadow-hover transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src={antesDeComprar}
            width={600}
            height={644}
            loading="lazy"
            alt="Antes de comprar: 1. Meça seu produto, conferindo largura, altura e espessura da peça. 2. Reserve espaço para fechar, deixando alguns centímetros a mais para o lacre. Ver medidas."
            className="w-full h-auto rounded-2xl"
          />
        </a>
        <div className="tile p-2">
          <img
            src={naHoraDeEmbalar}
            width={376}
            height={265}
            loading="lazy"
            alt="Na hora de embalar: 3. Acomode o produto, colocando a peça dentro do envelope. 4. Feche o lacre, retirando a película e pressionando para fechar. Tudo pronto para enviar."
            className="w-full h-auto rounded-2xl"
          />
        </div>
      </div>
    </aside>
  );
}
