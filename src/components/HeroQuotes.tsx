"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { BRAND, LEGACY_QUOTES } from "@/data/services";
import { SocialLinksRow } from "@/components/SocialIcons";

export function HeroQuotes() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % LEGACY_QUOTES.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  const current = LEGACY_QUOTES[index];

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 rounded-full liquid-glass px-4 py-1.5 text-xs font-semibold text-[#007BFF] dark:text-[#4DA3FF]">
        <Sparkles className="w-3.5 h-3.5" />
        <span>{BRAND.subBrand} · {BRAND.location}</span>
      </div>

      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.06]">
        Tecnología de alto nivel para{" "}
        <span className="bg-gradient-to-r from-[#007BFF] to-[#4DA3FF] bg-clip-text text-transparent">
          empresas que escalan
        </span>{" "}
        y hogares conectados.
      </h1>

      <div className="liquid-glass rounded-3xl p-6 relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-widest text-[#007BFF]">EDARK</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {BRAND.subBrand}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setIndex((prev) => (prev - 1 + LEGACY_QUOTES.length) % LEGACY_QUOTES.length)
              }
              aria-label="Frase anterior"
              className="liquid-btn h-8 w-8 flex items-center justify-center bg-white/60 dark:bg-slate-900/70 text-[#007BFF] dark:text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev + 1) % LEGACY_QUOTES.length)}
              aria-label="Siguiente frase"
              className="liquid-btn h-8 w-8 flex items-center justify-center bg-white/60 dark:bg-slate-900/70 text-[#007BFF] dark:text-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <blockquote className="min-h-[4.5rem] flex flex-col justify-center">
          <p className="text-sm sm:text-base italic text-slate-700 dark:text-slate-200 leading-relaxed">
            &ldquo;{current.texto}&rdquo;
          </p>
          <footer className="mt-2 text-right text-xs font-semibold text-[#007BFF] dark:text-[#4DA3FF]">
            — {current.autor}
          </footer>
        </blockquote>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/servicios"
          className="liquid-btn inline-flex items-center gap-2 bg-[#007BFF] hover:bg-[#0056CC] px-6 py-3 text-sm font-bold text-white"
        >
          Ver servicios y tarifas
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/pc-personalizada"
          className="liquid-btn inline-flex items-center gap-2 bg-white/75 dark:bg-slate-900/70 px-5 py-3 text-sm font-bold text-[#007BFF] dark:text-white border border-white/80 dark:border-white/20"
        >
          Armar PC a medida
        </Link>
        <div className="pl-1">
          <SocialLinksRow size="sm" />
        </div>
      </div>
    </div>
  );
}
