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
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">
            Líneas de Servicio
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
            Soluciones diseñadas por especialidad
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50"
                    : "bg-slate-900/70 text-slate-400 border border-slate-800 hover:text-slate-200"
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
            className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 hover:border-cyan-500/45 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-0.5 text-cyan-300">
                  {srv.audience === "empresa" ? (
                    <Building2 className="w-3 h-3" />
                  ) : (
                    <Home className="w-3 h-3" />
                  )}
                  {srv.audience === "empresa" ? "B2B / Empresa" : "Hogar / Personal"}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  {srv.sla}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-white">{srv.title}</h3>
              <p className="mt-1 text-xs font-medium text-cyan-300/90">{srv.tagline}</p>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">{srv.summary}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/70 flex items-center justify-between">
              <div className="text-xs font-mono text-slate-400">
                {srv.startingPricePen > 0
                  ? `Desde S/ ${srv.startingPricePen}`
                  : "Recepción gratuita"}
              </div>
              <Link
                href={`/servicios/${srv.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
              >
                Ver alcance y cotizar
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-base font-bold text-white">
              Configurador de PC Personalizada (7ª Línea)
            </h3>
            <p className="text-sm text-slate-300">
              Arma tu estación de trabajo o PC gamer paso a paso y obtén el cálculo estimado en Soles y Dólares.
            </p>
          </div>
        </div>
        <Link
          href="/pc-personalizada"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-300 shrink-0"
        >
          Configurar PC ahora
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
