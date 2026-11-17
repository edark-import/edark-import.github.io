export type ServiceAudience = "todos" | "empresa" | "hogar";

export interface ServiceItem {
  slug: string;
  title: string;
  tagline: string;
  audience: Exclude<ServiceAudience, "todos">;
  modality: string;
  sla: string;
  startingPricePen: number;
  ctaLabel: string;
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

export interface LegacyQuote {
  texto: string;
  autor: string;
}

export const BRAND = {
  name: "eDark",
  subBrand: "Alpha Technologies",
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

export const LEGACY_QUOTES: LegacyQuote[] = [
  {
    texto: "La ciencia no es sino una perversión de sí misma a menos que tenga como objetivo final el mejoramiento de la humanidad.",
    autor: "Nikola Tesla",
  },
  {
    texto: "Cualquier cosa que pueda ser conectada, será conectada.",
    autor: "Kevin Ashton (Internet de las cosas)",
  },
  {
    texto: "La mejor manera de predecir el futuro es inventarlo.",
    autor: "Alan Kay",
  },
  {
    texto: "La innovación distingue a un líder de un seguidor.",
    autor: "Steve Jobs",
  },
  {
    texto: "La web es más una invención social que técnica. La diseñé para que la gente pudiera colaborar y compartir conocimiento.",
    autor: "Tim Berners-Lee",
  },
  {
    texto: "El mayor riesgo es no asumir ningún riesgo. En un mundo que cambia rápido, la única estrategia garantizada a fallar es no asumir riesgos.",
    autor: "Mark Zuckerberg",
  },
  {
    texto: "No es la fe en la tecnología. Es la fe en las personas.",
    autor: "Steve Jobs",
  },
  {
    texto: "La imaginación es más importante que el conocimiento.",
    autor: "Albert Einstein",
  },
  {
    texto: "El avance de la tecnología es basado en hacerla encajar para que no la notes, para que forme parte de la vida cotidiana.",
    autor: "Bill Gates",
  },
  {
    texto: "El mayor enemigo del conocimiento no es la ignorancia, es la ilusión del conocimiento.",
    autor: "Stephen Hawking",
  },
  {
    texto: "El verdadero progreso es el que pone la tecnología al alcance de todos.",
    autor: "Henry Ford",
  },
  {
    texto: "La informática no trata sobre computadoras más que la astronomía sobre telescopios.",
    autor: "Edsger Dijkstra",
  },
];

export const SERVICES: ServiceItem[] = [
  {
    slug: "consultoria",
    title: "Consultoría Tecnológica",
    tagline: "Soluciones y asesoría estratégica para empresas y hogares",
    audience: "empresa",
    modality: "Remoto o presencial en Lima",
    sla: "Diagnóstico en 24–48 h",
    startingPricePen: 220,
    ctaLabel: "Agendar diagnóstico TI",
    summary:
      "Evita compras equivocadas y caídas costosas: evaluamos tus redes, servidores, respaldos y ciberseguridad para entregarte un plan ejecutable con retorno claro.",
    deliverables: [
      "Auditoría de redes cableadas e inalámbricas: cobertura real, cuellos de botella y segmentación",
      "Arquitectura de sistemas: virtualización, migración segura y backups 3-2-1 automatizados",
      "Seguridad informática: revisión de vulnerabilidades, firewalls y hardening de accesos",
    ],
    benefits: [
      "Informe técnico accionable con presupuesto por prioridad",
      "Reduce interrupciones operativas y riesgo de pérdida de información",
      "Acompañamiento experto desde el diseño hasta la puesta en marcha",
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
    tagline: "Infraestructura escalable, seguridad de datos y transformación digital",
    audience: "empresa",
    modality: "Presencial en Lima / Híbrido",
    sla: "Plan operativo en 72 h",
    startingPricePen: 420,
    ctaLabel: "Solicitar plan B2B",
    summary:
      "Blindamos la operación de tu empresa con redes entre sucursales, control centralizado de accesos, políticas de seguridad y automatización de procesos.",
    deliverables: [
      "Redes corporativas y VPN/VLAN seguras para sedes, oficinas y trabajo remoto",
      "Gobierno de identidades (Active Directory / Microsoft 365) y respaldos automáticos",
      "Digitalización y automatización de flujos internos para reducir horas manuales",
    ],
    benefits: [
      "Continuidad operativa sin depender de soluciones improvisadas",
      "Control estricto de quién accede a la información crítica de tu negocio",
      "Acuerdos de confidencialidad y soporte continuo",
    ],
    faqs: [
      {
        q: "¿Pueden trabajar sobre nuestra red y equipos actuales?",
        a: "Sí, optimizamos la infraestructura existente antes de proponer nueva inversión.",
      },
    ],
  },
  {
    slug: "asesoramiento-hogar",
    title: "Asesoramiento Hogar",
    tagline: "Tecnología inteligente, Wi-Fi estable y seguridad para tu familia",
    audience: "hogar",
    modality: "Visita técnica en Lima o asesoría remota",
    sla: "Atención en 24 h",
    startingPricePen: 110,
    ctaLabel: "Mejorar mi red en casa",
    summary:
      "Elimina las zonas muertas de Wi-Fi para teletrabajo y estudios, integra domótica útil (cámaras, luces, asistentes) y protege la red de tu familia.",
    deliverables: [
      "Optimización Wi-Fi / Mesh de alta estabilidad en todos los ambientes del hogar",
      "Instalación y configuración de domótica: cámaras, iluminación inteligente y automatización",
      "Seguridad familiar: control parental, red aislada para invitados y respaldo de fotos/documentos",
    ],
    benefits: [
      "Recomendación imparcial antes de comprar routers o equipos inteligentes",
      "Configuración limpia, explicada sin tecnicismos y lista para usar",
    ],
    faqs: [
      {
        q: "¿Qué necesito antes de agendar?",
        a: "Solo indícanos tu operador de internet, pisos/ambientes de tu vivienda y tus objetivos.",
      },
    ],
  },
  {
    slug: "soporte",
    title: "Soporte Técnico",
    tagline: "Atención presencial y remota, rápida y confiable ante emergencias",
    audience: "hogar",
    modality: "Remoto inmediato o presencial",
    sla: "Respuesta < 30 min",
    startingPricePen: 75,
    ctaLabel: "Resolver incidencia ahora",
    summary:
      "Tu equipo de respuesta rápida cuando algo falla en el peor momento: computadoras lentas o bloqueadas, caída de red, virus o errores críticos de sistema.",
    deliverables: [
      "Triaje inmediato por WhatsApp para contener el problema sin demoras",
      "Diagnóstico remoto seguro o visita técnica en sitio con presupuesto transparente",
      "Limpieza de malware, recuperación de arranque, correo y conectividad",
    ],
    benefits: [
      "Atención ágil sin filas ni tickets perdidos",
      "Sabes el costo exacto antes de autorizar cualquier reparación",
    ],
    faqs: [
      {
        q: "¿Cómo funciona el soporte remoto?",
        a: "Coordinamos por WhatsApp una sesión cifrada bajo tu autorización y supervisión en vivo.",
      },
    ],
  },
  {
    slug: "mantenimiento",
    title: "Mantenimiento y Reparación",
    tagline: "Optimización y reparación de computadoras, laptops e impresoras",
    audience: "hogar",
    modality: "Taller o a domicilio (Lima)",
    sla: "Entrega en 24–48 h",
    startingPricePen: 95,
    ctaLabel: "Reservar mantenimiento",
    summary:
      "Evita fallas por sobrecalentamiento o lentitud: realizamos mantenimiento preventivo profesional, upgrades de SSD/RAM, reparaciones y recuperación de datos.",
    deliverables: [
      "Mantenimiento preventivo completo: limpieza interna, pasta térmica de alto rendimiento y optimización",
      "Reparación especializada de PCs, laptops, impresoras y cambio de componentes garantizados",
      "Upgrades (SSD NVMe / RAM) y recuperación segura de archivos importantes",
    ],
    benefits: [
      "Garantía escrita por servicio y seguimiento post-atención",
      "Alarga años la vida útil de tus equipos personales o corporativos",
    ],
    faqs: [
      {
        q: "¿Cada cuánto conviene hacer mantenimiento preventivo?",
        a: "Cada 6 meses en equipos de uso diario para evitar daños térmicos en placa o procesador.",
      },
    ],
  },
  {
    slug: "recicla",
    title: "Recicla Tecnología",
    tagline: "Reciclaje responsable R2v3 y borrado seguro de datos",
    audience: "empresa",
    modality: "Acopio programado (empresas y hogares)",
    sla: "Coordinación en 48 h",
    startingPricePen: 0,
    ctaLabel: "Coordinar entrega / recojo",
    summary:
      "Damos disposición responsable a computadoras, laptops, impresoras y equipos en desuso aplicando destrucción segura de datos y estándares de economía circular R2v3.",
    deliverables: [
      "Recepción y clasificación de hardware en desuso (PCs, laptops, impresoras, servidores)",
      "Borrado seguro y destrucción de información almacenada previo al reciclaje",
      "Trazabilidad bajo lineamientos internacionales de reciclaje electrónico responsable R2v3",
    ],
    benefits: [
      "Desocupa almacenes y oficinas sin riesgo de fuga de datos confidenciales",
      "Contribuye a la economía circular reduciendo residuos electrónicos tóxicos",
    ],
    faqs: [
      {
        q: "¿Tiene costo entregar equipos en desuso?",
        a: "La recepción y evaluación básica es gratuita; para retiros corporativos con certificado de borrado coordinamos la logística.",
      },
    ],
  },
];

// Precios reales de VENTA AL PÚBLICO EN PERÚ (incluyen margen comercial, IGV 18% y garantía)
export const PC_COMPONENTS: Record<string, { label: string; options: PcPartOption[] }> = {
  plataforma: {
    label: "Base (Placa + Fuente Certificada + Case + Ensamblaje)",
    options: [
      { id: "base-oficina", label: "Plataforma Oficina / Estudio (Placa Pro + Fuente 550W 80+ + Case + Armado)", pricePen: 790 },
      { id: "base-gamer", label: "Plataforma Gaming / Ingeniería (Placa VRM + Fuente 650W 80+ Bronze + Flujo Aire + Armado)", pricePen: 1190 },
      { id: "base-workstation", label: "Plataforma Workstation Pro (Placa ATX + Fuente 850W 80+ Gold + Refrigeración + Armado)", pricePen: 1850 },
    ],
  },
  procesador: {
    label: "Procesador",
    options: [
      { id: "i3-14", label: "Intel Core i3-14100 (14ª Gen)", pricePen: 790 },
      { id: "i5-14", label: "Intel Core i5-14400F / 14400 (14ª Gen)", pricePen: 1290 },
      { id: "i7-14", label: "Intel Core i7-14700K (14ª Gen)", pricePen: 2150 },
      { id: "i9-14", label: "Intel Core i9-14900K (14ª Gen)", pricePen: 2990 },
      { id: "r5-5600g", label: "AMD Ryzen 5 5600G (Radeon integrada)", pricePen: 690 },
      { id: "r5-7600x", label: "AMD Ryzen 5 7600X (AM5)", pricePen: 1250 },
      { id: "r7-7800x3d", label: "AMD Ryzen 7 7800X3D", pricePen: 2290 },
      { id: "r9-7900x", label: "AMD Ryzen 9 7900X", pricePen: 2490 },
    ],
  },
  ram: {
    label: "Memoria RAM",
    options: [
      { id: "16gb-ddr4", label: "16 GB (2x8 GB) DDR4 3200 MHz", pricePen: 280 },
      { id: "32gb-ddr4", label: "32 GB (2x16 GB) DDR4 3600 MHz", pricePen: 510 },
      { id: "16gb-ddr5", label: "16 GB (2x8 GB) DDR5 5600 MHz", pricePen: 420 },
      { id: "32gb-ddr5", label: "32 GB (2x16 GB) DDR5 6000 MHz", pricePen: 690 },
      { id: "64gb-ddr5", label: "64 GB (2x32 GB) DDR5 6000 MHz Workstation", pricePen: 1290 },
    ],
  },
  almacenamiento: {
    label: "Almacenamiento NVMe",
    options: [
      { id: "nvme-512", label: "M.2 NVMe 512 GB PCIe 4.0", pricePen: 290 },
      { id: "nvme-1tb", label: "M.2 NVMe 1 TB PCIe 4.0", pricePen: 460 },
      { id: "nvme-2tb", label: "M.2 NVMe 2 TB PCIe 4.0", pricePen: 850 },
      { id: "nvme-4tb", label: "M.2 NVMe 4 TB PCIe 4.0", pricePen: 1690 },
    ],
  },
  grafica: {
    label: "Tarjeta Gráfica (GPU)",
    options: [
      { id: "igpu", label: "Gráficos Integrados (Oficina / Estudio)", pricePen: 0 },
      { id: "rtx3060", label: "NVIDIA GeForce RTX 3060 12 GB", pricePen: 1590 },
      { id: "rtx4060", label: "NVIDIA GeForce RTX 4060 8 GB", pricePen: 1850 },
      { id: "rtx4060ti", label: "NVIDIA GeForce RTX 4060 Ti 16 GB", pricePen: 2590 },
      { id: "rtx4070s", label: "NVIDIA GeForce RTX 4070 Super 12 GB", pricePen: 3490 },
      { id: "rtx4080s", label: "NVIDIA GeForce RTX 4080 Super 16 GB", pricePen: 5790 },
      { id: "rx6600", label: "AMD Radeon RX 6600 8 GB", pricePen: 1190 },
      { id: "rx7700xt", label: "AMD Radeon RX 7700 XT 12 GB", pricePen: 2590 },
    ],
  },
  pantalla: {
    label: "Monitor (Opcional)",
    options: [
      { id: "none", label: "Sin monitor (solo PC ensamblada)", pricePen: 0 },
      { id: "fhd-24", label: 'Monitor 24" IPS Full HD 100 Hz', pricePen: 590 },
      { id: "qhd-27", label: 'Monitor 27" QHD IPS 165 Hz', pricePen: 1290 },
    ],
  },
  conectividad: {
    label: "Conectividad Wi-Fi & Bluetooth",
    options: [
      { id: "lan", label: "Ethernet Gigabit integrado", pricePen: 0 },
      { id: "wifi6e", label: "Adaptador PCIe Wi-Fi 6E + Bluetooth 5.3", pricePen: 210 },
    ],
  },
  perifericos: {
    label: "Kit Periféricos (Opcional)",
    options: [
      { id: "none", label: "Sin periféricos adicionales", pricePen: 0 },
      { id: "office", label: "Kit Teclado + Mouse + Mousepad Corporativo", pricePen: 145 },
      { id: "pro", label: "Kit Mecánico + Mouse Óptico Pro + Mousepad XL", pricePen: 390 },
    ],
  },
};
