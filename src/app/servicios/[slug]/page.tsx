import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, MapPin } from "lucide-react";
import { ServiceQuoteForm } from "@/components/ServiceQuoteForm";
import { SERVICES } from "@/data/services";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return SERVICES.map((srv) => ({ slug: srv.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) return { title: "Servicio no encontrado" };
  return {
    title: service.title,
    description: service.summary,
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Link
        href="/servicios"
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-[#007BFF]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver a servicios
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <span className="rounded-full bg-[#007BFF]/15 border border-[#007BFF]/30 px-3 py-1 text-[#007BFF] dark:text-[#4DA3FF]">
                {service.audience === "empresa" ? "Empresas B2B" : "Hogar & Personal"}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                {service.sla}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-[#007BFF]" />
                {service.modality}
              </span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white">
              {service.title}
            </h1>
            <p className="mt-2 text-base font-semibold text-[#007BFF] dark:text-[#4DA3FF]">
              {service.tagline}
            </p>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {service.summary}
            </p>
          </div>

          <div className="liquid-glass rounded-3xl p-6">
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              ¿Qué incluye este servicio?
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
              {service.deliverables.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#007BFF] mt-1 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="liquid-glass rounded-3xl p-6">
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              Beneficios y Garantía
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
              {service.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {service.faqs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-950 dark:text-white">
                Preguntas Frecuentes
              </h2>
              {service.faqs.map((faq) => (
                <div key={faq.q} className="liquid-glass rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{faq.q}</h3>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="liquid-glass rounded-2xl p-5 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                Inversión referencial
              </span>
              <span className="text-lg font-extrabold font-mono text-[#007BFF] dark:text-[#4DA3FF]">
                {service.startingPricePen > 0
                  ? `Desde S/ ${service.startingPricePen}`
                  : "Evaluación sin costo"}
              </span>
            </div>
            <ServiceQuoteForm defaultService={service.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
