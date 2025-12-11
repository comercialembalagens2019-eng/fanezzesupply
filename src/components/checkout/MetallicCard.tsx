import { cn } from "@/lib/utils";

interface MetallicCardProps {
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  isFlipped?: boolean;
  cvv?: string;
}

export const MetallicCard = ({ 
  cardNumber, 
  cardName, 
  cardExpiry, 
  isFlipped = false,
  cvv = "•••"
}: MetallicCardProps) => {
  return (
    <div className="perspective-1000 w-full max-w-[340px] mx-auto">
      <div 
        className={cn(
          "relative w-full h-[200px] transition-transform duration-700 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of Card */}
        <div 
          className={cn(
            "absolute inset-0 rounded-2xl p-6 backface-hidden",
            "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900",
            "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]",
            "border border-slate-600/30"
          )}
          style={{ 
            backfaceVisibility: 'hidden',
            background: `
              linear-gradient(135deg, 
                #2d3748 0%, 
                #1a202c 25%, 
                #2d3748 50%, 
                #1a202c 75%, 
                #2d3748 100%
              )
            `
          }}
        >
          {/* Metallic Shine Effect */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
            style={{
              background: `
                linear-gradient(
                  125deg,
                  transparent 0%,
                  transparent 40%,
                  rgba(255,255,255,0.4) 45%,
                  rgba(255,255,255,0.1) 50%,
                  transparent 55%,
                  transparent 100%
                )
              `
            }}
          />
          
          {/* Card Chip */}
          <div className="absolute top-6 left-6">
            <div 
              className="w-12 h-9 rounded-md"
              style={{
                background: `
                  linear-gradient(135deg, 
                    #ffd700 0%, 
                    #f0c14b 25%, 
                    #ffd700 50%, 
                    #daa520 75%, 
                    #b8860b 100%
                  )
                `,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
              }}
            >
              {/* Chip Lines */}
              <div className="absolute inset-1 grid grid-cols-3 gap-0.5">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-gradient-to-br from-amber-600/50 to-amber-800/50 rounded-sm"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Contactless Icon */}
          <div className="absolute top-6 right-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-slate-400">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="currentColor" opacity="0.3"/>
              <path d="M8.65 8.65a5.5 5.5 0 0 1 7.78 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M6.5 6.5a8 8 0 0 1 11.31 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M10.88 10.88a3 3 0 0 1 4.24 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Card Number */}
          <div className="absolute top-[85px] left-6 right-6">
            <p 
              className="text-xl tracking-[0.2em] font-mono text-slate-100"
              style={{ 
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                letterSpacing: '0.25em'
              }}
            >
              {cardNumber || "•••• •••• •••• ••••"}
            </p>
          </div>

          {/* Card Holder Name */}
          <div className="absolute bottom-6 left-6">
            <p className="text-[10px] uppercase text-slate-500 mb-1">Titular do Cartão</p>
            <p 
              className="text-sm font-semibold uppercase tracking-wider text-slate-100 truncate max-w-[180px]"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
              {cardName || "SEU NOME"}
            </p>
          </div>

          {/* Expiry Date */}
          <div className="absolute bottom-6 right-6 text-right">
            <p className="text-[10px] uppercase text-slate-500 mb-1">Validade</p>
            <p 
              className="text-sm font-semibold tracking-wider text-slate-100"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
              {cardExpiry || "MM/AA"}
            </p>
          </div>

          {/* Brand Logo Area */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-red-500/80" />
              <div className="w-8 h-8 rounded-full bg-yellow-500/80 -ml-4" />
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div 
          className={cn(
            "absolute inset-0 rounded-2xl backface-hidden rotate-y-180",
            "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900",
            "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
          )}
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `
              linear-gradient(135deg, 
                #2d3748 0%, 
                #1a202c 25%, 
                #2d3748 50%, 
                #1a202c 75%, 
                #2d3748 100%
              )
            `
          }}
        >
          {/* Magnetic Stripe */}
          <div className="absolute top-8 left-0 right-0 h-12 bg-slate-950" />
          
          {/* CVV Area */}
          <div className="absolute top-24 left-6 right-6">
            <div className="bg-slate-200 rounded px-4 py-2 flex items-center justify-end">
              <span className="font-mono text-slate-900 tracking-widest">
                {cvv}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 text-right">CVV</p>
          </div>

          {/* Info Text */}
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-[8px] text-slate-500 leading-relaxed">
              Este cartão é de propriedade do banco emissor e deve ser devolvido 
              mediante solicitação. O uso deste cartão está sujeito aos termos e 
              condições do contrato.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
