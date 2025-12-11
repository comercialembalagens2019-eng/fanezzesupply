import { cn } from "@/lib/utils";

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | 'discover' | 'unknown';

export const detectCardBrand = (cardNumber: string): CardBrand => {
  const num = cardNumber.replace(/\D/g, '');
  
  if (!num) return 'unknown';
  
  // Visa: starts with 4
  if (/^4/.test(num)) return 'visa';
  
  // Mastercard: starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(num) || /^2(2[2-9][1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(num)) return 'mastercard';
  
  // American Express: starts with 34 or 37
  if (/^3[47]/.test(num)) return 'amex';
  
  // Elo: Brazilian card
  if (/^(636368|636369|438935|504175|451416|636297|5067|4576|4011|506699)/.test(num)) return 'elo';
  
  // Hipercard: starts with 606282 or 3841
  if (/^(606282|3841)/.test(num)) return 'hipercard';
  
  // Discover: starts with 6011, 644-649, 65
  if (/^(6011|64[4-9]|65)/.test(num)) return 'discover';
  
  return 'unknown';
};

interface MetallicCardProps {
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  isFlipped?: boolean;
  cvv?: string;
  brand?: CardBrand;
}

const CardBrandLogo = ({ brand }: { brand: CardBrand }) => {
  switch (brand) {
    case 'visa':
      return (
        <svg viewBox="0 0 48 32" className="w-16 h-10">
          <rect fill="#1A1F71" width="48" height="32" rx="4"/>
          <path fill="#fff" d="M19.5 21h-2.9l1.8-11h2.9l-1.8 11zm12.1-10.7c-.6-.2-1.5-.5-2.6-.5-2.9 0-4.9 1.5-4.9 3.7 0 1.6 1.5 2.5 2.6 3.1 1.1.6 1.5 1 1.5 1.5 0 .8-1 1.2-1.9 1.2-1.2 0-1.9-.2-2.9-.6l-.4-.2-.4 2.6c.7.3 2.1.6 3.5.6 3.1 0 5.1-1.5 5.1-3.8 0-1.3-.8-2.3-2.5-3.1-1-.5-1.6-.9-1.6-1.4 0-.5.5-1 1.7-1 1 0 1.7.2 2.2.4l.3.1.4-2.6zm7.5-.3h-2.3c-.7 0-1.2.2-1.5.9l-4.3 10.1h3.1l.6-1.7h3.7l.4 1.7h2.7l-2.4-11zm-3.6 7.1l1.2-3.2c0 0 .2-.7.4-1.1l.2 1 .7 3.3h-2.5zm-17.4-7.1l-2.8 7.5-.3-1.5c-.5-1.8-2.2-3.7-4-4.6l2.6 9.6h3.1l4.6-11h-3.2z"/>
          <path fill="#F7B600" d="M13.5 10h-4.7l-.1.3c3.7.9 6.1 3.2 7.1 5.9l-1-5.2c-.2-.7-.7-.9-1.3-1z"/>
        </svg>
      );
    case 'mastercard':
      return (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-red-500" />
          <div className="w-8 h-8 rounded-full bg-yellow-500 -ml-3" />
        </div>
      );
    case 'amex':
      return (
        <svg viewBox="0 0 48 32" className="w-16 h-10">
          <rect fill="#016FD0" width="48" height="32" rx="4"/>
          <path fill="#fff" d="M24 8l-8 8 8 8 8-8-8-8zm-2 4h4v2h-4v-2zm0 3h4v2h-4v-2z"/>
          <text x="24" y="26" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">AMEX</text>
        </svg>
      );
    case 'elo':
      return (
        <div className="bg-slate-900 rounded px-2 py-1">
          <span className="text-yellow-400 font-bold text-sm tracking-wider">elo</span>
        </div>
      );
    case 'hipercard':
      return (
        <div className="bg-red-600 rounded px-2 py-1">
          <span className="text-white font-bold text-xs">HIPERCARD</span>
        </div>
      );
    case 'discover':
      return (
        <div className="bg-orange-500 rounded px-2 py-1">
          <span className="text-white font-bold text-xs">DISCOVER</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1 opacity-30">
          <div className="w-6 h-6 rounded-full bg-slate-400" />
          <div className="w-6 h-6 rounded-full bg-slate-500 -ml-2" />
        </div>
      );
  }
};

export const MetallicCard = ({ 
  cardNumber, 
  cardName, 
  cardExpiry, 
  isFlipped = false,
  cvv = "•••",
  brand = 'unknown'
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
              className="w-12 h-9 rounded-md relative overflow-hidden"
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
          <div className="absolute top-6 left-20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-slate-400">
              <path d="M8.65 8.65a5.5 5.5 0 0 1 7.78 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M6.5 6.5a8 8 0 0 1 11.31 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M10.88 10.88a3 3 0 0 1 4.24 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Brand Logo - Top Right */}
          <div className="absolute top-5 right-5">
            <CardBrandLogo brand={brand} />
          </div>

          {/* Card Number */}
          <div className="absolute top-[90px] left-6 right-6">
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
