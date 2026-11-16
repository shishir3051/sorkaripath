import { renderBrandIconResponse } from "@/lib/brandIcon";

export const dynamic = "force-static";

const ICON_VARIANTS: Record<string, { pixels: number; maskable: boolean }> = {
  "192x192.png": { pixels: 192, maskable: false },
  "512x512.png": { pixels: 512, maskable: false },
  "maskable-192x192.png": { pixels: 192, maskable: true },
  "maskable-512x512.png": { pixels: 512, maskable: true },
};

export function generateStaticParams() {
  return Object.keys(ICON_VARIANTS).map((size) => ({ size }));
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ size: string }> }
) {
  const { size } = await context.params;
  const spec = ICON_VARIANTS[size] ?? ICON_VARIANTS["512x512.png"];
  return renderBrandIconResponse(spec.pixels, spec.maskable);
}
