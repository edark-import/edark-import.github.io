"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, MessageCircle, Send } from "lucide-react";
import { SERVICES } from "@/data/services";

interface Props {
  defaultService?: string;
}

export function ServiceQuoteForm({ defaultService }: Props) {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [servicio, setServicio] = useState(
    defaultService || SERVICES[0].title
  );
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

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4"
    >
      <div>
        <h3 className="text-lg font-bold text-white">Solicitar Diagnóstico o Cotización</h3>
        <p className="mt-1 text-xs text-slate-400">
          Genera un ticket estructurado para acelerar tu atención técnica.
        </p>
      </div>

      <div>
        <label htmlFor="quote-nombre" className="block text-xs font-medium text-slate-300 mb-1">
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
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="quote-contacto" className="block text-xs font-medium text-slate-300 mb-1">
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
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="quote-servicio" className="block text-xs font-medium text-slate-300 mb-1">
          Servicio requerido
        </label>
        <select
          id="quote-servicio"
          value={servicio}
          onChange={(e) => setServicio(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
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
        <label htmlFor="quote-detalle" className="block text-xs font-medium text-slate-300 mb-1">
          Describe brevemente tu necesidad o urgencia
        </label>
        <textarea
          id="quote-detalle"
          rows={3}
          maxLength={1500}
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder="Cantidad de equipos, problema actual, ubicación o presupuesto..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      {result ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            Ticket generado: <span className="font-mono">{result.ticket}</span>
          </div>
          <a
            href={result.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-300"
          >
            <MessageCircle className="w-4 h-4" />
            Enviar ticket directo por WhatsApp
          </a>
        </div>
      ) : (
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {loading ? "Generando ticket..." : "Generar ticket y continuar"}
        </button>
      )}
    </form>
  );
}
