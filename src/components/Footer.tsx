import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Linkedin, Twitter } from "lucide-react";
import { Logo } from "@/components/TropeLogo";

const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.15 8.15 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/>
  </svg>
);

export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16 grid gap-12 lg:grid-cols-4">
        <div>
          <Link to="/" className="inline-flex mb-4"><Logo /></Link>
          <p className="text-sm text-muted-foreground max-w-xs">Your moments, cinematically told. Photography &amp; videography for the stories that matter.</p>
          <div className="flex items-center gap-3 mt-6">
            <a href="https://www.facebook.com/tannphotography" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary grid place-items-center hover:bg-primary hover:text-primary-foreground transition-colors"><Facebook size={16} /></a>
            <a href="https://twitter.com/tannphotography" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary grid place-items-center hover:bg-primary hover:text-primary-foreground transition-colors"><Twitter size={16} /></a>
            <a href="https://instagram.com/tannphotography" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary grid place-items-center hover:bg-primary hover:text-primary-foreground transition-colors"><Instagram size={16} /></a>
            <a href="https://www.tiktok.com/@tann.media" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary grid place-items-center hover:bg-primary hover:text-primary-foreground transition-colors"><TikTokIcon /></a>
          </div>
        </div>
        <div>
          <h4 className="font-display text-base mb-4 tracking-[0.08em]">PAGES</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/gallery" className="hover:text-foreground">Gallery</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/contact" search={{}} className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-base mb-4 tracking-[0.08em]">GET IN TOUCH</h4>
          <p className="text-sm text-muted-foreground">Gauteng, South Africa</p>
          <a href="https://instagram.com/tannphotography" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground block">@tannphotography</a>
          <a href="https://www.tiktok.com/@tann.media" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground block">@tann.media (TikTok)</a>
          <a href="tel:0714967968" className="text-sm text-muted-foreground hover:text-foreground block">071 496 7968</a>
          <a href="tel:0815051466" className="text-sm text-muted-foreground hover:text-foreground block">081 505 1466</a>
          <a href="mailto:tannphotography23@gmail.com" className="text-sm text-muted-foreground hover:text-foreground block">tannphotography23@gmail.com</a>
        </div>
        <div>
          <h4 className="font-display text-base mb-4 tracking-[0.08em]">BANK DETAILS</h4>
          <p className="text-sm text-muted-foreground">FNB</p>
          <p className="text-sm text-muted-foreground">W. Maluleka</p>
          <p className="text-sm text-muted-foreground">Acc No. 63052599968</p>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} <span className="text-primary">TANN</span> MEDIA. All rights reserved.
      </div>
    </footer>
  );
}