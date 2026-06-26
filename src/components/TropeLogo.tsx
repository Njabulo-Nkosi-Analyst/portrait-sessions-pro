import logoDark  from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";
import { useEffect, useState } from "react";

interface LogoProps { className?: string; }

export function Logo({ className = "h-40 w-auto" }: LogoProps) {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark") ||
    !document.documentElement.classList.contains("light")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const root = document.documentElement;
      setIsDark(
        root.classList.contains("dark") ||
        !root.classList.contains("light")
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <img
      src={isDark ? logoDark : logoLight}
      alt="Tann Media"
      className={className}
    />
  );
}

export default Logo;