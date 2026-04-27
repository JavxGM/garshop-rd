// ─── Plan de publicación ─────────────────────────────────────────────────────

export type DiaPlan = "lunes" | "miercoles" | "viernes";
export type TipoContenido =
  | "producto_directo"
  | "problema_solucion"
  | "cta_directo";

export interface CanalesPlan {
  instagram: boolean;
  facebook: boolean;
  marketplace: string; // texto libre (ej. "Publicado en perfil personal")
}

export interface PlanPublicacion {
  id: string;
  semana_inicio: string; // ISO date YYYY-MM-DD
  dia: DiaPlan;
  producto_id: string | null;
  tipo_contenido: TipoContenido;
  caption: string;
  canales: CanalesPlan;
  publicado: boolean;
  mensajes_recibidos: number;
  created_at: string;
}

export interface SemanaReview {
  id: string;
  semana_inicio: string;
  ventas_cerradas: number;
  notas: string;
  cerrada: boolean;
  created_at: string;
}

// ─── Productos y pedidos ──────────────────────────────────────────────────────

export type Categoria =
  | "microfono"
  | "adaptador"
  | "cable"
  | "audio"
  | "accesorios"
  | "otro";

export interface ProductoImagen {
  id: string;
  producto_id: string;
  url: string;
  orden: number;
  es_principal: boolean;
  created_at: string;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio_venta: number;
  precio_compra: number | null;
  stock: number;
  imagen_url: string | null;
  imagen_principal?: string | null;
  imagenes?: string[];
  categoria: Categoria;
  activo: boolean;
  created_at: string;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export type EstadoPedido = "pendiente" | "confirmado" | "entregado" | "cancelado";

export interface Pedido {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  items: ItemCarrito[];
  total: number;
  estado: EstadoPedido;
  notas: string | null;
  canal_origen?: "web" | "whatsapp" | "facebook" | null;
  created_at: string;
}
