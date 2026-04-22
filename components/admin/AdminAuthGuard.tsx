"use client";

import { useState, useEffect, ReactNode } from "react";
import { Cpu, Lock } from "lucide-react";

export default function AdminAuthGuard({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const ok = sessionStorage.getItem("garshop_admin") === "true";
    setAutenticado(ok);
    setCargando(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correcta = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "garshop2024";
    if (password === correcta) {
      sessionStorage.setItem("garshop_admin", "true");
      setAutenticado(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (cargando) return null;

  if (!autenticado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060c14] px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3">
            <Cpu className="h-10 w-10 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">
              Gar<span className="text-cyan-400">Shop</span>
              <span className="text-gray-400 text-sm font-normal">.rd</span>
              {" "}Admin
            </h1>
          </div>
          <form
            onSubmit={handleLogin}
            className="space-y-4 rounded-2xl border border-[#1e2a3a] bg-[#0d1520] p-6"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#1e2a3a] bg-[#060c14] py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500"
                />
              </div>
              {error && (
                <p className="mt-1 text-xs text-red-400">Contraseña incorrecta</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-500 py-2.5 font-semibold text-white transition hover:bg-cyan-600"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
