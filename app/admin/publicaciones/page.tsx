export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { Producto } from "@/lib/types";
import PublicacionesAdmin from "@/components/admin/PublicacionesAdmin";

async function getProductosActivos(): Promise<Producto[]> {
  try {
    const { data } = await supabase
      .from("garshop_productos")
      .select("id, nombre, precio_venta, categoria, activo, imagen_url")
      .eq("activo", true)
      .order("nombre", { ascending: true });
    return (data as Producto[]) ?? [];
  } catch {
    return [];
  }
}

export default async function PublicacionesPage() {
  const productosActivos = await getProductosActivos();
  return <PublicacionesAdmin productosActivos={productosActivos} />;
}
