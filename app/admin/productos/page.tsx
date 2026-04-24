export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { Producto } from "@/lib/types";
import ProductosAdmin from "@/components/admin/ProductosAdmin";

async function getProductos(): Promise<Producto[]> {
  try {
    const { data } = await supabase
      .from("garshop_productos")
      .select(`
        *,
        garshop_producto_imagenes!producto_id(id, url, orden, es_principal, created_at)
      `)
      .order("created_at", { ascending: false });

    if (!data) return [];

    return data.map((p) => {
      const imgs = (p.garshop_producto_imagenes ?? []) as {
        url: string;
        orden: number;
        es_principal: boolean;
      }[];
      const ordenadas = [...imgs].sort((a, b) => a.orden - b.orden);
      const principal = ordenadas.find((i) => i.es_principal)?.url ?? ordenadas[0]?.url ?? null;
      return {
        ...p,
        imagen_principal: principal,
        imagenes: ordenadas.map((i) => i.url),
      } satisfies Producto;
    });
  } catch {
    return [];
  }
}

export default async function ProductosPage() {
  const productos = await getProductos();
  return <ProductosAdmin productosIniciales={productos} />;
}
