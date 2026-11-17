import Link from "next/link";
import { BRAND, SERVICES } from "@/data/services";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-slate-800/80 bg-[#05080f] text-slate-400">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5 text-white font-bold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/Logo/isotipo_Blanco.png" alt="eDark" className="h-7 w-7 object-contain" />
            <span>{BRAND.legalName}</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Soluciones tecnológicas, soporte, consultoría TI, armado de PCs a medida y reciclaje
            responsable R2v3 en {BRAND.location}.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300">Servicios</h3>
          <ul className="mt-3 space-y-2 text-xs">
            {SERVICES.map((srv) => (
              <li key={srv.slug}>
                <Link href={`/servicios/${srv.slug}`} className="hover:text-cyan-300 transition-colors">
                  {srv.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300">Plataforma</h3>
          <ul className="mt-3 space-y-2 text-xs">
            <li>
              <Link href="/pc-personalizada" className="hover:text-cyan-300 transition-colors">
                Configurador PC a Medida
              </Link>
            </li>
            <li>
              <Link href="/nosotros" className="hover:text-cyan-300 transition-colors">
                Sobre Nosotros
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="hover:text-cyan-300 transition-colors">
                Solicitar Diagnóstico
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300">Contacto Directo</h3>
          <ul className="mt-3 space-y-2 text-xs">
            <li>{BRAND.email}</li>
            <li>{BRAND.whatsappDisplay}</li>
            <li>{BRAND.location}</li>
            <li className="pt-1 flex gap-3">
              <a href={BRAND.socials.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300">
                Facebook
              </a>
              <a href={BRAND.socials.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300">
                Instagram
              </a>
              <a href={BRAND.socials.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300">
                TikTok
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/70 py-5 text-center text-xs font-mono text-slate-500">
        © 2026 {BRAND.legalName} · Todos los derechos reservados
      </div>
    </footer>
  );
}
