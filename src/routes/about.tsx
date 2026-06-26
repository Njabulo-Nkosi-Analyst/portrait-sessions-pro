import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Phone } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Tann media" }] }),
  component: About,
});

function About() {
  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <div className="absolute -inset-4 border border-primary/40 rounded-2xl" />
          <img src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=900&q=80"
            alt="Photographer at work" className="relative w-full aspect-[3/4] object-cover rounded-xl" />
          <div className="absolute -bottom-6 -right-2 lg:right-6 panel bg-primary text-primary-foreground p-5 rounded-xl">
            <div className="font-display text-4xl font-bold">2+</div>
            <div className="text-sm font-semibold">Years of Experience</div>
          </div>
        </div>
        <div>
          <span className="eyebrow">About me</span>
          <h1 className="mt-4 font-display text-5xl md:text-6xl font-bold leading-[1.05]">
            Design studio<br />with <span className="text-gradient-warm">digital focus.</span>
          </h1>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            We shoot many different types of photography — portrait, landscape, commercial, event and editorial. Each session is approached with care, technical precision and a cinematic eye, so your story is told with the depth it deserves.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[{ n: "500+", l: "Sessions" }, { n: "6", l: "Cities covered" }, { n: "2+", l: "Years" }].map(s => (
              <div key={s.l} className="panel p-4 text-center">
                <div className="font-display text-2xl font-bold text-gradient-warm">{s.n}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-4 flex-wrap">
            <Link to="/contact" search={{}} className="btn-outline-light px-6 py-3 rounded-md text-sm">Book Me</Link>
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-primary text-primary-foreground grid place-items-center"><Phone size={16} /></span>
              <div>
                <div className="text-xs text-muted-foreground">Need help?</div>
                <div className="font-semibold text-sm">071 496 7968 / 072 251 6358</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-32 text-center">
        <h2 className="font-display text-4xl md:text-5xl font-bold">Let's <span className="text-gradient-warm">work together.</span></h2>
        <Link to="/contact" search={{}} className="mt-6 inline-flex btn-lime px-6 py-3 rounded-md text-sm">Start a project</Link>
      </section>
    </Layout>
  );
}