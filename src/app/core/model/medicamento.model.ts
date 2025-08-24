export interface MedicamentoResponse {
  id: number;
  nombre: string;
  laboratorioId: number;
  laboratorioNombre: string;
  fechaFabricacion: string;   // yyyy-MM-dd
  fechaVencimiento: string;   // yyyy-MM-dd
  cantidadStock: number;
  valorUnitario: number;
}

export interface MedicamentoRequest {
  nombre: string;
  laboratorioId: number;
  fechaFabricacion: string;   // yyyy-MM-dd
  fechaVencimiento: string;   // yyyy-MM-dd
  cantidadStock: number;
  valorUnitario: number;
}

export interface CotizacionResponse {
  medicamentoId: number;
  medicamentoNombre: string;
  cantidadSolicitada: number;
  stockDisponible: number;
  valorUnitario: number;
  valorTotal: number;
  puedeVender: boolean;
}
