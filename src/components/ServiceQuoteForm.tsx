"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { SERVICES } from "@/data/services";
import { WhatsAppIcon } from "@/components/SocialIcons";

interface Props {
  defaultService?: string;
}

export function ServiceQuoteForm({ defaultService }: Props) {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [servicio, setServicio] = useState(defaultService || SERVICES[0].title);
  const [detalle, setDetalle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ticket: string; whatsappUrl: string } | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, contacto, servicio, detalle }),
      });
      const data = (await res.json()) as { ticket?: string; whatsappUrl?: string; error?: string };
      if (!res.ok || !data.ticket || !data.whatsappUrl) {
        setError(data.error || "No se pudo registrar la solicitud.");
      } else {
        setResult({ ticket: data.ticket, whatsappUrl: data.whatsappUrl });
      }
    } catch {
      setError("Error de conexión al generar el ticket.");
    } finally {
      setLoading(false);
    }
  }

  const fieldCls =
    "w-full rounded-2xl border border-slate-300/80 dark:border-white/15 bg-white/80 dark:bg-slate-950/75 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#007BFF] focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="liquid-glass rounded-3xl p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">
          Cotiza o Agenda tu Atención
        </h3>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          Genera tu ticket al instante y envíalo directo a nuestro WhatsApp técnico.
        </p>
      </div>

      <div>
        <label htmlFor="quote-nombre" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Nombre o Empresa
        </label>
        <input
          id="quote-nombre"
          type="text"
          required
          minLength={2}
          maxLength={100}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Carlos Mendoza / Empresa SAC"
          className={fieldCls}
        />
      </div>

      <div>
        <label htmlFor="quote-contacto" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          WhatsApp o Correo Electrónico
        </label>
        <input
          id="quote-contacto"
          type="text"
          required
          minLength={6}
          maxLength={120}
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          placeholder="+51 999 000 000 / correo@empresa.pe"
          className={fieldCls}
        />
      </div>

      <div>
        <label htmlFor="quote-servicio" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Servicio requerido
        </label>
        <select
          id="quote-servicio"
          value={servicio}
          onChange={(e) => setServicio(e.target.value)}
          className={fieldCls}
        >
          {SERVICES.map((srv) => (
            <option key={srv.slug} value={srv.title}>
              {srv.title}
            </option>
          ))}
          <option value="PC Personalizada a Medida">PC Personalizada a Medida</option>
        </select>
      </div>

      <div>
        <label htmlFor="quote-detalle" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          ¿Qué necesitas resolver?
        </label>
        <textarea
          id="quote-detalle"
          rows={3}
          maxLength={1500}
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder="Cantidad de equipos, síntoma, distrito o requerimiento..."
          className={fieldCls}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}

      {result ? (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            Ticket generado: <span className="font-mono">{result.ticket}</span>
          </div>
          <a
            href={result.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="liquid-btn inline-flex w-full items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] px-4 py-2.5 text-sm font-bold text-slate-950"
          >
            <WhatsAppIcon className="w-4 h-4" />
            Enviar ticket por WhatsApp
          </a>
        </div>
      ) : (
        <button
          type="submit"
          disabled={loading}
          className="liquid-btn inline-flex w-full items-center justify-center gap-2 bg-[#007BFF] hover:bg-[#0056CC] px-4 py-3 text-sm font-bold text-white disabled:opacity-60 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {loading ? "Generando ticket..." : "Generar ticket y cotizar"}
        </button>
      )}
    </form>
  );
}
