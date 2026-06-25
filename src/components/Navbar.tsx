import { Link } from "@tanstack/react-router";
import { Menu, X, Heart, Phone, MessageCircle, Instagram, Mail, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useFavourites } from "@/hooks/useFavourites";
import { Logo } from "@/components/TropeLogo";

const links = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Gallery" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

function useDarkMode() {
  const [dark, setDark] = useState(true);
  const toggle = () => {
    const root = document.documentElement;
    const isCurrentlyDark = root.classList.contains("dark") || !root.classList.contains("light");
    if (isCurrentlyDark) {
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem("theme", "light");
      setDark(false);
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDark(true);
    }
  };
  return { dark, toggle };
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useFavourites();
  const { dark, toggle } = useDarkMode();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 lg:px-8 h-20 lg:h-24">
        <Link to="/" className="flex items-center leading-none py-2">
          <Logo />
        </Link>
        <nav className="hidden lg:flex items-center gap-8">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium tracking-wide"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          <Link to="/favourites" className="relative text-muted-foreground hover:text-foreground transition-colors" aria-label="Favourites">
            <Heart size={18} className={count > 0 ? "fill-primary text-primary" : ""} />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] min-w-[16px] h-[16px] rounded-full px-1 grid place-items-center font-bold">
                {count}
              </span>
            )}
          </Link>
          <button onClick={toggle} aria-label="Toggle dark mode"
            className="w-9 h-9 rounded-full border border-border bg-secondary/60 grid place-items-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <ContactPopover />
          {user ? (
            <>
              <Link to={isAdmin ? "/admin" : "/dashboard"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {isAdmin ? "Admin" : "Dashboard"}
              </Link>
              <button onClick={() => signOut()} className="text-sm text-muted-foreground hover:text-red-500 transition-colors">
                Log out
              </button>
            </>
          ) : (
            <Link to="/sign-in" search={{}} className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          )}
          <Link to="/contact" search={{}} className="btn-lime px-5 py-2.5 rounded-md text-sm font-semibold tracking-wide">Book Session</Link>
        </div>
        <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border px-5 py-4 space-y-3 bg-background">
          {links.map(l => (
            <Link key={l.to} to={l.to} className="block text-base" onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <Link to="/favourites" onClick={() => setOpen(false)} className="block text-base inline-flex items-center gap-2">
            <Heart size={14} className={count > 0 ? "fill-primary text-primary" : ""} />
            Favourites {count > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
          </Link>
          <div className="pt-3 border-t border-border grid grid-cols-3 gap-2">
            <a href="tel:0714967968" className="panel p-2 text-center text-xs"><Phone size={14} className="mx-auto mb-1" />Call</a>
            <a href="https://wa.me/27714967968" target="_blank" rel="noreferrer" className="panel p-2 text-center text-xs"><MessageCircle size={14} className="mx-auto mb-1" />WhatsApp</a>
            <a href="https://instagram.com/tannphotography" target="_blank" rel="noreferrer" className="panel p-2 text-center text-xs"><Instagram size={14} className="mx-auto mb-1" />Instagram</a>
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <button onClick={toggle} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {dark ? <Sun size={14} /> : <Moon size={14} />}
              {dark ? "Light Mode" : "Dark Mode"}
            </button>
            {user ? (
              <>
                <Link to={isAdmin ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">
                  {isAdmin ? "Admin" : "Dashboard"}
                </Link>
                <button onClick={() => { signOut(); setOpen(false); }} className="text-sm text-red-500 hover:text-red-400 transition-colors">
                  Log out
                </button>
              </>
            ) : (
              <Link to="/sign-in" search={{}} onClick={() => setOpen(false)} className="text-sm">Sign in</Link>
            )}
            <Link to="/contact" search={{}} onClick={() => setOpen(false)} className="btn-lime px-4 py-2 rounded-md text-sm">Book Now</Link>
          </div>
        </div>
      )}
    </header>
  );
}

function ContactPopover() {
  return (
    <div className="relative group">
      <button aria-label="Contact"
        className="w-9 h-9 rounded-full border border-border bg-secondary/60 grid place-items-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
        <Phone size={15} />
      </button>
      <div className="absolute right-0 top-full pt-3 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
        <div className="panel p-3 w-64 shadow-xl">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold">Get in touch</div>
          <div className="space-y-1">
            <a href="tel:0714967968" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary transition-colors text-sm">
              <span className="w-7 h-7 rounded-full bg-primary/15 text-primary grid place-items-center"><Phone size={13} /></span>
              <span><span className="block font-semibold">Call</span><span className="text-xs text-muted-foreground">071 496 7968</span></span>
            </a>
            <a href="tel:0815051466" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary transition-colors text-sm">
              <span className="w-7 h-7 rounded-full bg-primary/15 text-primary grid place-items-center"><Phone size={13} /></span>
              <span><span className="block font-semibold">Call</span><span className="text-xs text-muted-foreground">081 505 1466</span></span>
            </a>
            <a href="https://wa.me/27714967968" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary transition-colors text-sm">
              <span className="w-7 h-7 rounded-full bg-primary/15 text-primary grid place-items-center"><MessageCircle size={13} /></span>
              <span><span className="block font-semibold">WhatsApp</span><span className="text-xs text-muted-foreground">Chat now</span></span>
            </a>
            <a href="https://instagram.com/tannphotography" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary transition-colors text-sm">
              <span className="w-7 h-7 rounded-full bg-primary/15 text-primary grid place-items-center"><Instagram size={13} /></span>
              <span><span className="block font-semibold">Instagram</span><span className="text-xs text-muted-foreground">@tannphotography</span></span>
            </a>
            <a href="mailto:tannphotography23@gmail.com" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary transition-colors text-sm">
              <span className="w-7 h-7 rounded-full bg-primary/15 text-primary grid place-items-center"><Mail size={13} /></span>
              <span><span className="block font-semibold">Email</span><span className="text-xs text-muted-foreground">tannphotography23@gmail.com</span></span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
