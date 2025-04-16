export interface TemplateVariable {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  variable_type_id: string;
  is_required: boolean;
  default_value?: string;
  validation_rules?: string;
  options?: string[];
  sort_order: number;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  template_text: string;
  variables: TemplateVariable[];
  created_at: string;
  created_by: string;
}

export interface TaskFormData {
  template_id: string;
  variable_values: {
    total_questions: number;
    difficulty_distribution: {
      [key: string]: number;
    };
    [key: string]: any;
  };
}

export interface TaskPreviewData {
  template?: Template;
  variables: {
    [key: string]: any;
  };
  isValid: boolean;
  missingVariables: string[];
}

export type VariableChangeHandler = (name: string, value: any) => void;