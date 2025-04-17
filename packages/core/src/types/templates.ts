export type VariableType = 
  | 'text' 
  | 'number' 
  | 'select' 
  | 'multiselect'
  | 'boolean'
  | 'date';

export interface VariableValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
}

export interface TemplateVariable {
  id: string;
  name: string;
  type: VariableType;
  displayName: string;
  description?: string;
  defaultValue?: string;
  validation?: VariableValidation;
  category?: string;
  is_required: boolean;
  sort_order: number;
}

export interface TemplateVersion {
  id: string;
  version: number;
  content: string;
  variables: TemplateVariable[];
  createdAt: string;
  createdBy: string;
}

export interface Template {
  id: string;
  name: string;
  currentVersion: TemplateVersion;
  versions: TemplateVersion[];
  createdAt: string;
  createdBy: string;
}

export interface TemplatePreview {
  template: Template;
  variables: Record<string, any>;
  renderedContent: string;
  missingVariables: string[];
  isValid: boolean;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingVariables: string[];
}
