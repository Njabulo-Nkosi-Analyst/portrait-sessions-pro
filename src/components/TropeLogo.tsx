import logoDark  from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";
import { useEffect, useState } from "react";

interface LogoProps { className?: string; }

function getIsDark() {
  const root = document.documentElement;
  return root.classList.contains("dark") || !root.classList.contains("light");
}

export function Logo({ className = "h-12 w-auto" }: LogoProps) {
  const [isDark, setIsDark] = useState(getIsDark);

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(getIsDark()));
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
      style={{ height: "48px", width: "auto" }}
    />
  );
}

export default Logo;