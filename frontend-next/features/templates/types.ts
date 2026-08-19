export type POM = {
  name: string;
  default_tol: number;
};

export type TemplateFormValues = {
  name: string;
  description: string;
  customer: string;
  poms: POM[];
};

export type StyleTemplate = {
  id: string;
  name: string;
  description?: string;
  customer?: string;
  customer_name?: string;
  poms: { id?: string; pom_name: string; tol?: number; std?: string }[];
  created_at: string;
};
