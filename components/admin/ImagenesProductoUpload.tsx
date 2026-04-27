"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Upload,
  Trash2,
  Star,
  StarOff,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertTriangle,
  ImageOff,
  Wand2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ProductoImagen } from "@/lib/types";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const EXTENSIONES_HEIC = [".heic", ".heif"];
const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB

function esArchivoValido(file: File): boolean {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const mimeValido = TIPOS_PERMITIDOS.includes(file.type);
  const esHeicPorExtension = EXTENSIONES_HEIC.includes(ext);
  return (mimeValido || esHeicPorExtension) && file.size <= TAMANO_MAXIMO_BYTES;
}
const MAX_IMAGENES = 10;

interface Props {
  productoId: string;
  imagenesIniciales: ProductoImagen[];
  onCambio?: (imagenes: ProductoImagen[]) => void;
}

type EstadoProcesamiento = "idle" | "procesando" | "error";

export default function ImagenesProductoUpload({
  productoId,
  imagenesIniciales,
  onCambio,
}: Props) {
  const [imagenes, setImagenes] = useState<ProductoImagen[]>(imagenesIniciales);
  const [estado, setEstado] = useState<EstadoProcesamiento>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progresoTexto, setProgresoTexto] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const notificar = useCallback(
    (nuevas: ProductoImagen[]) => {
      setImagenes(nuevas);
      onCambio?.(nuevas);
    },
    [onCambio]
  );

  const procesarConRemoveBg = async (archivos: File[]) => {
    if (imagenes.length + archivos.length > MAX_IMAGENES) {
      setError(`Máximo ${MAX_IMAGENES} imágenes por producto.`);
      return;
    }

    setEstado("procesando");
    setError(null);
    setProgresoTexto(`Procesando ${archivos.length} imagen${archivos.length > 1 ? "es" : ""}...`);

    const formData = new FormData();
    formData.append("producto_id", productoId);
    archivos.forEach((f) => formData.append("file", f));

    const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "garshop2024";

    try {
      const res = await fetch("/api/admin/procesar-imagen", {
        method: "POST",
        headers: { "x-admin-password": password },
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? `Error ${res.status}`);
      }

      // Recargar imágenes desde BD para tener los registros completos con IDs
      await recargarImagenes();

      if (json.fallidas > 0) {
        const detalles = json.errores
          ?.map((e: { archivo: string; error: string }) => e.archivo)
          .join(", ");
        setError(
          `${json.procesadas} procesada${json.procesadas !== 1 ? "s" : ""}, ${json.fallidas} fallida${json.fallidas !== 1 ? "s" : ""}${detalles ? `: ${detalles}` : ""}.`
        );
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEstado("idle");
      setProgresoTexto("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const subirSinProcesar = async (archivos: File[]) => {
    if (imagenes.length + archivos.length > MAX_IMAGENES) {
      setError(`Máximo ${MAX_IMAGENES} imágenes por producto.`);
      return;
    }

    setEstado("procesando");
    setError(null);
    setProgresoTexto(`Subiendo ${archivos.length} imagen${archivos.length > 1 ? "es" : ""}...`);

    const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "garshop2024";
    const errores: string[] = [];

    try {
      for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        if (archivos.length > 1) {
          setProgresoTexto(`Subiendo imagen ${i + 1} de ${archivos.length}...`);
        }

        const formData = new FormData();
        formData.append("productoId", productoId);
        formData.append("archivo", archivo);

        const res = await fetch("/api/admin/subir-imagen", {
          method: "POST",
          headers: { "x-admin-password": password },
          body: formData,
        });

        const json = await res.json();

        if (!res.ok) {
          errores.push(`${archivo.name}: ${json.error ?? `Error ${res.status}`}`);
        }
      }

      await recargarImagenes();

      if (errores.length > 0) {
        setError(
          `${archivos.length - errores.length} subida${archivos.length - errores.length !== 1 ? "s" : ""} correcta${archivos.length - errores.length !== 1 ? "s" : ""}, ${errores.length} fallida${errores.length !== 1 ? "s" : ""}: ${errores.join("; ")}`
        );
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEstado("idle");
      setProgresoTexto("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const recargarImagenes = async () => {
    const { data } = await supabase
      .from("garshop_producto_imagenes")
      .select("*")
      .eq("producto_id", productoId)
      .order("orden", { ascending: true });

    if (data) notificar(data as ProductoImagen[]);
  };

  const handleSeleccion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? []);
    if (archivos.length === 0) return;

    const invalidos = archivos.filter((f) => !esArchivoValido(f));
    if (invalidos.length > 0) {
      setError(
        `${invalidos.length} archivo${invalidos.length > 1 ? "s" : ""} inválido${invalidos.length > 1 ? "s" : ""}: solo JPEG/PNG/WebP/HEIC hasta 10 MB.`
      );
      e.target.value = "";
      return;
    }

    setError(null);
    procesarConRemoveBg(archivos);
  };

  const handleSubirSinProcesar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? []);
    if (archivos.length === 0) return;

    const invalidos = archivos.filter((f) => !esArchivoValido(f));
    if (invalidos.length > 0) {
      setError(`Archivos inválidos: solo JPEG/PNG/WebP/HEIC hasta 10 MB.`);
      e.target.value = "";
      return;
    }

    setError(null);
    subirSinProcesar(archivos);
  };

  const marcarPrincipal = async (imagen: ProductoImagen) => {
    if (imagen.es_principal) return;

    // Quitar es_principal de todas las del producto
    await supabase
      .from("garshop_producto_imagenes")
      .update({ es_principal: false })
      .eq("producto_id", productoId);

    await supabase
      .from("garshop_producto_imagenes")
      .update({ es_principal: true })
      .eq("id", imagen.id);

    notificar(
      imagenes.map((i) => ({ ...i, es_principal: i.id === imagen.id }))
    );
  };

  const moverOrden = async (imagen: ProductoImagen, direccion: "arriba" | "abajo") => {
    const idx = imagenes.findIndex((i) => i.id === imagen.id);
    const idxDestino = direccion === "arriba" ? idx - 1 : idx + 1;
    if (idxDestino < 0 || idxDestino >= imagenes.length) return;

    const nuevas = [...imagenes];
    [nuevas[idx], nuevas[idxDestino]] = [nuevas[idxDestino], nuevas[idx]];

    // Actualizar órdenes en BD
    await Promise.all(
      nuevas.map((img, i) =>
        supabase
          .from("garshop_producto_imagenes")
          .update({ orden: i })
          .eq("id", img.id)
      )
    );

    notificar(nuevas.map((img, i) => ({ ...img, orden: i })));
  };

  const eliminar = async (imagen: ProductoImagen) => {
    if (!confirm("¿Eliminar esta imagen?")) return;

    // Extraer el path del bucket desde la URL pública
    const url = new URL(imagen.url);
    const pathParts = url.pathname.split("/storage/v1/object/public/garshop-productos/");
    const storagePath = pathParts[1] ?? "";

    if (storagePath) {
      await supabase.storage.from("garshop-productos").remove([storagePath]);
    }

    await supabase.from("garshop_producto_imagenes").delete().eq("id", imagen.id);

    const restantes = imagenes.filter((i) => i.id !== imagen.id);

    // Si se eliminó la principal, promover la primera restante
    if (imagen.es_principal && restantes.length > 0) {
      await supabase
        .from("garshop_producto_imagenes")
        .update({ es_principal: true })
        .eq("id", restantes[0].id);
      restantes[0] = { ...restantes[0], es_principal: true };
    }

    notificar(restantes);
  };

  const puedeAgregar = imagenes.length < MAX_IMAGENES && estado === "idle";

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-400">
        Imágenes del producto
        <span className="ml-2 text-gray-600">
          ({imagenes.length}/{MAX_IMAGENES})
        </span>
      </label>

      {/* Grilla de imágenes existentes */}
      {imagenes.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {imagenes.map((img, idx) => (
            <div
              key={img.id}
              className={`relative overflow-hidden rounded-lg border ${
                img.es_principal
                  ? "border-cyan-500"
                  : "border-[#1e2a3a]"
              } bg-[#060c14]`}
            >
              <div className="relative aspect-square">
                <Image
                  src={img.url}
                  alt={`Imagen ${idx + 1}`}
                  fill
                  className="object-contain"
                  sizes="120px"
                />
              </div>

              {/* Badge principal */}
              {img.es_principal && (
                <div className="absolute left-1 top-1 rounded bg-cyan-500 px-1 py-0.5 text-[9px] font-bold text-white">
                  Principal
                </div>
              )}

              {/* Controles superpuestos */}
              <div className="absolute bottom-0 inset-x-0 flex items-center justify-between bg-black/70 px-1 py-0.5">
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => moverOrden(img, "arriba")}
                    disabled={idx === 0 || estado === "procesando"}
                    className="rounded p-0.5 text-gray-400 hover:text-white disabled:opacity-30"
                    title="Mover arriba"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moverOrden(img, "abajo")}
                    disabled={idx === imagenes.length - 1 || estado === "procesando"}
                    className="rounded p-0.5 text-gray-400 hover:text-white disabled:opacity-30"
                    title="Mover abajo"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => marcarPrincipal(img)}
                    disabled={img.es_principal || estado === "procesando"}
                    className="rounded p-0.5 text-gray-400 hover:text-yellow-400 disabled:opacity-30"
                    title={img.es_principal ? "Ya es principal" : "Marcar como principal"}
                  >
                    {img.es_principal ? (
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    onClick={() => eliminar(img)}
                    disabled={estado === "procesando"}
                    className="rounded p-0.5 text-gray-400 hover:text-red-400 disabled:opacity-30"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Celda vacía como drop zone adicional si hay espacio */}
          {puedeAgregar && (
            <label className="relative flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#1e2a3a] bg-[#060c14] text-gray-600 hover:border-cyan-500/40 hover:text-gray-400 transition">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                onChange={handleSeleccion}
                className="sr-only"
              />
              <div className="flex flex-col items-center gap-1">
                <Wand2 className="h-5 w-5" />
                <span className="text-[10px] text-center leading-tight">+foto</span>
              </div>
            </label>
          )}
        </div>
      )}

      {/* Área de upload principal (cuando no hay imágenes aún) */}
      {imagenes.length === 0 && estado === "idle" && (
        <div className="flex w-full flex-col items-center gap-3 rounded-lg border border-dashed border-[#1e2a3a] bg-[#060c14] px-4 py-8 text-center">
          <ImageOff className="h-8 w-8 text-gray-700" />
          <p className="text-sm font-medium text-gray-400">Subir fotos del producto</p>
          <p className="text-xs text-gray-700">JPEG, PNG, WebP o HEIC · máx. 10 MB · hasta 10 fotos</p>
          <div className="flex w-full gap-2 mt-1">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#1e2a3a] bg-[#0a1628] px-3 py-2.5 text-xs font-medium text-gray-400 hover:border-cyan-500/40 hover:text-gray-300 transition">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                onChange={handleSeleccion}
                className="sr-only"
              />
              <Wand2 className="h-3.5 w-3.5" />
              Con remove.bg
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#1e2a3a] bg-[#0a1628] px-3 py-2.5 text-xs font-medium text-gray-400 hover:border-[#2e3a4a] hover:text-gray-300 transition">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                onChange={handleSubirSinProcesar}
                className="sr-only"
              />
              <Upload className="h-3.5 w-3.5" />
              Sin procesar
            </label>
          </div>
        </div>
      )}

      {/* Estado de procesamiento */}
      {estado === "procesando" && (
        <div className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5 text-sm text-cyan-400">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span>{progresoTexto || "Procesando..."}</span>
          <span className="ml-auto text-xs text-cyan-500/60">puede tardar 5–15 s</span>
        </div>
      )}

      {/* Botones de acción (cuando ya hay imágenes y no está procesando) */}
      {imagenes.length > 0 && estado === "idle" && puedeAgregar && (
        <div className="flex gap-2">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#1e2a3a] bg-[#060c14] px-3 py-2 text-xs font-medium text-gray-400 hover:border-cyan-500/40 hover:text-gray-300 transition">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              onChange={handleSeleccion}
              className="sr-only"
            />
            <Wand2 className="h-3.5 w-3.5" />
            Agregar con remove.bg
          </label>
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#1e2a3a] bg-[#060c14] px-3 py-2 text-xs font-medium text-gray-400 hover:border-[#2e3a4a] hover:text-gray-300 transition">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              onChange={handleSubirSinProcesar}
              className="sr-only"
            />
            <Upload className="h-3.5 w-3.5" />
            Subir sin procesar
          </label>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-red-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
