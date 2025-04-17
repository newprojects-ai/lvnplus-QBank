import { Template, TemplateVariable, TemplateValidationResult, TemplatePreview } from '../types/templates';

// Extract variables from template content using regex
export function extractVariables(content: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const matches = content.match(variableRegex) || [];
  return matches.map(match => match.slice(2, -2).trim());
}

// Validate template structure and variables
export function validateTemplate(template: Template): TemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingVariables: string[] = [];

  // Check basic template properties
  if (!template.name) {
    errors.push('Template name is required');
  }

  if (!template.currentVersion.content) {
    errors.push('Template content is required');
  }

  // Extract variables from content
  const contentVariables = extractVariables(template.currentVersion.content);
  
  // Check for undefined variables
  contentVariables.forEach(varName => {
    if (!template.currentVersion.variables.find(v => v.name === varName)) {
      missingVariables.push(varName);
    }
  });

  // Check for unused variables
  template.currentVersion.variables.forEach(variable => {
    if (!contentVariables.includes(variable.name)) {
      warnings.push(`Variable "${variable.name}" is defined but not used in template`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingVariables
  };
}

// Generate preview with variable substitution
export function generatePreview(template: Template, variables: Record<string, any>): TemplatePreview {
  let renderedContent = template.currentVersion.content;
  const missingVariables: string[] = [];

  // Replace variables in content
  template.currentVersion.variables.forEach(variable => {
    const value = variables[variable.name];
    const placeholder = `{{${variable.name}}}`;
    
    if (value === undefined || value === '') {
      missingVariables.push(variable.name);
      renderedContent = renderedContent.replaceAll(placeholder, '');
    } else {
      renderedContent = renderedContent.replaceAll(placeholder, value);
    }
  });

  return {
    template,
    variables,
    renderedContent,
    missingVariables,
    isValid: missingVariables.length === 0
  };
}

// Create a new template version
export function createTemplateVersion(
  template: Template,
  content: string,
  variables: TemplateVariable[],
  userId: string
): Template {
  const newVersion = {
    id: `${template.id}-v${template.versions.length + 1}`,
    version: template.versions.length + 1,
    content,
    variables,
    createdAt: new Date().toISOString(),
    createdBy: userId,
  };

  return {
    ...template,
    currentVersion: newVersion,
    versions: [...template.versions, newVersion],
  };
}
