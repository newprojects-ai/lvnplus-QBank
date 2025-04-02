import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Extract variable names from template text using regex
function extractVariablesFromTemplate(templateText: string): string[] {
  const variableRegex = /{([^{}]+)}/g;
  const matches = templateText.match(variableRegex) || [];
  return matches.map(match => match.slice(1, -1));
}

// Get all templates
export async function getTemplates(_req: Request, res: Response) {
  try {
    const templates = await prisma.prompt_templates.findMany();

    // Add extracted variables to each template
    const templatesWithExtractedVars = templates.map(template => {
      // Parse the variables JSON string
      const variables = JSON.parse(template.variables || '[]');
      
      return {
        ...template,
        variables,
        extracted_variables: extractVariablesFromTemplate(template.template_text),
      };
    });

    res.json(templatesWithExtractedVars);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
}

// Get a template by ID
export async function getTemplateById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const template = await prisma.prompt_templates.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Parse the variables JSON string
    const variables = JSON.parse(template.variables || '[]');

    // Add extracted variables to the template
    const templateWithExtractedVars = {
      ...template,
      variables,
      extracted_variables: extractVariablesFromTemplate(template.template_text),
    };

    res.json(templateWithExtractedVars);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
}

// Create a new template
export async function createTemplate(req: Request, res: Response) {
  console.log('Create template request body:', req.body);
  const { name, description, template_text, variables } = req.body;

  if (!name || !template_text) {
    console.error('Missing required fields: name or template_text');
    return res.status(400).json({ error: 'Name and template text are required' });
  }

  try {
    // Extract variables from the template text
    const extractedVariables = extractVariablesFromTemplate(template_text);
    console.log('Extracted variables:', extractedVariables);
    
    // Use provided variables if available, otherwise create from extracted variables
    let variableObjects = Array.isArray(variables) ? variables : [];
    console.log('Variables from request:', variableObjects);
    
    // If no variables provided, create from extracted variables
    if (!variableObjects || variableObjects.length === 0) {
      variableObjects = extractedVariables.map(varName => ({
        id: crypto.randomUUID(), // Add ID for each variable
        name: varName,
        display_name: varName.charAt(0).toUpperCase() + varName.slice(1).replace(/_/g, ' '),
        description: `Variable for ${varName}`,
        variable_type_id: 'text',
        is_required: true,
        sort_order: 0,
      }));
      console.log('Generated variable objects:', variableObjects);
    }

    // Ensure each variable has an ID
    variableObjects = variableObjects.map(v => {
      if (!v.id) {
        return { ...v, id: crypto.randomUUID() };
      }
      return v;
    });

    // Create the template
    const template = await prisma.prompt_templates.create({
      data: {
        name,
        description: description || '',
        template_text,
        variables: JSON.stringify(variableObjects),
        created_by: 'system', // Adding required field
      },
    });

    console.log('Template created successfully:', template.id);
    res.status(201).json({
      ...template,
      variables: variableObjects,
      extracted_variables: extractedVariables,
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Update a template
export async function updateTemplate(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, template_text, variables } = req.body;

  try {
    // Get the existing template
    const existingTemplate = await prisma.prompt_templates.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Extract variables from the updated template text
    const extractedVariables = extractVariablesFromTemplate(template_text);

    // Use provided variables if available
    let variableObjects = variables || [];
    
    // If no variables provided, use existing ones or create new ones
    if (!variableObjects || variableObjects.length === 0) {
      // Parse existing variables
      const existingVariables = JSON.parse(existingTemplate.variables || '[]');
      const existingVarNames = existingVariables.map((v: { name: string }) => v.name);

      // Add any new variables that don't exist yet
      const variablesToAdd = extractedVariables.filter(v => !existingVarNames.includes(v));
      variableObjects = [
        ...existingVariables,
        ...variablesToAdd.map(varName => ({
          name: varName,
          display_name: varName.charAt(0).toUpperCase() + varName.slice(1).replace(/_/g, ' '),
          description: `Variable for ${varName}`,
          variable_type_id: 'text',
          is_required: true,
          sort_order: existingVariables.length,
        })),
      ];
    }

    // Update the template
    const template = await prisma.prompt_templates.update({
      where: { id },
      data: {
        name,
        description: description || '',
        template_text,
        variables: JSON.stringify(variableObjects),
      },
    });

    res.json({
      ...template,
      variables: variableObjects,
      extracted_variables: extractedVariables,
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
}

// Delete a template
export async function deleteTemplate(req: Request, res: Response) {
  const { id } = req.params;

  try {
    // Delete the template
    await prisma.prompt_templates.delete({
      where: { id },
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
}