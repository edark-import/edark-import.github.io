import { NextResponse } from "next/server";
import { fetchPublicProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET() {
  const { products, source } = await fetchPublicProducts();
  return NextResponse.json({ source, count: products.length, products });
}
