import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { WHATSAPP_URL } from "@/lib/company";
import { products } from "@/data/products";
import { authPagePath } from "@/lib/authReturn";

// Product shown in the banner; its photo and starting price come from the catalog.
const spotlight = products.find((p) => p.id === "envelope-cinza")!;

// three.js only loads when it will be used, so the first paint stays light.
const Envelope3D = lazy(() => import("./Envelope3D"));

function canShow3D() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

export function HeroSection() {
  const { user } = useAuth();
  const [use3D, setUse3D] = useState(false);
  const [ready3D, setReady3D] = useState(false);
  useEffect(() => setUse3D(canShow3D()), []);

  return (
    <section aria-labelledby="home-heading" className="h-full rounded-3xl bg-primary text-primary-foreground p-6 md:p-8 xl:p-10 grid sm:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
      {/* Main tile */}
      <div className="min-w-0">
        <div className="relative">
          <span className="text-xs font-bold uppercase tracking-wider text-beige">
            Atacado B2B · Joinville/SC
          </span>
          <h1 id="home-heading" className="mt-4 text-3xl md:text-4xl 2xl:text-[44px] font-extrabold leading-[1.1] tracking-tight text-primary-foreground">
            Embalagens para o próximo envio.
          </h1>
          <p className="mt-4 text-white/80 max-w-md leading-relaxed">
            Envelopes de segurança no atacado, com preço por quantidade e nota fiscal para sua empresa.
          </p>
        </div>
        <div className="mt-6 flex flex-col items-start gap-2">
          <a
            href="#materiais"
            className="inline-flex justify-center items-center gap-2 bg-beige text-navy font-bold px-5 py-3.5 rounded-xl hover:bg-beige-light transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Escolher embalagens <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
          {!user && (
            <Link to={authPagePath("/cadastro", "/produtos")} className="inline-flex items-center min-h-11 text-sm text-white/90 underline underline-offset-4 hover:text-white focus-visible:ring-2 focus-visible:ring-white rounded">
              Cadastre sua empresa
            </Link>
          )}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-11 text-sm text-white/80 hover:text-white focus-visible:ring-2 focus-visible:ring-white rounded"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" /> WhatsApp
          </a>
        </div>
      </div>

      <div className="min-w-0 rounded-2xl overflow-hidden bg-white">
        {/* The photo stays underneath until the 3D envelope draws its first frame (or for good, without WebGL). */}
        <div className="relative aspect-[4/3] bg-[#ebebeb]">
          <img
            src={spotlight.image}
            alt={spotlight.name}
            width={1200}
            height={900}
            className={`w-full h-full object-cover transition-opacity duration-500 ${ready3D ? "opacity-0" : "opacity-100"}`}
          />
          {use3D && (
            <Suspense fallback={null}>
              <Envelope3D onReady={() => setReady3D(true)} />
            </Suspense>
          )}
        </div>
        <Link to={`/produtos?produto=${encodeURIComponent(spotlight.id)}`} className="flex items-center min-h-11 px-4 py-3 text-sm text-navy font-semibold hover:underline underline-offset-4 focus-visible:ring-4 focus-visible:ring-beige focus-visible:ring-inset">
          {spotlight.name} <ArrowRight className="inline w-4 h-4 ml-1" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
