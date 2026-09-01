export type FIDefect = {
  id?: string;
  description: string;
  type: 'critical' | 'major' | 'minor';
  count: number;
  photo?: File | string | null;
};

export type FISizeBreakdown = {
  id?: string;
  color: string;
  size: string;
  order_qty: number;
  inspected_qty: number;
};

export type FIMeasurementSample = {
  id?: string;
  index?: number;
  sample_index?: number;
  value: number | string | null;
};

export type FIMeasurementRow = {
  id?: string;
  color?: string;
  size_name?: string;
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
  supplier: '',
  factory: '',
  order_quantity: 0,
  presented_qty: 0,
  inspection_type: 'Final',
  inspection_attempt: '1st',
  aql_level: '2.5',
  sample_size: 0,
  max_critical_allowed: 0,
  max_major_allowed: 0,
  max_minor_allowed: 0,
  total_cartons: 0,
  selected_cartons: 0,
  cartons_inspected: 0,
  carton_length: 0,
  carton_width: 0,
  carton_height: 0,
  gross_weight: 0,
  net_weight: 0,
  quantity_check: true,
  workmanship: 'Pass',
  packing_method: 'Pass',
  marking_label: 'Pass',
  data_measurement: 'Pass',
  hand_feel: 'Pass',
  remarks: '',
  decision: '',
};

export type FIFormData = typeof INITIAL_FI_FORM_STATE;

