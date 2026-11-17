import { NextResponse } from "next/server";
import { BRAND } from "@/data/services";

interface QuotePayload {
  nombre?: unknown;
  contacto?: unknown;
  servicio?: unknown;
  detalle?: unknown;
}

export async function POST(request: Request) {
  let body: QuotePayload;
  try {
    body = (await request.json()) as QuotePayload;
  } catch {
    return NextResponse.json({ error: "Payload JSON inválido." }, { status: 400 });
  }

  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const contacto = typeof body.contacto === "string" ? body.contacto.trim() : "";
  const servicio = typeof body.servicio === "string" ? body.servicio.trim() : "";
  const detalle = typeof body.detalle === "string" ? body.detalle.trim() : "";

  if (nombre.length < 2 || nombre.length > 100) {
    return NextResponse.json({ error: "Ingresa un nombre válido (2-100 caracteres)." }, { status: 400 });
  }
  if (contacto.length < 6 || contacto.length > 120) {
    return NextResponse.json({ error: "Ingresa un teléfono o correo de contacto." }, { status: 400 });
  }
  if (!servicio || servicio.length > 120) {
    return NextResponse.json({ error: "Selecciona un servicio válido." }, { status: 400 });
  }
  if (detalle.length > 1500) {
    return NextResponse.json({ error: "El detalle excede los 1500 caracteres." }, { status: 400 });
  }

  const suffix = Math.floor(1000 + Math.random() * 9000);
  const ticket = `EDK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${suffix}`;
  const msg = [
    `Hola eDark, solicito atención (${ticket}):`,
    `• Servicio: ${servicio}`,
    `• Nombre: ${nombre}`,
    `• Contacto: ${contacto}`,
    detalle ? `• Detalle: ${detalle}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = `https://wa.me/${BRAND.whatsappDigits}?text=${encodeURIComponent(msg)}`;
  return NextResponse.json({ ticket, whatsappUrl }, { status: 201 });
}
