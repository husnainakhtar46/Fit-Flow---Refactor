export type SampleImage = {
  id: string;
  image: string;
  caption?: string;
  created_at?: string;
};

export type SampleComment = {
  id: string;
  sample_type?: string;
  sample_stage?: string;
  sample_number?: number;
  sample_number_display?: string;
  comments_general?: string;
  comments_fit?: string;
  comments_workmanship?: string;
  comments_wash?: string;
  comments_fabric?: string;
  comments_accessories?: string;
  status?: 'pending' | 'in_review' | 'approved' | 'rejected' | 'revised';
  sample_submission_date?: string;
  courier_tracking_number?: string;
  created_at: string;
  updated_at?: string;
  images?: SampleImage[];
};

export type StyleMaster = {
  id: string;
  po_number: string;
  style_name: string;
  color: string;
  customer?: string;
  customer_name?: string;
  season?: string;
  created_at: string;
  updated_at?: string;
  comments_count?: number;
  latest_stage?: string;
  latest_status?: string;
};

export const INITIAL_STYLE_STATE = {
  po_number: '',
  style_name: '',
  color: '',
  customer: '',
  season: '',
};

export const SAMPLE_STAGES = [
  'Proto',
  'Fit',
  'SMS',
  'Size Set',
  'PPS',
  'Shipment Sample',
];
