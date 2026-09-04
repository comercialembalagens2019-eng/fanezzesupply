import logoAsset from "@/assets/fnz-supply-logo.png.asset.json";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <img
      src={logoAsset.url}
      alt="FNZ Supply"
      className={cn("block h-auto object-contain", className)}
    />
  );
}