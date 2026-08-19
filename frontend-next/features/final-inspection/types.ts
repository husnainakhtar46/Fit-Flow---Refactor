export type FIDefect = {
  description: string;
  type: 'critical' | 'major' | 'minor';
  count: number;
};

export type FISizeBreakdown = {
  color: string;
  size: string;
  order_qty: number;
  inspected_qty: number;
};

export type FIMeasurementSample = {
  size: string;
  sample_index: number;
  value: number | string | null;
};

export type FIMeasurementRow = {
  pom_name: string;
  tol: number | string;
  std: number | string;
  samples: FIMeasurementSample[];
};

export const INITIAL_FI_FORM_STATE = {
  style: '',
  color: '',
  po_number: '',
  customer: '',
  factory: '',
  order_quantity: 0,
  inspection_type: 'Final',
  aql_level: '2.5',
  sample_size: 0,
  max_critical_allowed: 0,
  max_major_allowed: 0,
  max_minor_allowed: 0,
  total_cartons: 0,
  cartons_inspected: 0,
  packaging_passed: true,
  carton_drop_test_passed: true,
  barcode_check_passed: true,
  remarks: '',
  decision: '',
};

export type FIFormData = typeof INITIAL_FI_FORM_STATE;
