import Link from "next/link";
import { CheckCircle2, Cpu, ShieldCheck, Wrench } from "lucide-react";
import { HeroQuotes } from "@/components/HeroQuotes";
import { ServiceCatalog } from "@/components/ServiceCatalog";
import { ServiceQuoteForm } from "@/components/ServiceQuoteForm";
import { SERVICES } from "@/data/services";

export default function HomePage() {
  const marqueeItems = [
    ...SERVICES.map((s) => ({ href: `/servicios/${s.slug}`, title: s.title, tagline: s.tagline })),
    { href: "/productos", title: "Catálogo de Productos", tagline: "Equipos, tablets y hardware verificado en Soles (PEN)." },
    { href: "/pc-personalizada", title: "PC Personalizada", tagline: "Arma tu computadora a medida con garantía." },
  ];

  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-12 sm:pt-16 sm:pb-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <HeroQuotes />
          </div>
          <div className="lg:col-span-5">
            <ServiceQuoteForm />
          </div>
        </div>
      </section>

      <section aria-label="Carrusel de servicios" className="py-4 overflow-hidden border-y border-slate-200/70 dark:border-white/10">
        <div className="animate-marquee gap-4 px-4">
          {[...marqueeItems, ...marqueeItems].map((item, idx) => (
            <Link
              key={`${item.title}-${idx}`}
              href={item.href}
              className="liquid-glass rounded-2xl px-5 py-3.5 w-72 shrink-0 hover:border-[#007BFF]/50 transition-transform hover:-translate-y-0.5"
            >
              <div className="text-sm font-bold text-[#007BFF] dark:text-[#4DA3FF]">{item.title}</div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                {item.tagline}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <ServiceCatalog />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="liquid-glass rounded-3xl p-8 sm:p-10 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#007BFF] dark:text-[#4DA3FF]">
              Garantía eDark
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
              Diagnóstico honesto, ejecución limpia y respaldo real
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              No vendemos horas vacías ni componentes innecesarios: documentamos cada intervención,
              protegemos tus datos antes de tocar un equipo y respondemos con garantía escrita.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 text-xs font-medium text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#007BFF] shrink-0" />
                <span>Seguridad y Backups</span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Soporte en &lt; 30 min</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#007BFF] shrink-0" />
                <span>Hardware con IGV</span>
              </div>
            </div>
          </div>

          <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
            {[
              "Presupuesto previo antes de iniciar cualquier reparación o implementación",
              "Atención corporativa en Lima y consultoría/soporte remoto para todo Perú",
              "Precios transparentes en Soles (PEN) con margen e IGV incluidos",
              "Reciclaje responsable R2v3 con destrucción certificada de datos",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
