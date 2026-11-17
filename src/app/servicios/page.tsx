import type { Metadata } from "next";
import { ServiceCatalog } from "@/components/ServiceCatalog";

export const metadata: Metadata = {
  title: "Servicios Tecnológicos",
  description:
    "Consultoría TI, asesoramiento B2B y hogar, soporte técnico inmediato, mantenimiento, reciclaje R2v3 y PC a medida.",
};

export default function ServiciosPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">
          Catálogo de Servicios
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white">
          Todas nuestras líneas de atención técnica y consultoría
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-300">
          Elige el servicio según tu necesidad para revisar entregables, tiempos de respuesta y
          solicitar una cotización inmediata.
        </p>
      </div>
      <ServiceCatalog />
    </div>
  );
}
