import type { Metadata } from "next";
import { ProductsCatalog } from "@/components/ProductsCatalog";
import { fetchPublicProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Productos Tecnológicos",
  description:
    "Catálogo de laptops, tablets, hardware y tecnología seleccionada en eDark Import Perú con precios en Soles (PEN).",
};

export default async function ProductosPage() {
  const { products, source } = await fetchPublicProducts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#007BFF] dark:text-[#4DA3FF]">
          Catálogo eDark Store
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white">
          Productos & Hardware Seleccionado
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
          Equipos verificados con asesoría técnica personalizada, garantía real y despacho a todo el Perú. Consulta disponibilidad directa o arma tu lista de pedido por WhatsApp.
        </p>
      </div>

      <ProductsCatalog initialProducts={products} source={source} />
    </div>
  );
}
