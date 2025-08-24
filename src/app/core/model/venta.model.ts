export interface VentaCreateRequest {
  medicamentoId: number;
  cantidad: number;
}

export interface VentaItemResponse {
  medicamentoId: number;
  medicamentoNombre: string;
  cantidad: number;
  valorUnitario: number;
  valorLinea: number;
}

export interface VentaResponse {
  id: number;
  fechaHora: string;    // ISO
  valorTotal: number;
  items: VentaItemResponse[];
}
