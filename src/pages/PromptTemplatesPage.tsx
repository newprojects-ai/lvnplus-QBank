import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template_text: string;
  variables: TemplateVariable[];
  created_at: string;
  created_by: string;
}

interface TemplateVariable {
  id: string;
  name: string;
  display_name: string;
  description: string;
  variable_type_id: string;
  is_required: boolean;
  default_value?: string;
  validation_rules?: string;
  options?: string;
  sort_order: number;
}

interface VariableType {
  id: string;
  name: string;
  description: string;
  has_options: boolean;
}

interface VariableOption {
  id: string;
  variable_type_id: string;
  value: string;
  label: string;
  description?: string;
}

interface FormData {
  name: string;
  description: string;
  template_text: string;
  variables: TemplateVariable[];
}

// Pre-defined variables that can be used in templates
const predefinedVariables = [
  {
    name: 'subject',
    display_name: 'Subject',
    description: 'The academic subject for the questions',
    variable_type_id: 'master_data',
    is_required: true,
    master_data_source: 'subjects',
  },
  {
    name: 'topic',
    display_name: 'Topic',
    description: 'The topic within the subject',
    variable_type_id: 'master_data',
    is_required: true,
    master_data_source: 'topics',
  },
  {
    name: 'subtopic',
    display_name: 'Subtopic',
    description: 'The subtopic within the topic',
    variable_type_id: 'master_data',
    is_required: true,
    master_data_source: 'subtopics',
  },
  {
    name: 'difficulty_level',
    display_name: 'Difficulty Level',
    description: 'The difficulty level of the questions',
    variable_type_id: 'master_data',
    is_required: true,
    master_data_source: 'difficulty_levels',
  },
  {
    name: 'total_questions',
    display_name: 'Total Questions',
    description: 'The number of questions to generate',
    variable_type_id: 'number',
    is_required: true,
  },
  {
    name: 'difficulty_distribution',
    display_name: 'Difficulty Distribution',
    description: 'The distribution of questions across difficulty levels',
    variable_type_id: 'json',
    is_required: true,
  },
  {
    name: 'katex_style',
    display_name: 'KaTeX Style',
    description: 'The style of KaTeX rendering',
    variable_type_id: 'text',
    is_required: false,
  }
];

export function PromptTemplatesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    template_text: '',
    variables: [],
  });
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);

  // Retrieve token from local storage
  const token = localStorage.getItem('auth_token');

  const { data: variableTypes } = useQuery<VariableType[]>({
    queryKey: ['variable-types'],
    queryFn: async () => {
      if (!token) {
        toast.error("Authentication token not found.");
        throw new Error('Authentication token not found');
      }
      const response = await fetch('/api/variable-types', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch variable types');
      return response.json();
    },
  });

  const { data: variableOptions } = useQuery<VariableOption[]>({
    queryKey: ['variable-options'],
    queryFn: async () => {
      if (!token) {
        toast.error("Authentication token not found.");
        throw new Error('Authentication token not found');
      }
      const response = await fetch('/api/variable-options', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch variable options');
      return response.json();
    },
  });

  const { data: templates, refetch } = useQuery<PromptTemplate[]>({
    queryKey: ['prompt-templates'],
    queryFn: async () => {
      if (!token) {
        toast.error("Authentication token not found.");
        throw new Error('Authentication token not found');
      }
      const response = await fetch('/api/prompt-templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  // Fetch master data for subjects
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      if (!token) {
        toast.error("Authentication token not found.");
        throw new Error('Authentication token not found');
      }
      const response = await fetch('/api/master-data/subjects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch subjects');
      return response.json();
    },
  });

  // Effect to update variables when selectedVariables changes
  useEffect(() => {
    const newVariables = selectedVariables.map(varName => {
      const predefined = predefinedVariables.find(v => v.name === varName);
      if (!predefined) return null;
      
      return {
        id: uuidv4(),
        name: predefined.name,
        display_name: predefined.display_name,
        description: predefined.description,
        variable_type_id: predefined.variable_type_id,
        is_required: predefined.is_required,
        sort_order: 0,
      };
    }).filter(Boolean) as TemplateVariable[];
    
    setFormData(prev => ({
      ...prev,
      variables: newVariables,
    }));
  }, [selectedVariables]);

  // Function to insert a variable into the template text
  const insertVariableIntoTemplate = (variableName: string) => {
    const textArea = document.getElementById('template-text') as HTMLTextAreaElement;
    if (!textArea) return;
    
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const text = formData.template_text;
    const variableText = `{${variableName}}`;
    
    const newText = text.substring(0, start) + variableText + text.substring(end);
    setFormData({ ...formData, template_text: newText });
    
    // Add to selected variables if not already selected
    if (!selectedVariables.includes(variableName)) {
      setSelectedVariables([...selectedVariables, variableName]);
    }
    
    // Focus back on the textarea and set cursor position after the inserted variable
    setTimeout(() => {
      textArea.focus();
      textArea.setSelectionRange(start + variableText.length, start + variableText.length);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting template data:', formData);
      console.log('Sending template text to backend:', JSON.stringify(formData.template_text));
      
      // Ensure token is checked before mutation
      if (!token) {
        toast.error("Authentication token not found. Cannot save template.");
        return; // Prevent mutation if no token
      }
      
      const response = await fetch(
        editingTemplate ? `/api/prompt-templates/${editingTemplate.id}` : '/api/prompt-templates',
        {
          method: editingTemplate ? 'PUT' : 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData),
        }
      );

      const responseData = await response.json().catch(() => ({}));
      console.log('Response status:', response.status, 'Response data:', responseData);

      if (!response.ok) {
        console.error('Failed to save template:', responseData);
        throw new Error(`Failed to save template: ${responseData.error || 'Unknown error'}`);
      }

      setIsModalOpen(false);
      setEditingTemplate(null);
      refetch();
      toast.success(editingTemplate ? 'Template updated' : 'Template created');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    // Ensure token is checked before mutation
    if (!token) {
      toast.error("Authentication token not found. Cannot delete template.");
      return; // Prevent mutation if no token
    }
    
    try {
      const response = await fetch(`/api/prompt-templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Unauthorized. Could not delete template.");
        } else {
          toast.error(`Error deleting template: ${response.statusText}`);
        }
        throw new Error('Failed to delete template');
      }

      toast.success('Template deleted successfully!');
      refetch(); // Refetch the templates list
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Prompt Templates</h1>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setFormData({
              name: '',
              description: '',
              template_text: '',
              variables: [],
            });
            setSelectedVariables([]);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          New Template
        </button>
      </div>

      <div className="grid gap-6">
        {templates?.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{template.name}</h2>
                <p className="text-gray-600">{template.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingTemplate(template);
                    setFormData({
                      name: template.name,
                      description: template.description,
                      template_text: template.template_text,
                      variables: template.variables,
                    });
                    setSelectedVariables(template.variables.map(v => v.name));
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Template Text</h3>
                <pre 
                  className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: template.template_text.replace(/{([^{}]+)}/g, (match) => 
                      `<span class="bg-indigo-100 text-indigo-800 px-1 rounded">${match}</span>`
                    )
                  }}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Variables</h3>
                <div className="flex flex-wrap gap-2">
                  {template.variables.map((variable) => (
                    <span 
                      key={variable.id} 
                      className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm flex items-center"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {variable.display_name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'New Template'}
                </h2>
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
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Text
                  </label>
                  <div className="relative">
                    <textarea
                      id="template-text"
                      value={formData.template_text}
                      onChange={(e) => setFormData({ ...formData, template_text: e.target.value })}
                      className="w-full h-64 px-3 py-2 border rounded-lg font-mono text-sm"
                      required
                      style={{
                        color: 'black',
                        background: 'white',
                      }}
                    />
                    <div className="mt-2">
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <p className="text-xs text-gray-500 mb-2">Preview:</p>
                        <div 
                          className="p-2 border rounded bg-white text-sm whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: formData.template_text.replace(/{([^{}]+)}/g, (match) => (
                              `<span class="bg-indigo-100 text-indigo-800 px-1 rounded">${match}</span>`
                            ))
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Variables
                  </label>
                  <div className="border rounded-lg h-64 overflow-y-auto">
                    <div className="p-2 bg-gray-50 border-b sticky top-0">
                      <p className="text-xs text-gray-500">Click a variable to insert it at cursor position</p>
                    </div>
                    <div className="p-2 space-y-2">
                      {predefinedVariables.map((variable) => (
                        <button
                          key={variable.name}
                          type="button"
                          onClick={() => insertVariableIntoTemplate(variable.name)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center ${
                            selectedVariables.includes(variable.name)
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Tag className="w-3 h-3 mr-2" />
                          <div>
                            <div className="font-medium">{variable.display_name}</div>
                            <div className="text-xs text-gray-500">{`{${variable.name}}`}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Variables
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {selectedVariables.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No variables selected. Click on variables from the list to add them.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedVariables.map((varName) => {
                        const variable = predefinedVariables.find(v => v.name === varName);
                        return (
                          <div 
                            key={varName} 
                            className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center"
                          >
                            <span>{variable?.display_name || varName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVariables(selectedVariables.filter(v => v !== varName));
                              }}
                              className="ml-2 text-indigo-600 hover:text-indigo-800"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}