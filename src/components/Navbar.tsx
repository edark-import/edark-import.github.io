"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, MessageCircle, X } from "lucide-react";
import { BRAND } from "@/data/services";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/tipo-cambio")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { venta?: number } | null) => {
        if (data && typeof data.venta === "number") setRate(data.venta);
      })
      .catch(() => {});
  }, []);

  const links = [
    { href: "/servicios", label: "Servicios" },
    { href: "/pc-personalizada", label: "PC a Medida" },
    { href: "/nosotros", label: "Nosotros" },
    { href: "/contacto", label: "Contáctanos" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/Logo/isotipo_Blanco.png"
            alt="Logo eDark"
            className="h-8 w-8 object-contain"
          />
          <span className="text-lg font-bold tracking-tight text-white">
            eDark <span className="text-xs font-mono font-normal text-cyan-400">TI & Servicios</span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-cyan-300 transition-colors">
              {item.label}
            </Link>
          ))}
          {rate !== null && (
            <span className="rounded-md border border-slate-800 bg-slate-900/80 px-2.5 py-1 font-mono text-xs text-slate-300">
              TC: S/ {rate.toFixed(2)}
            </span>
          )}
          <a
            href={`https://wa.me/${BRAND.whatsappDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/40 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
          className="md:hidden rounded-lg border border-slate-800 p-2 text-slate-300"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-800 bg-[#070b14] px-6 py-4 space-y-3 text-sm">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-1.5 text-slate-200 hover:text-cyan-300"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
