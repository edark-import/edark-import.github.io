export interface PublicProduct {
  id: string;
  nombre: string;
  categoria: string;
  subcategoria: string;
  marca: string;
  modelo: string;
  precioPen: number;
  stock: number;
  destacado: boolean;
  descripcion: string;
  especificaciones: string[];
  capacidad: string;
  dimension: string;
  imagenUrl: string;
  imagenes: string[];
  origen: "firestore" | "respaldo";
}

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  arrayValue?: { values?: FirestoreValue[] };
}

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

const DEFAULT_IMG = "/img/Logo/isotipo_Negro.png";

export const FALLBACK_PRODUCTS: PublicProduct[] = [
  {
    id: "samsung-tab-s9-fe",
    nombre: "Galaxy Tab S9 FE + S PEN",
    categoria: "Tablets",
    subcategoria: "Productividad",
    marca: "Samsung",
    modelo: "SM-X510",
    precioPen: 1660,
    stock: 1,
    destacado: true,
    descripcion:
      "Tablet profesional con S Pen incluido, pantalla de 10.9 pulgadas y resistencia IP68 ideal para diseño, estudio y gestión corporativa.",
    especificaciones: [
      "Pantalla 10.9\" 90Hz",
      "Incluye S Pen original",
      "Resistencia al agua y polvo IP68",
    ],
    capacidad: "128 GB",
    dimension: "10.9\"",
    imagenUrl: "/img/Logo/Color_Logo.png",
    imagenes: ["/img/Logo/Color_Logo.png"],
    origen: "respaldo",
  },
];

function strVal(fields: Record<string, FirestoreValue>, key: string): string {
  const v = fields[key];
  if (!v) return "";
  if (typeof v.stringValue === "string") return v.stringValue.trim();
  if (typeof v.integerValue === "string") return v.integerValue.trim();
  if (typeof v.doubleValue === "number") return String(v.doubleValue);
  return "";
}

function numVal(fields: Record<string, FirestoreValue>, key: string): number {
  const v = fields[key];
  if (!v) return 0;
  if (typeof v.doubleValue === "number" && Number.isFinite(v.doubleValue)) return v.doubleValue;
  if (typeof v.integerValue === "string") {
    const parsed = Number(v.integerValue);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof v.stringValue === "string") {
    const parsed = Number(v.stringValue);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function boolVal(fields: Record<string, FirestoreValue>, key: string, defaultVal: boolean): boolean {
  const v = fields[key];
  if (!v || typeof v.booleanValue !== "boolean") return defaultVal;
  return v.booleanValue;
}

function strArrayVal(fields: Record<string, FirestoreValue>, key: string): string[] {
  const v = fields[key];
  if (!v) return [];
  if (v.arrayValue?.values) {
    return v.arrayValue.values
      .map((item) => item.stringValue?.trim() ?? "")
      .filter(Boolean);
  }
  if (typeof v.stringValue === "string" && v.stringValue.trim()) {
    return v.stringValue
      .split(/\n|;|•/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function safeImageUrl(raw: string): string {
  if (!raw) return DEFAULT_IMG;
  if (raw.startsWith("https://") || raw.startsWith("/img/")) return raw;
  return DEFAULT_IMG;
}

export async function fetchPublicProducts(): Promise<{
  products: PublicProduct[];
  source: "firestore" | "respaldo";
}> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "edark-store";
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/productos?pageSize=60`;

  try {
    const res = await fetch(endpoint, { next: { revalidate: 60 } });
    if (!res.ok) {
      return { products: FALLBACK_PRODUCTS, source: "respaldo" };
    }
    const data = (await res.json()) as { documents?: FirestoreDocument[] };
    const docs = data.documents ?? [];

    const mapped: PublicProduct[] = [];
    for (const doc of docs) {
      const fields = doc.fields;
      if (!fields) continue;
      // Filtrado seguro: omite inactivos y excluye precioCompra / valorGanancia / tipoGanancia
      const activo = boolVal(fields, "activo", true);
      if (!activo) continue;

      const id = doc.name.split("/").pop() || "";
      if (!id) continue;

      const rawPrice = numVal(fields, "precioVenta") || numVal(fields, "precio");
      const moneda = strVal(fields, "moneda").toUpperCase();
      const precioPen =
        moneda === "USD" ? Math.round(rawPrice * 3.78 * 100) / 100 : rawPrice;

      const mainImg = safeImageUrl(strVal(fields, "imagenUrl") || strVal(fields, "imagen"));
      const gallery = strArrayVal(fields, "imagenes").map(safeImageUrl);
      const imagenes = Array.from(new Set([mainImg, ...gallery].filter(Boolean)));

      mapped.push({
        id,
        nombre: strVal(fields, "nombre") || "Producto eDark",
        categoria: strVal(fields, "categoria") || "Tecnología",
        subcategoria: strVal(fields, "subcategoria") || "General",
        marca: strVal(fields, "marca") || "eDark",
        modelo: strVal(fields, "modelo"),
        precioPen,
        stock: Math.max(0, Math.floor(numVal(fields, "stock"))),
        destacado: boolVal(fields, "destacado", false),
        descripcion:
          strVal(fields, "descripcion") ||
          "Producto disponible en catálogo con asesoría técnica y garantía eDark Perú.",
        especificaciones: strArrayVal(fields, "especificaciones"),
        capacidad: strVal(fields, "capacidad"),
        dimension: strVal(fields, "dimension"),
        imagenUrl: mainImg,
        imagenes: imagenes.length > 0 ? imagenes : [DEFAULT_IMG],
        origen: "firestore",
      });
    }

    if (mapped.length === 0) {
      return { products: FALLBACK_PRODUCTS, source: "respaldo" };
    }
    return { products: mapped, source: "firestore" };
  } catch {
    return { products: FALLBACK_PRODUCTS, source: "respaldo" };
  }
}

export async function fetchPublicProductById(id: string): Promise<PublicProduct | null> {
  const { products } = await fetchPublicProducts();
  return products.find((item) => item.id === id) ?? null;
}
