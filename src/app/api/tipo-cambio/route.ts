import { NextResponse } from "next/server";

const FALLBACK_RATE = 3.75;

export async function GET() {
  try {
    const res = await fetch("https://api.apis.net.pe/v1/tipo-cambio-sunat", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = (await res.json()) as { venta?: number; compra?: number; fecha?: string };
      const venta = Number(data.venta ?? data.compra);
      if (Number.isFinite(venta) && venta > 2 && venta < 10) {
        return NextResponse.json({
          venta: Number(venta.toFixed(3)),
          compra: Number((data.compra ?? venta).toFixed(3)),
          fecha: data.fecha ?? null,
          source: "sunat",
        });
      }
    }
  } catch {
    // Fallback seguro si el servicio externo no responde
  }

  return NextResponse.json({
    venta: FALLBACK_RATE,
    compra: 3.72,
    fecha: null,
    source: "referencial",
  });
}
