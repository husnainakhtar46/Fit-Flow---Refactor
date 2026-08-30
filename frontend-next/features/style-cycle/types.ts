export type SampleImage = {
  id: string;
  image: string;
  image_url?: string;
  caption?: string;
  category?: 'general' | 'fit' | 'workmanship' | 'wash' | 'fabric' | 'accessories' | string;
  uploaded_at?: string;
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
  general_edited_at?: string;
  fit_edited_at?: string;
  workmanship_edited_at?: string;
  wash_edited_at?: string;
  fabric_edited_at?: string;
  accessories_edited_at?: string;
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
  comments?: SampleComment[];
  links?: { id: string; label: string; url: string; created_at: string }[];
};

export const INITIAL_STYLE_STATE = {
  po_number: '',
  style_name: '',
  color: '',
  customer: '',
  season: '',
};

export const SAMPLE_STAGES = [
  'Fit Sample',
  'PP Sample',
  'Size Set',
  'SMS',
  'Shipment Sample',
  'Proto',
];

export type CommentCategoryKey = 'general' | 'fit' | 'workmanship' | 'wash' | 'fabric' | 'accessories';

export interface CommentCategoryConfig {
  key: CommentCategoryKey;
  label: string;
  commentField: keyof Pick<
    SampleComment,
    | 'comments_general'
    | 'comments_fit'
    | 'comments_workmanship'
    | 'comments_wash'
    | 'comments_fabric'
    | 'comments_accessories'
  >;
  placeholder: string;
}

export const COMMENT_CATEGORIES: CommentCategoryConfig[] = [
  {
    key: 'general',
    label: 'General Feedback',
    commentField: 'comments_general',
    placeholder: 'General feedback, summary remarks, overall sample feedback...',
  },
  {
    key: 'fit',
    label: 'Fit Comments',
    commentField: 'comments_fit',
    placeholder: 'Fit remarks, silhouette balance, measurements...',
  },
  {
    key: 'workmanship',
    label: 'Workmanship Comments',
    commentField: 'comments_workmanship',
    placeholder: 'Stitching, construction, seam quality, finishing...',
  },
  {
    key: 'wash',
    label: 'Wash Comments',
    commentField: 'comments_wash',
    placeholder: 'Wash shade, effect, handfeel, dry processing...',
  },
  {
    key: 'fabric',
    label: 'Fabric Comments',
    commentField: 'comments_fabric',
    placeholder: 'Fabric weight, color matching, texture, defects...',
  },
  {
    key: 'accessories',
    label: 'Accessories Comments',
    commentField: 'comments_accessories',
    placeholder: 'Labels, tags, buttons, zippers, trims...',
  },
];
