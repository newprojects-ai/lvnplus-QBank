import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

export function PromptTemplatesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    template_text: '',
    variables: [],
  });

  const { data: variableTypes } = useQuery<VariableType[]>({
    queryKey: ['variable-types'],
    queryFn: async () => {
      const response = await fetch('/api/variable-types');
      if (!response.ok) throw new Error('Failed to fetch variable types');
      return response.json();
    },
  });

  const { data: variableOptions } = useQuery<VariableOption[]>({
    queryKey: ['variable-options'],
    queryFn: async () => {
      const response = await fetch('/api/variable-options');
      if (!response.ok) throw new Error('Failed to fetch variable options');
      return response.json();
    },
  });

  const { data: templates, refetch } = useQuery<PromptTemplate[]>({
    queryKey: ['prompt-templates'],
    queryFn: async () => {
      const response = await fetch('/api/prompt-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        editingTemplate ? `/api/prompt-templates/${editingTemplate.id}` : '/api/prompt-templates',
        {
          method: editingTemplate ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error('Failed to save template');

      setIsModalOpen(false);
      setEditingTemplate(null);
      refetch();
      toast.success(editingTemplate ? 'Template updated' : 'Template created');
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/prompt-templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');

      refetch();
      toast.success('Template deleted');
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
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                  {template.template_text}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Variables</h3>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(template.variables, null, 2)}
                </pre>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Text
                </label>
                <textarea
                  value={formData.template_text}
                  onChange={(e) => setFormData({ ...formData, template_text: e.target.value })}
                  className="w-full h-64 px-3 py-2 border rounded-lg font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Variables</span>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      variables: [
                        ...formData.variables,
                        {
                          id: crypto.randomUUID(),
                          name: '',
                          display_name: '',
                          description: '',
                          variable_type_id: 'text',
                          is_required: true,
                          sort_order: formData.variables.length,
                        },
                      ],
                    })}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>
                </label>
                <div className="space-y-4">
                  {formData.variables.map((variable, index) => (
                    <div key={variable.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-sm font-medium text-gray-900">
                          Variable {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            variables: formData.variables.filter(v => v.id !== variable.id),
                          })}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <MinusCircle className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Variable Name
                          </label>
                          <input
                            type="text"
                            value={variable.name}
                            onChange={(e) => {
                              const newVariables = [...formData.variables];
                              newVariables[index] = {
                                ...variable,
                                name: e.target.value,
                              };
                              setFormData({ ...formData, variables: newVariables });
                            }}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="e.g., subject, difficulty"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={variable.display_name}
                            onChange={(e) => {
                              const newVariables = [...formData.variables];
                              newVariables[index] = {
                                ...variable,
                                display_name: e.target.value,
                              };
                              setFormData({ ...formData, variables: newVariables });
                            }}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="e.g., Subject, Difficulty Level"
                            required
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={variable.description}
                          onChange={(e) => {
                            const newVariables = [...formData.variables];
                            newVariables[index] = {
                              ...variable,
                              description: e.target.value,
                            };
                            setFormData({ ...formData, variables: newVariables });
                          }}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Explain what this variable is used for"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <select
                            value={variable.variable_type_id}
                            onChange={(e) => {
                              const newVariables = [...formData.variables];
                              newVariables[index] = {
                                ...variable,
                                variable_type_id: e.target.value,
                              };
                              setFormData({ ...formData, variables: newVariables });
                            }}
                            className="w-full px-3 py-2 border rounded-lg bg-white"
                            required
                          >
                            {variableTypes?.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={variable.is_required}
                              onChange={(e) => {
                                const newVariables = [...formData.variables];
                                newVariables[index] = {
                                  ...variable,
                                  is_required: e.target.checked,
                                };
                                setFormData({ ...formData, variables: newVariables });
                              }}
                              className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
                        </div>
                      </div>
                      {variable.variable_type_id === 'select' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Options
                          </label>
                          <select
                            multiple
                            value={(variable.options || '').split(',').filter(Boolean)}
                            onChange={(e) => {
                              const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                              const newVariables = [...formData.variables];
                              newVariables[index] = {
                                ...variable,
                                options: options.join(','),
                              };
                              setFormData({ ...formData, variables: newVariables });
                            }}
                            className="w-full px-3 py-2 border rounded-lg bg-white"
                            size={4}
                          >
                            {variableOptions
                              ?.filter(opt => opt.variable_type_id === variable.variable_type_id)
                              .map((option) => (
                                <option key={option.id} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}