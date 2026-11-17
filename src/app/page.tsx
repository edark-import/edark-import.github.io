import Link from "next/link";
import { ArrowRight, CheckCircle2, Cpu, ShieldCheck, Wrench } from "lucide-react";
import { ServiceCatalog } from "@/components/ServiceCatalog";
import { ServiceQuoteForm } from "@/components/ServiceQuoteForm";
import { BRAND } from "@/data/services";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <section className="pt-16 pb-16 sm:pt-24 sm:pb-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-mono text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              {BRAND.legalName} · {BRAND.location}
            </div>

            <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.08]">
              Tecnología confiable, redes seguras y soporte inmediato para tu{" "}
              <span className="text-cyan-300">empresa o hogar</span>.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
              Unificamos consultoría estratégica TI, soporte técnico de respuesta rápida,
              mantenimiento especializado, armado de PCs a medida y reciclaje certificado R2v3
              bajo un solo estándar de calidad y transparencia.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/servicios"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300 transition-colors"
              >
                Explorar servicios
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pc-personalizada"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-white hover:border-cyan-400/50 transition-colors"
              >
                Armar PC a medida
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Seguridad, respaldos y control de accesos sin improvisación</span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5">
                <Wrench className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Diagnóstico claro y garantía real en cada intervención</span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5">
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Atención directa B2B y hogar vía ticket y WhatsApp</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <ServiceQuoteForm />
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-slate-800/70">
        <ServiceCatalog />
      </section>

      <section className="py-16 border-t border-slate-800/70">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/45 p-8 sm:p-10 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">
              Por qué eDark
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
              Menos parches, mayor continuidad operativa
            </h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Trabajamos desde el diagnóstico hasta la puesta en marcha documentada, evitando
              compras innecesarias y asegurando que cada equipo, red o sistema cuente con
              respaldo y trazabilidad.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-slate-200">
            {[
              "SLA claros por tipo de atención (remota inmediata o presencial en Lima)",
              "Precios transparentes en Soles (PEN) con referencia de tipo de cambio al día",
              "Destrucción segura de datos y reciclaje R2v3 para equipos dados de baja",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
