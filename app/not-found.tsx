import Link from "next/link";
import { Cpu, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1a] px-4 text-center">
      <Cpu className="mb-6 h-16 w-16 text-cyan-400/40" />
      <h1 className="mb-2 text-7xl font-extrabold tracking-tight text-white">
        404
      </h1>
      <p className="mb-2 text-xl font-semibold text-gray-300">
        Página no encontrada
      </p>
      <p className="mb-8 max-w-sm text-sm text-gray-500">
        Lo que buscas no existe o fue movido. Vuelve a la tienda para ver nuestro catálogo.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-white transition hover:bg-cyan-600 active:scale-95"
        >
          <Home className="h-4 w-4" />
          Ir a la tienda
        </Link>
        <Link
          href="/#productos"
          className="flex items-center gap-2 rounded-xl border border-[#1e2a3a] bg-[#0d1520] px-6 py-3 font-semibold text-gray-300 transition hover:border-cyan-500/40 hover:text-white"
        >
          <Search className="h-4 w-4" />
          Ver productos
        </Link>
      </div>
    </div>
  );
}
