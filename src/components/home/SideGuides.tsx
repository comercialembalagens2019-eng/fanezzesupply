import antesDeComprar from "@/assets/guia-antes-de-comprar.webp";
import naHoraDeEmbalar from "@/assets/guia-na-hora-de-embalar.webp";

// Packing tips in the empty side margins of very wide screens. The pictures are small,
// so they stay at their natural size and only appear where there is room for them.
export function SideGuides() {
  return (
    <>
      <aside
        aria-label="Antes de comprar"
        className="hidden min-[2080px]:block absolute top-0 bottom-0 right-full mr-8 w-[268px]"
      >
        <a
          href="#guia-de-tamanhos"
          className="sticky top-[calc(var(--header-height)+24px)] block tile p-2 hover:shadow-hover transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src={antesDeComprar}
            width={252}
            height={269}
            loading="lazy"
            alt="Antes de comprar: 1. Meça seu produto, conferindo largura, altura e espessura da peça. 2. Reserve espaço para fechar, deixando alguns centímetros a mais para o lacre. Ver medidas."
            className="w-[252px] h-auto rounded-2xl"
          />
        </a>
      </aside>
      <aside
        aria-label="Na hora de embalar"
        className="hidden min-[2080px]:block absolute top-0 bottom-0 left-full ml-8 w-[392px]"
      >
        <div className="sticky top-[calc(var(--header-height)+24px)] tile p-2">
          <img
            src={naHoraDeEmbalar}
            width={376}
            height={265}
            loading="lazy"
            alt="Na hora de embalar: 3. Acomode o produto, colocando a peça dentro do envelope. 4. Feche o lacre, retirando a película e pressionando para fechar. Tudo pronto para enviar."
            className="w-[376px] h-auto rounded-2xl"
          />
        </div>
      </aside>
    </>
  );
}
