"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Cpu } from "lucide-react";
import { BRAND, PC_COMPONENTS } from "@/data/services";
import { WhatsAppIcon } from "@/components/SocialIcons";

export default function PcPersonalizadaPage() {
  const [nombre, setNombre] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [key, group] of Object.entries(PC_COMPONENTS)) {
      initial[key] = group.options[0].id;
    }
    return initial;
  });

  const summary = useMemo(() => {
    const chosen: { category: string; label: string; pricePen: number }[] = [];
    let totalPen = 0;

    for (const [key, group] of Object.entries(PC_COMPONENTS)) {
      const option =
        group.options.find((o) => o.id === selected[key]) ?? group.options[0];
      totalPen += option.pricePen;
      chosen.push({ category: group.label, label: option.label, pricePen: option.pricePen });
    }
    return { chosen, totalPen };
  }, [selected]);

  const whatsappUrl = useMemo(() => {
    const lines = [
      "Hola eDark, solicito cotización formal para mi PC Personalizada:",
      nombre.trim() ? `• Cliente: ${nombre.trim()}` : "",
      ...summary.chosen.map((c) => `• ${c.category}: ${c.label} (S/ ${c.pricePen.toFixed(2)})`),
      `• TOTAL VENTA REFERENCIAL (IGV incluido): S/ ${summary.totalPen.toFixed(2)}`,
      "Por favor confirmar stock vigente y fecha de entrega.",
    ].filter(Boolean);
    return `https://wa.me/${BRAND.whatsappDigits}?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [nombre, summary]);

  const fieldCls =
    "w-full rounded-2xl border border-slate-300/80 dark:border-white/15 bg-white/80 dark:bg-slate-950/75 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#007BFF] focus:outline-none";

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#007BFF] dark:text-[#4DA3FF]">
          Configurador a Medida
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white flex items-center gap-3">
          <Cpu className="w-8 h-8 text-[#007BFF]" />
          Arma tu PC Personalizada
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
          Precios reales de venta al público en Soles (incluyen margen comercial, IGV 18%,
          ensamblaje profesional, pruebas de estrés y garantía eDark).
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-4 liquid-glass rounded-3xl p-6">
          <div>
            <label htmlFor="pc-nombre" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nombre de contacto o empresa
            </label>
            <input
              id="pc-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre o razón social"
              className={fieldCls}
            />
          </div>

          {Object.entries(PC_COMPONENTS).map(([key, group]) => (
            <div key={key}>
              <label htmlFor={`pc-${key}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {group.label}
              </label>
              <select
                id={`pc-${key}`}
                value={selected[key]}
                onChange={(e) => setSelected((prev) => ({ ...prev, [key]: e.target.value }))}
                className={fieldCls}
              >
                {group.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} {opt.pricePen > 0 ? `(S/ ${opt.pricePen})` : "(Incluido)"}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-24 liquid-glass rounded-3xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              Resumen de tu Equipo
            </h2>

            <ul className="space-y-2.5 text-xs">
              {summary.chosen.map((item) => (
                <li
                  key={item.category}
                  className="flex justify-between gap-4 border-b border-slate-200/70 dark:border-white/10 pb-2"
                >
                  <span className="text-slate-600 dark:text-slate-400">{item.category}</span>
                  <span className="text-right text-slate-900 dark:text-slate-100 font-semibold">
                    {item.label}{" "}
                    <span className="font-mono text-[#007BFF] dark:text-[#4DA3FF]">
                      {item.pricePen > 0 ? `S/ ${item.pricePen}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/75 border border-slate-200 dark:border-white/10 p-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Precio de venta estimado (IGV incl.)
                </span>
                <span className="text-2xl font-extrabold font-mono text-[#007BFF] dark:text-[#4DA3FF]">
                  S/ {summary.totalPen.toFixed(2)}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Incluye ensamblaje, gestión de cables, drivers y pruebas de estabilidad.
              </p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-btn inline-flex w-full items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] px-5 py-3 text-sm font-bold text-slate-950"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Solicitar cotización por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
