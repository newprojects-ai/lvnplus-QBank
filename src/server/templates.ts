import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from './middleware';

const prisma = new PrismaClient();

const variableSchema = z.object({
  id: z.string(),
  name: z.string(),
  display_name: z.string(),
  description: z.string().optional(),
  variable_type_id: z.string(),
  is_required: z.boolean(),
  default_value: z.string().optional(),
  validation_rules: z.string().optional(),
  options: z.string().optional(),
  sort_order: z.number(),
});

const promptTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  template_text: z.string().min(1),
  variables: z.array(variableSchema),
});

/**
 * Extract variable names from template text
 * Looks for patterns like {variable_name}
 */
function extractVariablesFromTemplate(templateText: string): string[] {
  const variableRegex = /{([^{}]+)}/g;
  const matches = templateText.match(variableRegex) || [];
  
  // Extract just the variable names without the braces
  return matches.map(match => match.slice(1, -1));
}

export async function getPromptTemplates(_req: Request, res: Response) {
  try {
    const templates = await prisma.prompt_templates.findMany({
      orderBy: { created_at: 'desc' },
    });
    
    // For each template, parse the variables JSON and add extracted variables
    const templatesWithParsedData = templates.map(template => {
      const parsedVariables = JSON.parse(template.variables || '[]');
      const extractedVariables = extractVariablesFromTemplate(template.template_text);
      
      return {
        ...template,
        variables: parsedVariables,
        extracted_variables: extractedVariables
      };
    });
    
    res.json(templatesWithParsedData);
  } catch (error) {
    console.error('Get prompt templates error:', error);
    res.status(500).json({ error: 'Failed to fetch prompt templates' });
  }
}

export async function createPromptTemplate(req: AuthRequest, res: Response) {
  try {
    const data = promptTemplateSchema.parse(req.body);
    
    // Extract variables from template text
    const extractedVariables = extractVariablesFromTemplate(data.template_text);
    
    // Ensure all extracted variables have corresponding variable definitions
    const definedVariableNames = data.variables.map(v => v.name);
    const missingVariables = extractedVariables.filter(v => !definedVariableNames.includes(v));
    
    if (missingVariables.length > 0) {
      // Automatically add missing variables with default settings
      for (const varName of missingVariables) {
        data.variables.push({
          id: crypto.randomUUID(),
          name: varName,
          display_name: varName.charAt(0).toUpperCase() + varName.slice(1).replace(/_/g, ' '),
          description: '',
          variable_type_id: 'text',
          is_required: true,
          sort_order: data.variables.length,
        });
      }
    }
    
    const template = await prisma.prompt_templates.create({
      data: {
        name: data.name,
        description: data.description,
        template_text: data.template_text,
        variables: JSON.stringify(data.variables),
        created_by: req.user!.userId,
      },
    });

    res.json(template);
  } catch (error) {
    console.error('Create prompt template error:', error);
    res.status(400).json({ error: 'Invalid template data' });
  }
}

export async function updatePromptTemplate(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = promptTemplateSchema.parse(req.body);
    
    // Extract variables from template text
    const extractedVariables = extractVariablesFromTemplate(data.template_text);
    
    // Ensure all extracted variables have corresponding variable definitions
    const definedVariableNames = data.variables.map(v => v.name);
    const missingVariables = extractedVariables.filter(v => !definedVariableNames.includes(v));
    
    if (missingVariables.length > 0) {
      // Automatically add missing variables with default settings
      for (const varName of missingVariables) {
        data.variables.push({
          id: crypto.randomUUID(),
          name: varName,
          display_name: varName.charAt(0).toUpperCase() + varName.slice(1).replace(/_/g, ' '),
          description: '',
          variable_type_id: 'text',
          is_required: true,
          sort_order: data.variables.length,
        });
      }
    }
    
    const template = await prisma.prompt_templates.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        template_text: data.template_text,
        variables: JSON.stringify(data.variables),
      },
    });

    res.json(template);
  } catch (error) {
    console.error('Update prompt template error:', error);
    res.status(400).json({ error: 'Failed to update template' });
  }
}

export async function deletePromptTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    await prisma.prompt_templates.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete prompt template error:', error);
    res.status(400).json({ error: 'Failed to delete template' });
  }
}

export async function getVariableTypes(_req: Request, res: Response) {
  try {
    // Return predefined variable types
    const types = [
      { id: 'text', name: 'Text', description: 'Single line text input', has_options: false },
      { id: 'textarea', name: 'Text Area', description: 'Multi-line text input', has_options: false },
      { id: 'number', name: 'Number', description: 'Numeric input with optional validation', has_options: false },
      { id: 'select', name: 'Select', description: 'Single selection from predefined options', has_options: true },
      { id: 'multi-select', name: 'Multi Select', description: 'Multiple selections from predefined options', has_options: true },
      { id: 'subject', name: 'Subject', description: 'Subject selection from LVNPLUS subjects', has_options: true },
      { id: 'topic', name: 'Topic', description: 'Topic selection based on selected subject', has_options: true },
      { id: 'subtopic', name: 'Subtopic', description: 'Subtopic selection based on selected topic', has_options: true },
      { id: 'difficulty', name: 'Difficulty Level', description: 'Difficulty level selection', has_options: true },
    ];
    
    res.json(types);
  } catch (error) {
    console.error('Get variable types error:', error);
    res.status(500).json({ error: 'Failed to fetch variable types' });
  }
}

export async function getVariableOptions(_req: Request, res: Response) {
  try {
    // Return predefined variable options
    const options = [
      // Difficulty options
      { id: 'diff_0', variable_type_id: 'difficulty', value: '0', label: 'Level 0 (Mental Math)', sort_order: 0 },
      { id: 'diff_1', variable_type_id: 'difficulty', value: '1', label: 'Level 1 (Easy)', sort_order: 1 },
      { id: 'diff_2', variable_type_id: 'difficulty', value: '2', label: 'Level 2 (Moderate)', sort_order: 2 },
      { id: 'diff_3', variable_type_id: 'difficulty', value: '3', label: 'Level 3 (Challenging)', sort_order: 3 },
      { id: 'diff_4', variable_type_id: 'difficulty', value: '4', label: 'Level 4 (Difficult)', sort_order: 4 },
      { id: 'diff_5', variable_type_id: 'difficulty', value: '5', label: 'Level 5 (Expert)', sort_order: 5 },
    ];
    
    res.json(options);
  } catch (error) {
    console.error('Get variable options error:', error);
    res.status(500).json({ error: 'Failed to fetch variable options' });
  }
}