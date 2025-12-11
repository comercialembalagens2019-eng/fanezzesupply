import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MetallicCard, detectCardBrand, validateLuhn, CardBrand } from "./MetallicCard";
import { CreditCard, Lock, Loader2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardPaymentFormProps {
  onSubmit: () => void;
  isLoading: boolean;
  total: string;
}

export type CardType = 'credit' | 'debit';

export const CardPaymentForm = ({ onSubmit, isLoading, total }: CardPaymentFormProps) => {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [displayNumber, setDisplayNumber] = useState("");
  const [cardBrand, setCardBrand] = useState<CardBrand>('unknown');
  const [isCardValid, setIsCardValid] = useState<boolean | null>(null);
  const [isExpiryValid, setIsExpiryValid] = useState<boolean | null>(null);
  const [cardType, setCardType] = useState<CardType>('credit');

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, "");
    const matches = v.match(/(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/);
    if (!matches) return "";
    return [matches[1], matches[2], matches[3], matches[4]]
      .filter(Boolean)
      .join(" ");
  };

  // Format expiry with slash
  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length >= 3) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  // Validate expiry date (MM/YY format, must be in the future)
  const validateExpiry = (expiry: string): boolean => {
    if (expiry.length !== 5) return false;
    
    const [monthStr, yearStr] = expiry.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    
    // Validate month is 01-12
    if (month < 1 || month > 12) return false;
    
    // Get current date
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
    const currentYear = now.getFullYear() % 100; // Get last 2 digits
    
    // Check if the expiry date is in the future
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    
    return true;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = formatCardNumber(raw);
    setCardNumber(raw);
    setDisplayNumber(formatted);
    setCardBrand(detectCardBrand(raw));
    
    // Validate with Luhn when we have enough digits
    if (raw.length >= 13) {
      setIsCardValid(validateLuhn(raw));
    } else {
      setIsCardValid(null);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardName(e.target.value.toUpperCase());
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    if (formatted.length <= 5) {
      setCardExpiry(formatted);
      
      // Validate when complete
      if (formatted.length === 5) {
        setIsExpiryValid(validateExpiry(formatted));
      } else {
        setIsExpiryValid(null);
      }
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardCvv(v);
  };

  const isFormValid = cardNumber.length >= 13 && isCardValid === true && cardName.length >= 3 && cardExpiry.length === 5 && isExpiryValid === true && cardCvv.length >= 3;

  const getBrandName = (brand: CardBrand): string => {
    const names: Record<CardBrand, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      elo: 'Elo',
      hipercard: 'Hipercard',
      discover: 'Discover',
      unknown: ''
    };
    return names[brand];
  };

  return (
    <div className="space-y-6">
      {/* 3D Card Preview */}
      <div className="py-4">
        <MetallicCard
          cardNumber={displayNumber}
          cardName={cardName}
          cardExpiry={cardExpiry}
          isFlipped={isFlipped}
          cvv={cardCvv || "•••"}
          brand={cardBrand}
        />
        {/* Brand Detection Indicator */}
        {cardBrand !== 'unknown' && (
          <div className="text-center mt-3">
            <span className="text-sm text-muted-foreground">
              Cartão detectado: <span className="font-semibold text-foreground">{getBrandName(cardBrand)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Card Form */}
      <div className="space-y-4 bg-secondary/30 rounded-xl p-4 border">
        {/* Credit/Debit Selection */}
        <div>
          <Label className="mb-2 block">Tipo de Cartão</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCardType('credit')}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all font-medium",
                cardType === 'credit'
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted bg-background hover:border-primary/50 text-muted-foreground"
              )}
            >
              <CreditCard className="w-5 h-5" />
              Crédito
            </button>
            <button
              type="button"
              onClick={() => setCardType('debit')}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all font-medium",
                cardType === 'debit'
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted bg-background hover:border-primary/50 text-muted-foreground"
              )}
            >
              <CreditCard className="w-5 h-5" />
              Débito
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span>Seus dados estão protegidos</span>
        </div>

        <div>
          <Label htmlFor="cardNumber">Número do Cartão</Label>
          <div className="relative">
            <Input
              id="cardNumber"
              value={displayNumber}
              onChange={handleCardNumberChange}
              placeholder="0000 0000 0000 0000"
              className={cn(
                "pr-20 font-mono",
                isCardValid === true && "border-green-500 focus-visible:ring-green-500",
                isCardValid === false && "border-red-500 focus-visible:ring-red-500"
              )}
              maxLength={19}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isCardValid === true && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {isCardValid === false && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          {isCardValid === false && (
            <p className="text-xs text-red-500 mt-1">Número de cartão inválido</p>
          )}
          {isCardValid === true && (
            <p className="text-xs text-green-500 mt-1">Número de cartão válido</p>
          )}
        </div>

        <div>
          <Label htmlFor="cardName">Nome no Cartão</Label>
          <Input
            id="cardName"
            value={cardName}
            onChange={handleNameChange}
            placeholder="NOME COMO ESTÁ NO CARTÃO"
            className="uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cardExpiry">Validade</Label>
            <div className="relative">
              <Input
                id="cardExpiry"
                value={cardExpiry}
                onChange={handleExpiryChange}
                placeholder="MM/AA"
                className={cn(
                  "font-mono pr-10",
                  isExpiryValid === true && "border-green-500 focus-visible:ring-green-500",
                  isExpiryValid === false && "border-red-500 focus-visible:ring-red-500"
                )}
                maxLength={5}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isExpiryValid === true && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {isExpiryValid === false && (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            {isExpiryValid === false && (
              <p className="text-xs text-red-500 mt-1">Data expirada</p>
            )}
          </div>
          <div>
            <Label htmlFor="cardCvv">CVV</Label>
            <Input
              id="cardCvv"
              type="password"
              value={cardCvv}
              onChange={handleCvvChange}
              onFocus={() => setIsFlipped(true)}
              onBlur={() => setIsFlipped(false)}
              placeholder="•••"
              className="font-mono"
              maxLength={4}
            />
          </div>
        </div>

        {/* Total and Submit */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground">Total a pagar:</span>
            <span className="text-xl font-bold text-primary">{total}</span>
          </div>
          
          <Button
            onClick={onSubmit}
            disabled={!isFormValid || isLoading}
            className="w-full gap-2"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pagar {total}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
