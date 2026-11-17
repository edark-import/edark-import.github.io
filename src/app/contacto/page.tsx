import type { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";
import { ServiceQuoteForm } from "@/components/ServiceQuoteForm";
import { SocialLinksRow, WhatsAppIcon } from "@/components/SocialIcons";
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
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#007BFF] dark:text-[#4DA3FF]">
            Canales Directos
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white">
            Conversemos sobre tu proyecto o incidencia TI
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Completa el formulario para generar un ticket estructurado o contáctanos directamente
            por WhatsApp, correo electrónico o redes sociales.
          </p>

          <div className="space-y-4 pt-2 text-sm">
            <a
              href={`https://wa.me/${BRAND.whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass rounded-2xl p-4 flex items-center gap-3 hover:border-emerald-400/50 transition-colors"
            >
              <WhatsAppIcon className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="font-bold text-slate-950 dark:text-white">WhatsApp Directo</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {BRAND.whatsappDisplay}
                </div>
              </div>
            </a>

            <a
              href={`mailto:${BRAND.email}`}
              className="liquid-glass rounded-2xl p-4 flex items-center gap-3 hover:border-[#007BFF]/50 transition-colors"
            >
              <Mail className="w-5 h-5 text-[#007BFF]" />
              <div>
                <div className="font-bold text-slate-950 dark:text-white">Correo Electrónico</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {BRAND.email}
                </div>
              </div>
            </a>

            <div className="liquid-glass rounded-2xl p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#007BFF]" />
              <div>
                <div className="font-bold text-slate-950 dark:text-white">Ubicación</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {BRAND.location} (atención remota nacional)
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">
                Síguenos en redes sociales
              </p>
              <SocialLinksRow />
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
