"use client";

import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { BRAND, SERVICES } from "@/data/services";
import { SocialLinksRow } from "@/components/SocialIcons";
import { useThemeMode } from "@/components/ThemeProvider";

export function Footer() {
  const { theme } = useThemeMode();

  return (
    <footer className="relative z-10 border-t border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-[#050811]/85 backdrop-blur-xl text-slate-600 dark:text-slate-400">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-slate-950 dark:text-white font-bold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={theme === "dark" ? "/img/Logo/isotipo_Blanco.png" : "/img/Logo/isotipo_Negro.png"}
              alt="eDark"
              className="h-7 w-7 object-contain"
            />
            <span>{BRAND.legalName}</span>
          </div>
          <p className="text-xs leading-relaxed">
            Soluciones tecnológicas, soporte, consultoría TI, PCs personalizadas y reciclaje
            responsable R2v3 en {BRAND.location}.
          </p>
          <SocialLinksRow size="sm" />
        </div>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-900 dark:text-slate-200">
            Servicios
          </h3>
          <ul className="mt-3 space-y-2 text-xs">
            {SERVICES.map((srv) => (
              <li key={srv.slug}>
                <Link href={`/servicios/${srv.slug}`} className="hover:text-[#007BFF] transition-colors">
                  {srv.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-900 dark:text-slate-200">
            Plataforma
          </h3>
          <ul className="mt-3 space-y-2 text-xs">
            <li>
              <Link href="/pc-personalizada" className="hover:text-[#007BFF] transition-colors">
                Configurador PC a Medida
              </Link>
            </li>
            <li>
              <Link href="/nosotros" className="hover:text-[#007BFF] transition-colors">
                Sobre Nosotros
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="hover:text-[#007BFF] transition-colors">
                Solicitar Diagnóstico
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-900 dark:text-slate-200">
            Contacto Directo
          </h3>
          <ul className="mt-3 space-y-2.5 text-xs">
            <li className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#007BFF]" />
              <a href={`mailto:${BRAND.email}`} className="hover:text-[#007BFF]">
                {BRAND.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#007BFF]" />
              <span>{BRAND.location}</span>
            </li>
            <li className="font-mono text-slate-800 dark:text-slate-200">{BRAND.whatsappDisplay}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200/70 dark:border-white/10 py-5 text-center text-xs font-mono text-slate-500">
        © 2026 {BRAND.legalName} · Todos los derechos reservados
      </div>
    </footer>
  );
}
