import type { Metadata } from "next";
import { ShieldCheck, Sparkles, Target } from "lucide-react";
import { BRAND } from "@/data/services";

export const metadata: Metadata = {
  title: "Sobre Nosotros",
  description: "Conoce eDark E.I.R.L., nuestra visión, misión y enfoque en soluciones tecnológicas confiables.",
};

export default function NosotrosPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 space-y-12">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#007BFF] dark:text-[#4DA3FF]">
          Identidad Corporativa
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white">
          {BRAND.legalName} — {BRAND.subBrand}
        </h1>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Somos una empresa peruana dedicada a acercar infraestructura confiable, soporte técnico
          especializado, ciberseguridad práctica y soluciones de transformación digital a personas
          y empresas que buscan resultados medibles.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="liquid-glass rounded-3xl p-6">
          <Target className="w-6 h-6 text-[#007BFF]" />
          <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">Misión</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Resolver retos tecnológicos reales con diagnósticos honestos, ejecución técnica sólida y
            continuidad operativa para hogares y empresas.
          </p>
        </div>

        <div className="liquid-glass rounded-3xl p-6">
          <Sparkles className="w-6 h-6 text-emerald-500" />
          <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">Visión</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Consolidarnos como el socio tecnológico integral referente en servicios TI, automatización
            y economía circular responsable en Perú.
          </p>
        </div>

        <div className="liquid-glass rounded-3xl p-6">
          <ShieldCheck className="w-6 h-6 text-[#007BFF]" />
          <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">Valores</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Ética profesional, confidencialidad de datos, precios transparentes y compromiso con la
            calidad en cada entregable.
          </p>
        </div>
      </div>
    </div>
  );
}
