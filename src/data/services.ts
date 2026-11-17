export type ServiceAudience = "todos" | "empresa" | "hogar";

export interface ServiceItem {
  slug: string;
  title: string;
  tagline: string;
  audience: Exclude<ServiceAudience, "todos">;
  modality: string;
  sla: string;
  startingPricePen: number;
  summary: string;
  deliverables: string[];
  benefits: string[];
  faqs: { q: string; a: string }[];
}

export interface PcPartOption {
  id: string;
  label: string;
  pricePen: number;
}

export const BRAND = {
  name: "eDark",
  legalName: "eDark E.I.R.L.",
  slogan: "Soluciones Tecnológicas, Infraestructura & Servicios TI en Perú",
  email: "edark-import@gmail.com",
  whatsappDigits: "51916907657",
  whatsappDisplay: "+51 916 907 657",
  location: "Lima, Perú",
  socials: {
    facebook: "https://www.facebook.com/profile.php?id=61578651951463",
    instagram: "https://www.instagram.com/edarkperu/",
    tiktok: "https://www.tiktok.com/@edark_peru?lang=es",
  },
};

export const SERVICES: ServiceItem[] = [
  {
    slug: "consultoria",
    title: "Consultoría Tecnológica",
    tagline: "Decisiones de TI alineadas a presupuesto y continuidad",
    audience: "empresa",
    modality: "Remoto o presencial en Lima",
    sla: "Diagnóstico en 24–48 h",
    startingPricePen: 180,
    summary:
      "Evaluamos tu infraestructura de redes, sistemas y ciberseguridad para trazar un plan de modernización práctico, seguro y sin gastos innecesarios.",
    deliverables: [
      "Redes y conectividad: diseño y optimización cableada e inalámbrica, cobertura y velocidad",
      "Informática y sistemas: asesoría en compra de equipos, virtualización, respaldos y migración",
      "Seguridad informática: análisis de vulnerabilidades, firewalls y capacitación en buenas prácticas",
    ],
    benefits: [
      "Diagnóstico personalizado según tus objetivos reales",
      "Propuesta técnica y económica clara por etapas",
      "Acompañamiento en implementación y soporte posterior",
    ],
    faqs: [
      {
        q: "¿Incluye informe técnico por escrito?",
        a: "Sí. Entregamos hallazgos priorizados por riesgo/impacto y presupuesto estimado.",
      },
      {
        q: "¿Atienden fuera de Lima?",
        a: "Las sesiones de diagnóstico y arquitectura se realizan de forma remota para todo el Perú.",
      },
    ],
  },
  {
    slug: "asesoramiento-empresa",
    title: "Asesoramiento Empresarial B2B",
    tagline: "Infraestructura segura, datos protegidos y transformación digital",
    audience: "empresa",
    modality: "Presencial en Lima / Híbrido",
    sla: "Plan operativo en 72 h",
    startingPricePen: 350,
    summary:
      "Ayudamos a pymes y empresas con sucursales a estandarizar redes, políticas de acceso, respaldos críticos y automatización de procesos.",
    deliverables: [
      "Infraestructura y redes corporativas: sedes, sucursales y acceso remoto seguro (VPN/VLAN)",
      "Seguridad y datos: auditoría de accesos, Active Directory/identidades y backups automáticos",
      "Transformación digital: digitalización de flujos, migración a la nube y automatización",
    ],
    benefits: [
      "Soluciones adaptadas al rubro y tamaño de tu empresa",
      "Menor tiempo muerto operativo y mayor control de accesos",
      "Confidencialidad y acompañamiento continuo",
    ],
    faqs: [
      {
        q: "¿Pueden trabajar con nuestra infraestructura actual?",
        a: "Sí, auditamos y optimizamos lo existente antes de recomendar nueva inversión.",
      },
    ],
  },
  {
    slug: "asesoramiento-hogar",
    title: "Asesoramiento Tecnológico para el Hogar",
    tagline: "Wi-Fi estable, domótica y seguridad digital familiar",
    audience: "hogar",
    modality: "Visita técnica en Lima o asesoría remota",
    sla: "Atención en 24 h",
    startingPricePen: 90,
    summary:
      "Convierte tu casa en un espacio conectado sin zonas muertas de Wi-Fi, con dispositivos inteligentes integrados y protección para toda tu familia.",
    deliverables: [
      "Redes en casa: cobertura Wi-Fi estable para teletrabajo, clases y streaming sin cortes",
      "Hogar inteligente (domótica): iluminación, cámaras, asistentes de voz y automatizaciones",
      "Seguridad familiar: control parental, protección de red doméstica y respaldo de archivos",
    ],
    benefits: [
      "Instalación y configuración ordenada y sin tecnicismos",
      "Recomendación imparcial de routers, repetidores mesh y cámaras",
    ],
    faqs: [
      {
        q: "¿Qué necesito antes de agendar?",
        a: "Solo indícanos tu proveedor de internet, tamaño aproximado del hogar y tus objetivos.",
      },
    ],
  },
  {
    slug: "soporte",
    title: "Soporte Técnico Inmediato",
    tagline: "Respuesta rápida ante fallas críticas de software, red o virus",
    audience: "hogar",
    modality: "Remoto inmediato o presencial",
    sla: "Respuesta < 30 min",
    startingPricePen: 60,
    summary:
      "Tu equipo de respuesta rápida ante emergencias digitales: caídas de red, lentitud extrema, malware o sistemas que no arrancan.",
    deliverables: [
      "Paso 1 — Evaluación inmediata de emergencia (red caída, virus o bloqueo)",
      "Paso 2 — Atención directa por WhatsApp o teléfono para triaje rápido",
      "Paso 3 — Diagnóstico transparente remoto o presencial antes de intervenir",
      "Paso 4 — Solución verificada y recomendaciones para evitar recaídas",
    ],
    benefits: [
      "Sin esperas burocráticas para incidencias urgentes",
      "Diagnóstico claro previo a cualquier costo adicional",
    ],
    faqs: [
      {
        q: "¿Cómo atienden una emergencia remota?",
        a: "Coordinamos por WhatsApp una sesión segura bajo tu autorización paso a paso.",
      },
    ],
  },
  {
    slug: "mantenimiento",
    title: "Mantenimiento y Reparación",
    tagline: "Prevención, cambio de componentes y recuperación de datos",
    audience: "hogar",
    modality: "Taller o a domicilio (Lima)",
    sla: "Entrega en 24–48 h",
    startingPricePen: 80,
    summary:
      "Extendemos la vida útil de tus computadoras, laptops, impresoras y redes con mantenimiento preventivo profundo y reparaciones garantizadas.",
    deliverables: [
      "Mantenimiento preventivo: limpieza interna profunda, pasta térmica, optimización y parches",
      "Reparación especializada: hardware de PCs, laptops, impresoras y reemplazo de repuestos",
      "Recuperación de datos y respaldo seguro de información crítica",
    ],
    benefits: [
      "Seguimiento post-servicio y garantía por intervención",
      "Evita recalentamientos, pérdida de información y fallas costosas",
    ],
    faqs: [
      {
        q: "¿Cada cuánto recomiendan mantenimiento preventivo?",
        a: "Cada 6 meses para equipos de uso intensivo o entornos con polvo.",
      },
    ],
  },
  {
    slug: "recicla",
    title: "Reciclaje Tecnológico R2v3",
    tagline: "Economía circular y destrucción certificada de datos",
    audience: "empresa",
    modality: "Acopio programado para empresas y hogares",
    sla: "Recojo coordinado en 48 h",
    startingPricePen: 0,
    summary:
      "Damos disposición segura y responsable a computadoras, laptops, impresoras y hardware en desuso garantizando trazabilidad y borrado seguro de información.",
    deliverables: [
      "Recepción y clasificación de computadoras, laptops, impresoras y periféricos en desuso",
      "Destrucción segura de datos almacenados antes del desensamble o reuso",
      "Procesos alineados al estándar de reciclaje electrónico responsable R2v3",
    ],
    benefits: [
      "Libera espacio físico sin riesgo de fuga de datos corporativos",
      "Reduce impacto ambiental mediante economía circular verificable",
    ],
    faqs: [
      {
        q: "¿Tiene costo entregar equipos en desuso?",
        a: "La evaluación y recepción básica no tiene costo; para retiros corporativos con borrado certificado coordinamos el alcance exacto.",
      },
    ],
  },
];

export const PC_COMPONENTS: Record<string, { label: string; options: PcPartOption[] }> = {
  procesador: {
    label: "Procesador",
    options: [
      { id: "i3-14", label: "Intel Core i3 (14ª Gen)", pricePen: 480 },
      { id: "i5-14", label: "Intel Core i5 (14ª Gen)", pricePen: 920 },
      { id: "i7-14", label: "Intel Core i7 (14ª Gen)", pricePen: 1580 },
      { id: "r5-7600", label: "AMD Ryzen 5 7600", pricePen: 890 },
      { id: "r7-7700", label: "AMD Ryzen 7 7700X", pricePen: 1450 },
    ],
  },
  ram: {
    label: "Memoria RAM",
    options: [
      { id: "16gb", label: "16 GB DDR4/DDR5 (2x8 GB)", pricePen: 220 },
      { id: "32gb", label: "32 GB DDR5 (2x16 GB)", pricePen: 440 },
      { id: "64gb", label: "64 GB DDR5 Workstation", pricePen: 860 },
    ],
  },
  almacenamiento: {
    label: "Almacenamiento NVMe",
    options: [
      { id: "500gb", label: "SSD NVMe 500 GB PCIe 4.0", pricePen: 190 },
      { id: "1tb", label: "SSD NVMe 1 TB PCIe 4.0", pricePen: 320 },
      { id: "2tb", label: "SSD NVMe 2 TB Alta Velocidad", pricePen: 620 },
    ],
  },
  grafica: {
    label: "Tarjeta Gráfica (GPU)",
    options: [
      { id: "igpu", label: "Gráficos Integrados (Oficina / Estudio)", pricePen: 0 },
      { id: "rtx4060", label: "NVIDIA GeForce RTX 4060 8 GB", pricePen: 1380 },
      { id: "rtx4070", label: "NVIDIA GeForce RTX 4070 Super 12 GB", pricePen: 2690 },
    ],
  },
  pantalla: {
    label: "Monitor",
    options: [
      { id: "none", label: "Sin monitor (solo torre)", pricePen: 0 },
      { id: "fhd-24", label: 'Monitor 24" IPS Full HD 100Hz', pricePen: 460 },
      { id: "qhd-27", label: 'Monitor 27" QHD 165Hz Profesional', pricePen: 980 },
    ],
  },
  conectividad: {
    label: "Wi-Fi & Bluetooth",
    options: [
      { id: "lan", label: "Solo Ethernet Gigabit", pricePen: 0 },
      { id: "wifi6", label: "Tarjeta Wi-Fi 6E + Bluetooth 5.3", pricePen: 165 },
    ],
  },
  perifericos: {
    label: "Kit Periféricos",
    options: [
      { id: "none", label: "Sin periféricos adicionales", pricePen: 0 },
      { id: "office", label: "Kit Teclado + Mouse + Mousepad Oficina", pricePen: 110 },
      { id: "pro", label: "Kit Mecánico + Mouse Óptico + Mousepad XL", pricePen: 320 },
    ],
  },
};
