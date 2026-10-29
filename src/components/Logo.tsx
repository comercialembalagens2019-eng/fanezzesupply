import logo from "@/assets/fnz-logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** On navy backgrounds the navy wordmark needs a light plate to stay readable. */
  onDark?: boolean;
}

export const Logo = ({ className, onDark }: LogoProps) => {
  const img = (
    <img src={logo} alt="FNZ Supply" width={378} height={160} className={cn("h-9 w-auto", className)} />
  );
  return onDark ? <span className="inline-flex rounded-2xl bg-white px-4 py-2.5">{img}</span> : img;
};
