export type ImageSlot = {
  file: File | string | null;
  caption: string;
};

export type MeasurementSample = {
  index: number;
  value: number | string | null;
};

export type Measurement = {
  pom_name: string;
  tol: number | string;
  std: number | string;
  samples: MeasurementSample[];
};

export type AccessoryItem = {
  name: string;
  status?: string;
  comment?: string;
};

export const ACCESSORY_PRESETS = [
  'Heat Transfer Label', 'Embroidery', 'PC Lining', 'Fusing',
  'Elastic', 'Button', 'Rivet', 'Zipper',
  'Main Label', 'Size Label', 'PU Patch', 'Hang Tag',
  'Over Rider Tag', 'Tab Label', 'Price Ticket', 'Hook & Eye', 'Care Label'
];

export const INITIAL_FORM_STATE = {
  style: '',
  color: '',
  po_number: '',
  factory: '',
  stage: 'Proto',
  template: '',
  customer: '',
  customer_remarks: '',
  customer_fit_comments: '',
  customer_workmanship_comments: '',
  customer_wash_comments: '',
  customer_fabric_comments: '',
  customer_accessories_comments: '',
  customer_comments_addressed: false,
  qa_fit_comments: '',
  qa_workmanship_comments: '',
  qa_wash_comments: '',
  qa_fabric_comments: '',
  qa_accessories_comments: '',
  fabric_handfeel: 'OK',
  fabric_pilling: 'None',
  remarks: '',
  decision: '',
};

export type EvaluationFormData = typeof INITIAL_FORM_STATE;
