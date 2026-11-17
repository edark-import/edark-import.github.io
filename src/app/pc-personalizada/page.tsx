"use client";

import { useEffect, useMemo, useState } from "react";
import { Cpu, MessageCircle } from "lucide-react";
import { BRAND, PC_COMPONENTS } from "@/data/services";

export default function PcPersonalizadaPage() {
  const [nombre, setNombre] = useState("");
  const [rate, setRate] = useState(3.75);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [key, group] of Object.entries(PC_COMPONENTS)) {
      initial[key] = group.options[0].id;
    }
    return initial;
  });

  useEffect(() => {
    fetch("/api/tipo-cambio")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { venta?: number } | null) => {
        if (data && typeof data.venta === "number") setRate(data.venta);
      })
      .catch(() => {});
  }, []);

  const summary = useMemo(() => {
    const chosen: { category: string; label: string; pricePen: number }[] = [];
    let totalPen = 0;

    for (const [key, group] of Object.entries(PC_COMPONENTS)) {
      const option =
        group.options.find((o) => o.id === selected[key]) ?? group.options[0];
      totalPen += option.pricePen;
      chosen.push({ category: group.label, label: option.label, pricePen: option.pricePen });
    }
    return {
      chosen,
      totalPen,
      totalUsd: totalPen / rate,
    };
  }, [selected, rate]);

  const whatsappUrl = useMemo(() => {
    const lines = [
      `Hola eDark, quiero cotizar esta PC Personalizada:`,
      nombre.trim() ? `• Cliente: ${nombre.trim()}` : "",
      ...summary.chosen.map((c) => `• ${c.category}: ${c.label}`),
      `• Estimado referencial: S/ ${summary.totalPen.toFixed(2)} (~USD ${summary.totalUsd.toFixed(2)})`,
    ].filter(Boolean);
    return `https://wa.me/${BRAND.whatsappDigits}?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [nombre, summary]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">
          Configurador a Medida
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
          <Cpu className="w-8 h-8 text-cyan-400" />
          Arma tu PC Personalizada
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-300">
          Selecciona componentes para oficina, ingeniería, diseño o gaming y recibe una cotización
          directa con compatibilidad verificada.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div>
            <label htmlFor="pc-nombre" className="block text-xs font-medium text-slate-300 mb-1.5">
              Nombre de contacto
            </label>
            <input
              id="pc-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre o empresa"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {Object.entries(PC_COMPONENTS).map(([key, group]) => (
            <div key={key}>
              <label htmlFor={`pc-${key}`} className="block text-xs font-medium text-slate-300 mb-1.5">
                {group.label}
              </label>
              <select
                id={`pc-${key}`}
                value={selected[key]}
                onChange={(e) => setSelected((prev) => ({ ...prev, [key]: e.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
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
          <div className="sticky top-24 rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">Resumen de Configuración</h2>

            <ul className="space-y-2.5 text-xs">
              {summary.chosen.map((item) => (
                <li key={item.category} className="flex justify-between gap-4 border-b border-slate-800/70 pb-2">
                  <span className="text-slate-400">{item.category}</span>
                  <span className="text-right text-slate-200 font-medium">{item.label}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Estimado referencial (PEN)</span>
                <span className="text-2xl font-bold font-mono text-cyan-300">
                  S/ {summary.totalPen.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Equivalente USD (TC S/ {rate.toFixed(2)})</span>
                <span>$ {summary.totalUsd.toFixed(2)}</span>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-300"
            >
              <MessageCircle className="w-4 h-4" />
              Cotizar esta configuración por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
