"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

interface Props {
  imagenes: string[];
  nombre: string;
  sinStock: boolean;
  stockBajo: number | null; // null = sin aviso; número = "Últimas N unidades"
}

export default function ProductImageGallery({
  imagenes,
  nombre,
  sinStock,
  stockBajo,
}: Props) {
  const [activa, setActiva] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const total = imagenes.length;

  const anterior = () => setActiva((prev) => (prev - 1 + total) % total);
  const siguiente = () => setActiva((prev) => (prev + 1) % total);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) {
      delta > 0 ? siguiente() : anterior();
    }
    touchStartX.current = null;
  };

  if (total === 0) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#1e2a3a] bg-[#0d1520]">
        <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-700">
          <ImageOff className="h-20 w-20" />
          <p className="text-sm text-gray-600">Sin imagen disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Imagen principal */}
      <div
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#1e2a3a] bg-[#0d1520] select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          key={imagenes[activa]}
          src={imagenes[activa]}
          alt={`${nombre} — imagen ${activa + 1}`}
          fill
          priority={activa === 0}
          className="object-contain transition-opacity duration-200"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Flechas — solo si hay más de una imagen */}
        {total > 1 && (
          <>
            <button
              onClick={anterior}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={siguiente}
              aria-label="Imagen siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Indicador de posición */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imagenes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiva(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === activa
                      ? "w-4 bg-cyan-400"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Badge agotado */}
        {sinStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <span className="rounded-full bg-red-500/90 px-4 py-2 text-sm font-bold text-white">
              Agotado
            </span>
          </div>
        )}

        {/* Badge stock bajo */}
        {!sinStock && stockBajo !== null && (
          <span className="absolute bottom-3 left-3 rounded-full bg-cyan-500/90 px-3 py-1 text-xs font-medium text-white">
            ¡Últimas {stockBajo} unidades!
          </span>
        )}
      </div>

      {/* Thumbnails — solo si hay más de una imagen */}
      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imagenes.map((url, i) => (
            <button
              key={url}
              onClick={() => setActiva(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                i === activa
                  ? "border-cyan-400 opacity-100"
                  : "border-[#1e2a3a] opacity-50 hover:opacity-80"
              }`}
            >
              <Image
                src={url}
                alt={`${nombre} miniatura ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
