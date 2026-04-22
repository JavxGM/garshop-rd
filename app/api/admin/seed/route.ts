import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { CATALOGO_INICIAL } from "@/lib/catalogo";

export async function POST(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  const correcta = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "garshop2024";

  if (password !== correcta) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { error } = await supabase.from("garshop_productos").insert(CATALOGO_INICIAL);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, cantidad: CATALOGO_INICIAL.length });
}
