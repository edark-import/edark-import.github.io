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
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-300"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver a servicios
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-cyan-300">
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1">
                {service.audience === "empresa" ? "Empresas B2B" : "Hogar & Personal"}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                {service.sla}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {service.modality}
              </span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
              {service.title}
            </h1>
            <p className="mt-2 text-base font-medium text-cyan-300">{service.tagline}</p>
            <p className="mt-4 text-base text-slate-300 leading-relaxed">{service.summary}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-base font-bold text-white">¿Qué incluye este servicio?</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {service.deliverables.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-1 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-base font-bold text-white">Beneficios y Garantía</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
              {service.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {service.faqs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-white">Preguntas Frecuentes</h2>
              {service.faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4"
                >
                  <h3 className="text-sm font-semibold text-white">{faq.q}</h3>
                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Inversión referencial</span>
              <span className="text-lg font-bold font-mono text-emerald-300">
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
