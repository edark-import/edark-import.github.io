"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { BRAND } from "@/data/services";
import type { PublicProduct } from "@/lib/products";
import { WhatsAppIcon } from "@/components/SocialIcons";

interface ProductsCatalogProps {
  initialProducts: PublicProduct[];
  source: "firestore" | "respaldo";
}

interface CartEntry {
  product: PublicProduct;
  qty: number;
}

export function ProductsCatalog({ initialProducts, source }: ProductsCatalogProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const categories = useMemo(() => {
    const uniq = Array.from(new Set(initialProducts.map((p) => p.categoria)));
    return ["Todas", ...uniq];
  }, [initialProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialProducts.filter((p) => {
      if (category !== "Todas" && p.categoria !== category) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.marca.toLowerCase().includes(q) ||
        p.modelo.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
      );
    });
  }, [initialProducts, category, search]);

  function addToCart(product: PublicProduct) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, qty: Math.min(product.stock || 5, item.qty + 1) }
            : item,
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    setDrawerOpen(true);
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.precioPen * item.qty,
    0,
  );
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const whatsappCartText = encodeURIComponent(
    `Hola eDark, quiero consultar disponibilidad y compra de:\n${cart
      .map(
        (it) =>
          `- ${it.qty}x ${it.product.nombre} (S/ ${it.product.precioPen.toFixed(2)} c/u)`,
      )
      .join("\n")}\nTotal estimado: S/ ${cartTotal.toFixed(2)}`,
  );

  return (
    <div className="space-y-8">
      {/* Toolbar: Search + Category Filters + Cart Toggle */}
      <div className="liquid-glass rounded-3xl p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar laptop, tablet, marca o modelo..."
            className="w-full rounded-full border border-slate-300/80 dark:border-white/15 bg-white/80 dark:bg-slate-950/70 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-[#007BFF]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`liquid-btn px-4 py-2 text-xs font-bold cursor-pointer ${
                  active
                    ? "bg-[#007BFF] text-white"
                    : "bg-white/75 dark:bg-slate-900/75 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/15"
                }`}
              >
                {cat}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="liquid-btn inline-flex items-center gap-1.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-4 py-2 text-xs font-bold cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Pedido ({cartCount})
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
        <span>
          Mostrando {filtered.length} producto{filtered.length === 1 ? "" : "s"} activo{filtered.length === 1 ? "" : "s"} · Precios finales en S/ (PEN)
        </span>
        <span className="rounded-full border border-slate-300/70 dark:border-white/15 px-3 py-0.5 text-[11px]">
          Origen: {source === "firestore" ? "Firestore eDark Live (sanitizado)" : "Catálogo base"}
        </span>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="liquid-glass rounded-3xl p-10 text-center text-sm text-slate-600 dark:text-slate-300">
          No encontramos productos con ese filtro. Escríbenos por WhatsApp si buscas algún equipo específico por importación o pedido.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => {
            const inCart = cart.some((item) => item.product.id === product.id);
            const whatsappSingle = `https://wa.me/${BRAND.whatsappDigits}?text=${encodeURIComponent(
              `Hola eDark, me interesa el producto: ${product.nombre} (S/ ${product.precioPen.toFixed(2)})`,
            )}`;

            return (
              <article
                key={product.id}
                className="liquid-glass rounded-3xl p-5 flex flex-col justify-between transition-all hover:border-[#007BFF]/50"
              >
                <div>
                  <Link
                    href={`/productos/${encodeURIComponent(product.id)}`}
                    className="block rounded-2xl bg-white/90 dark:bg-slate-900/70 p-4 h-52 flex items-center justify-center overflow-hidden border border-slate-200/70 dark:border-white/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imagenUrl}
                      alt={product.nombre}
                      loading="lazy"
                      className="max-h-44 w-auto object-contain transition-transform duration-300 hover:scale-105"
                    />
                  </Link>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-[#007BFF]/10 text-[#0056CC] dark:text-[#4DA3FF] border border-[#007BFF]/25 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase">
                      {product.categoria}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Package className="w-3.5 h-3.5" />
                      {product.stock > 0 ? `Stock: ${product.stock}` : "Bajo pedido"}
                    </span>
                  </div>

                  <Link href={`/productos/${encodeURIComponent(product.id)}`}>
                    <h3 className="mt-2.5 text-base font-extrabold text-slate-950 dark:text-white hover:text-[#007BFF] dark:hover:text-[#4DA3FF] transition-colors">
                      {product.nombre}
                    </h3>
                  </Link>

                  <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {product.marca}
                    {product.modelo ? ` · ${product.modelo}` : ""}
                  </p>

                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {product.descripcion}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-white/10 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-black text-[#007BFF] dark:text-[#4DA3FF]">
                      S/ {product.precioPen.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <Link
                      href={`/productos/${encodeURIComponent(product.id)}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#007BFF]"
                    >
                      Ver ficha <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className={`liquid-btn inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold cursor-pointer ${
                        inCart
                          ? "bg-emerald-600 text-white"
                          : "bg-[#007BFF] hover:bg-[#0056CC] text-white"
                      }`}
                    >
                      {inCart ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Agregado
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Agregar
                        </>
                      )}
                    </button>

                    <a
                      href={whatsappSingle}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="liquid-btn inline-flex items-center justify-center gap-1.5 border border-slate-300/80 dark:border-white/15 bg-white/75 dark:bg-slate-900/70 text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-500" />
                      Consultar
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Drawer Pedido / WhatsApp */}
      {drawerOpen && (
        <aside className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-md liquid-glass rounded-3xl p-5 shadow-2xl border-[#007BFF]/40">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
            <h3 className="text-sm font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#007BFF]" />
              Lista de Pedido ({cartCount})
            </h3>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Cerrar pedido"
              className="p-1 text-slate-500 hover:text-slate-950 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {cart.length === 0 ? (
            <p className="py-5 text-center text-xs text-slate-500 dark:text-slate-400">
              Agrega productos del catálogo para consultar stock o enviar tu pedido por WhatsApp.
            </p>
          ) : (
            <>
              <ul className="my-3 max-h-48 overflow-y-auto space-y-2">
                {cart.map((item) => (
                  <li
                    key={item.product.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/75 dark:bg-slate-950/60 px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {item.qty}× {item.product.nombre}
                      </p>
                      <p className="font-mono text-[11px] text-[#007BFF] dark:text-[#4DA3FF]">
                        S/ {(item.product.precioPen * item.qty).toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label={`Quitar ${item.product.nombre}`}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase text-slate-500 dark:text-slate-400">
                    Total Estimado
                  </p>
                  <p className="font-mono text-lg font-extrabold text-slate-950 dark:text-white">
                    S/ {cartTotal.toFixed(2)}
                  </p>
                </div>

                <a
                  href={`https://wa.me/${BRAND.whatsappDigits}?text=${whatsappCartText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="liquid-btn inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  Enviar por WhatsApp
                </a>
              </div>
            </>
          )}
        </aside>
      )}
    </div>
  );
}
