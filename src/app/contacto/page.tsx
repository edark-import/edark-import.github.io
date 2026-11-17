import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { ServiceQuoteForm } from "@/components/ServiceQuoteForm";
import { BRAND } from "@/data/services";

export const metadata: Metadata = {
  title: "Contáctanos",
  description: "Solicita diagnóstico técnico, asesoría B2B/hogar o cotización de equipos con eDark.",
};

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6 space-y-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">
            Canales Directos
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Conversemos sobre tu proyecto o incidencia TI
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Completa el formulario para generar un ticket estructurado o contáctanos directamente
            por WhatsApp o correo electrónico.
          </p>

          <div className="space-y-4 pt-2 text-sm">
            <a
              href={`https://wa.me/${BRAND.whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-emerald-400/50"
            >
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-semibold text-white">WhatsApp Directo</div>
                <div className="text-xs text-slate-400 font-mono">{BRAND.whatsappDisplay}</div>
              </div>
            </a>

            <a
              href={`mailto:${BRAND.email}`}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-cyan-400/50"
            >
              <Mail className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-semibold text-white">Correo Electrónico</div>
                <div className="text-xs text-slate-400 font-mono">{BRAND.email}</div>
              </div>
            </a>

            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-semibold text-white">Ubicación</div>
                <div className="text-xs text-slate-400">{BRAND.location} (atención remota nacional)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <ServiceQuoteForm />
        </div>
      </div>
    </div>
  );
}
