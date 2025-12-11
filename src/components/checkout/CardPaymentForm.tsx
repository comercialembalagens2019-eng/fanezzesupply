import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MetallicCard } from "./MetallicCard";
import { CreditCard, Lock, Loader2 } from "lucide-react";

interface CardPaymentFormProps {
  onSubmit: () => void;
  isLoading: boolean;
  total: string;
}

export const CardPaymentForm = ({ onSubmit, isLoading, total }: CardPaymentFormProps) => {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [displayNumber, setDisplayNumber] = useState("");

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

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = formatCardNumber(raw);
    setCardNumber(raw);
    setDisplayNumber(formatted);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardName(e.target.value.toUpperCase());
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    if (formatted.length <= 5) {
      setCardExpiry(formatted);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardCvv(v);
  };

  const isFormValid = cardNumber.length >= 13 && cardName.length >= 3 && cardExpiry.length === 5 && cardCvv.length >= 3;

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
        />
      </div>

      {/* Card Form */}
      <div className="space-y-4 bg-secondary/30 rounded-xl p-4 border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
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
              className="pr-10 font-mono"
              maxLength={19}
            />
            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
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
            <Input
              id="cardExpiry"
              value={cardExpiry}
              onChange={handleExpiryChange}
              placeholder="MM/AA"
              className="font-mono"
              maxLength={5}
            />
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
