"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Cpu,
  LayoutDashboard,
  Package,
  ClipboardList,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
];

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const handleLogout = () => {
    sessionStorage.removeItem("garshop_admin");
    window.location.href = "/admin";
  };

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-[#1e2a3a] px-5 py-4">
        <Cpu className="h-5 w-5 text-cyan-400" />
        <span className="font-bold text-white">
          Gar<span className="text-cyan-400">Shop</span>
          <span className="text-gray-500 text-xs font-normal">.rd</span>
        </span>
        <span className="ml-auto rounded bg-cyan-500/20 px-1.5 py-0.5 text-xs font-medium text-cyan-400">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const activo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activo
                    ? "bg-cyan-500/15 text-cyan-400"
                    : "text-gray-400 hover:bg-[#1a2535] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-[#1e2a3a] px-3 py-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-[#1a2535] hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          Ver tienda
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-[#1a2535] hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Salir
        </button>
      </div>
    </>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileAbierto, setMobileAbierto] = useState(false);

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden w-56 flex-col border-r border-[#1e2a3a] bg-[#0a0f1a] md:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Top bar mobile */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-[#1e2a3a] bg-[#0a0f1a] px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-cyan-400" />
          <span className="font-bold text-white">
            Gar<span className="text-cyan-400">Shop</span>
            <span className="text-gray-500 text-xs font-normal">.rd</span>
          </span>
          <span className="ml-1 rounded bg-cyan-500/20 px-1.5 py-0.5 text-xs font-medium text-cyan-400">
            Admin
          </span>
        </div>
        <button
          onClick={() => setMobileAbierto(true)}
          className="rounded-lg p-2 text-gray-400 hover:bg-[#1a2535] hover:text-white"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Offset para top bar mobile */}
      <div className="h-14 md:hidden" />

      {/* Drawer mobile */}
      {mobileAbierto && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => setMobileAbierto(false)}
          />
          <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-64 flex-col border-r border-[#1e2a3a] bg-[#0a0f1a]">
            <div className="flex items-center justify-end px-4 py-3">
              <button
                onClick={() => setMobileAbierto(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-[#1a2535] hover:text-white"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setMobileAbierto(false)}
            />
          </aside>
        </>
      )}
    </>
  );
}
