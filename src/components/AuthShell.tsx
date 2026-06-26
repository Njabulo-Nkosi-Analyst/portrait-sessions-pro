import { Logo } from "@/components/TropeLogo";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/40 to-transparent" />
        <div className="relative h-full flex flex-col justify-between p-10">
          <Link to="/" className="flex items-center gap-2 text-white">
            <span className="w-8 h-8 rounded-full grid place-items-center bg-primary text-primary-foreground font-display font-bold">T</span>
           <Logo className="h-14 w-auto" />
          </Link>
          <p className="text-white font-display text-3xl font-bold max-w-sm">"Photograph what you love."</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <span className="w-8 h-8 rounded-full grid place-items-center bg-primary text-primary-foreground font-display font-bold">T</span>
            <Logo className="h-14 w-auto" />
          </Link>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
      <style>{`.input{width:100%;background:var(--input);color:var(--foreground);border:1px solid var(--border);border-radius:var(--radius-md);padding:.65rem .85rem;font-size:.875rem}.input:focus{outline:2px solid var(--primary);outline-offset:2px}`}</style>
    </div>
  );
}

export function GoogleButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="w-full btn-outline-light px-4 py-2.5 rounded-md text-sm flex items-center justify-center gap-2">
      <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2c-2 1.5-4.6 2.4-7.3 2.4-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.3 5.2C40.9 35.7 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
      {label}
    </button>
  );
}

export function Divider({ text }: { text: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">{text}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
