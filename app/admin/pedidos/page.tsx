export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { Pedido } from "@/lib/types";
import PedidosAdmin from "@/components/admin/PedidosAdmin";

async function getPedidos(): Promise<Pedido[]> {
  try {
    const { data } = await supabase
      .from("garshop_pedidos")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function PedidosPage() {
  const pedidos = await getPedidos();
  return <PedidosAdmin pedidosIniciales={pedidos} />;
}
