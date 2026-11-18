import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Package, ShieldCheck } from "lucide-react";
import { WhatsAppIcon } from "@/components/SocialIcons";
import { BRAND } from "@/data/services";
import { fetchPublicProductById } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchPublicProductById(decodeURIComponent(id));
  if (!product) {
    notFound();
  }

  const whatsappUrl = `https://wa.me/${BRAND.whatsappDigits}?text=${encodeURIComponent(
    `Hola eDark, deseo consultar disponibilidad y compra de: ${product.nombre} (S/ ${product.precioPen.toFixed(2)})`,
  )}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/productos"
        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#007BFF] dark:text-[#4DA3FF] hover:underline mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver al catálogo de productos
      </Link>

      <div className="liquid-glass rounded-3xl p-6 sm:p-10 grid gap-8 lg:grid-cols-12 items-start">
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-2xl bg-white/95 dark:bg-slate-900/75 p-6 flex items-center justify-center min-h-72 border border-slate-200/70 dark:border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imagenUrl}
              alt={product.nombre}
              className="max-h-72 w-auto object-contain"
            />
          </div>

          {product.imagenes.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {product.imagenes.map((img, i) => (
                <div
                  key={`${img}-${i}`}
                  className="h-16 w-16 rounded-xl bg-white/90 p-1.5 border border-slate-200 flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`${product.nombre} vista ${i + 1}`}
                    className="max-h-full w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#007BFF]/10 border border-[#007BFF]/25 px-3 py-1 font-mono text-xs font-bold text-[#0056CC] dark:text-[#4DA3FF]">
              {product.categoria}
            </span>
            {product.subcategoria && (
              <span className="rounded-full border border-slate-300/70 dark:border-white/15 px-3 py-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                {product.subcategoria}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Package className="w-3.5 h-3.5" />
              {product.stock > 0 ? `En stock (${product.stock})` : "Bajo pedido"}
            </span>
          </div>

          <div>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {product.marca}
              {product.modelo ? ` · Modelo ${product.modelo}` : ""}
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
              {product.nombre}
            </h1>
          </div>

          <p className="font-mono text-3xl font-black text-[#007BFF] dark:text-[#4DA3FF]">
            S/ {product.precioPen.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {product.descripcion}
          </p>

          {(product.capacidad || product.dimension || product.especificaciones.length > 0) && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-950/55 p-4 space-y-2.5">
              <p className="font-mono text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Especificaciones técnicas
              </p>
              <div className="flex flex-wrap gap-3 text-xs font-mono">
                {product.capacidad && <span>Capacidad: {product.capacidad}</span>}
                {product.dimension && <span>Dimensión: {product.dimension}</span>}
              </div>
              {product.especificaciones.length > 0 && (
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {product.especificaciones.map((spec) => (
                    <li key={spec} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#007BFF] dark:text-[#4DA3FF] mt-0.5" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-btn inline-flex items-center gap-2 bg-[#007BFF] hover:bg-[#0056CC] text-white px-6 py-3.5 text-sm font-bold"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Solicitar Compra por WhatsApp
            </a>
            <Link
              href="/contacto"
              className="liquid-btn inline-flex items-center gap-2 border border-slate-300/80 dark:border-white/15 bg-white/75 dark:bg-slate-900/70 px-5 py-3.5 text-sm font-bold text-slate-800 dark:text-white"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Cotización Corporativa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
