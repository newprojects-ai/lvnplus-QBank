import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Play, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template_text: string;
  variables: any[];
  extracted_variables: string[];
}

interface Task {
  id: string;
  template_id: string;
  variable_values: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  prompt_template: PromptTemplate;
}

interface FormData {
  template_id: string;
  variable_values: Record<string, any>;
}

export function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    template_id: '',
    variable_values: {},
  });
  const [processedTemplate, setProcessedTemplate] = useState<string>('');

  const { data: templates } = useQuery<PromptTemplate[]>({
    queryKey: ['prompt-templates'],
    queryFn: async () => {
      const response = await fetch('/api/prompt-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  const { data: tasks, refetch } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
  });

  const selectedTemplateData = templates?.find(t => t.id === selectedTemplate);
  
  // Process the template with variable values to show a preview
  useEffect(() => {
    if (!selectedTemplateData) {
      setProcessedTemplate('');
      return;
    }
    
    let previewText = selectedTemplateData.template_text;
    
    // Replace variables with their values or highlight missing ones
    Object.entries(formData.variable_values).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      previewText = previewText.replace(new RegExp(placeholder, 'g'), String(value));
    });
    
    // Highlight remaining variables that haven't been filled
    selectedTemplateData.extracted_variables.forEach(varName => {
      if (!formData.variable_values[varName]) {
        const placeholder = `{${varName}}`;
        previewText = previewText.replace(
          new RegExp(placeholder, 'g'), 
          `<span class="bg-yellow-100 text-yellow-800 px-1 rounded">${placeholder}</span>`
        );
      }
    });
    
    setProcessedTemplate(previewText);
  }, [selectedTemplateData, formData.variable_values]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all required variables have values
    if (selectedTemplateData) {
      const missingVariables = selectedTemplateData.extracted_variables.filter(
        varName => !formData.variable_values[varName]
      );
      
      if (missingVariables.length > 0) {
        toast.error(`Please fill in all variables: ${missingVariables.join(', ')}`);
        return;
      }
    }
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate,
          variable_values: JSON.stringify(formData.variable_values),
        }),
      });

      if (!response.ok) throw new Error('Failed to create task');

      setIsModalOpen(false);
      refetch();
      toast.success('Task created successfully');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  // Determine the input type for a variable based on its name and value
  const getInputTypeForVariable = (varName: string, currentValue: any) => {
    // Check if it's a JSON object (for things like difficulty_distribution)
    if (varName.includes('distribution') || varName.includes('config') || varName.includes('options')) {
      return 'json';
    }
    
    // Check if it's a number
    if (varName.includes('count') || varName.includes('total') || varName === 'level') {
      return 'number';
    }
    
    // Check if the current value is a number
    if (typeof currentValue === 'number') {
      return 'number';
    }
    
    // Default to text
    return 'text';
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <button
          onClick={() => {
            setSelectedTemplate('');
            setFormData({
              template_id: '',
              variable_values: {},
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      <div className="grid gap-6">
        {tasks?.map((task) => (
          <div key={task.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {task.prompt_template.name}
                </h2>
                <p className="text-gray-500">
                  Created: {new Date(task.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    task.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : task.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {task.status}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Variables</h3>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(JSON.parse(task.variable_values), null, 2)}
                </pre>
              </div>

              {task.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{task.error_message}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">New Task</h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    const templateId = e.target.value;
                    setSelectedTemplate(templateId);
                    
                    // Reset variable values when template changes
                    setFormData({
                      template_id: templateId,
                      variable_values: {},
                    });
                    
                    // Pre-populate with default values if available
                    const template = templates?.find(t => t.id === templateId);
                    if (template && template.variables) {
                      const defaultValues: Record<string, any> = {};
                      template.variables.forEach(v => {
                        if (v.default_value) {
                          defaultValues[v.name] = v.default_value;
                        }
                      });
                      
                      if (Object.keys(defaultValues).length > 0) {
                        setFormData({
                          template_id: templateId,
                          variable_values: defaultValues,
                        });
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                  required
                >
                  <option value="">Select a template</option>
                  {templates?.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplateData && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Template Preview</h3>
                    <div 
                      className="text-sm text-gray-600 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: processedTemplate }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">Variables</h3>
                      <div className="flex items-center text-xs text-gray-500">
                        <Info className="w-4 h-4 mr-1" />
                        <span>Fill in values for all variables in the template</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {selectedTemplateData.extracted_variables.map((varName) => {
                        const inputType = getInputTypeForVariable(
                          varName, 
                          formData.variable_values[varName]
                        );
                        
                        return (
                          <div key={varName} className="bg-white border rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {varName.charAt(0).toUpperCase() + varName.slice(1).replace(/_/g, ' ')}
                            </label>
                            
                            {inputType === 'json' ? (
                              <textarea
                                value={
                                  typeof formData.variable_values[varName] === 'object'
                                    ? JSON.stringify(formData.variable_values[varName], null, 2)
                                    : formData.variable_values[varName] || ''
                                }
                                onChange={(e) => {
                                  try {
                                    // Try to parse as JSON if possible
                                    const value = JSON.parse(e.target.value);
                                    setFormData({
                                      ...formData,
                                      variable_values: {
                                        ...formData.variable_values,
                                        [varName]: value,
                                      },
                                    });
                                  } catch {
                                    // If not valid JSON, store as string
                                    setFormData({
                                      ...formData,
                                      variable_values: {
                                        ...formData.variable_values,
                                        [varName]: e.target.value,
                                      },
                                    });
                                  }
                                }}
                                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                                rows={4}
                                placeholder={`{"key": "value"}`}
                              />
                            ) : (
                              <input
                                type={inputType}
                                value={formData.variable_values[varName] || ''}
                                onChange={(e) => {
                                  const value = inputType === 'number' 
                                    ? Number(e.target.value) 
                                    : e.target.value;
                                    
                                  setFormData({
                                    ...formData,
                                    variable_values: {
                                      ...formData.variable_values,
                                      [varName]: value,
                                    },
                                  });
                                }}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder={`Enter ${varName.replace(/_/g, ' ')}`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  disabled={!selectedTemplate}
                >
                  <Play className="w-5 h-5" />
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}