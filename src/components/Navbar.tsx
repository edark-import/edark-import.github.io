"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { BRAND } from "@/data/services";
import { useThemeMode } from "@/components/ThemeProvider";
import { WhatsAppIcon } from "@/components/SocialIcons";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useThemeMode();

  const links = [
    { href: "/servicios", label: "Servicios" },
    { href: "/productos", label: "Productos" },
    { href: "/pc-personalizada", label: "PC a Medida" },
    { href: "/nosotros", label: "Nosotros" },
    { href: "/contacto", label: "Contáctanos" },
  ];

  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 pt-3">
      <div className="mx-auto max-w-6xl liquid-glass rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme === "dark" ? "/img/Logo/isotipo_Blanco.png" : "/img/Logo/isotipo_Negro.png"}
            alt="Logo eDark"
            className="h-8 w-8 object-contain"
          />
          <div className="leading-tight">
            <span className="text-base font-black tracking-wide text-slate-950 dark:text-white">
              eDark
            </span>
            <span className="block text-[10px] font-mono text-[#007BFF] dark:text-[#4DA3FF]">
              {BRAND.subBrand}
            </span>
          </div>
        </Link>

        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-200">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-[#007BFF] dark:hover:text-[#4DA3FF] transition-colors"
            >
              {item.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            className="liquid-btn h-9 w-9 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-amber-300 cursor-pointer"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <a
            href={`https://wa.me/${BRAND.whatsappDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="liquid-btn inline-flex items-center gap-1.5 bg-[#007BFF] hover:bg-[#0056CC] px-4 py-2 text-xs font-bold text-white"
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="liquid-btn h-9 w-9 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-amber-300"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
            className="liquid-glass rounded-xl p-2 text-slate-800 dark:text-white"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden mx-auto max-w-6xl mt-2 liquid-glass rounded-2xl px-6 py-4 space-y-3 text-sm">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-1.5 font-medium text-slate-800 dark:text-slate-100 hover:text-[#007BFF]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
