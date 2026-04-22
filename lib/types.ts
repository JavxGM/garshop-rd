export type Categoria =
  | "microfono"
  | "adaptador"
  | "cable"
  | "audio"
  | "accesorios"
  | "otro";

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url: string | null;
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
  created_at: string;
}
