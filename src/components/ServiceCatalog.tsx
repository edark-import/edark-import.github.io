"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Clock, Home, Layers } from "lucide-react";
import { SERVICES, type ServiceAudience } from "@/data/services";

const FILTERS: { id: ServiceAudience; label: string }[] = [
  { id: "todos", label: "Todos los servicios (6)" },
  { id: "empresa", label: "Empresas B2B" },
  { id: "hogar", label: "Hogar & Soporte" },
];

export function ServiceCatalog() {
  const [audience, setAudience] = useState<ServiceAudience>("todos");

  const items =
    audience === "todos"
      ? SERVICES
      : SERVICES.filter((item) => item.audience === audience);

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#007BFF] dark:text-[#4DA3FF]">
            Líneas de Servicio
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
            Soluciones diseñadas para resolver y escalar
          </h2>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar servicios">
          {FILTERS.map((f) => {
            const active = audience === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setAudience(f.id)}
                className={`liquid-btn px-4 py-2 text-xs font-bold cursor-pointer ${
                  active
                    ? "bg-[#007BFF] text-white"
                    : "bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((srv) => (
          <article
            key={srv.slug}
            className="liquid-glass rounded-3xl p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:border-[#007BFF]/50"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007BFF]/10 border border-[#007BFF]/25 px-2.5 py-0.5 text-[#007BFF] dark:text-[#4DA3FF]">
                  {srv.audience === "empresa" ? (
                    <Building2 className="w-3 h-3" />
                  ) : (
                    <Home className="w-3 h-3" />
                  )}
                  {srv.audience === "empresa" ? "B2B / Empresa" : "Hogar / Personal"}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  {srv.sla}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
                {srv.title}
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#007BFF] dark:text-[#4DA3FF]">
                {srv.tagline}
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {srv.summary}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {srv.startingPricePen > 0
                  ? `Desde S/ ${srv.startingPricePen}`
                  : "Recepción gratuita"}
              </div>
              <Link
                href={`/servicios/${srv.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#007BFF] dark:text-[#4DA3FF] hover:underline"
              >
                {srv.ctaLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 liquid-glass rounded-3xl p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-[#007BFF]/35">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#007BFF]/15 text-[#007BFF] dark:text-[#4DA3FF] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              Configurador de PC Personalizada (Precios Reales de Venta)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Arma tu computadora a medida con plataforma certificada, garantía eDark y cotización directa por WhatsApp.
            </p>
          </div>
        </div>
        <Link
          href="/pc-personalizada"
          className="liquid-btn inline-flex items-center justify-center gap-2 bg-[#007BFF] hover:bg-[#0056CC] px-5 py-2.5 text-xs font-bold text-white shrink-0"
        >
          Configurar PC ahora
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
