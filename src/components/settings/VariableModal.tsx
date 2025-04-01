import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface VariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  variable?: {
    id: string;
    name: string;
    display_name: string;
    description: string;
    placeholder: string;
    variable_type_id: string;
    default_value: string;
    validation_rules: string;
    options: string;
    is_required: boolean;
    sort_order: number;
  };
}

export function VariableModal({ isOpen, onClose, categoryId, variable }: VariableModalProps) {
  const [formData, setFormData] = useState({
    name: variable?.name || '',
    display_name: variable?.display_name || '',
    description: variable?.description || '',
    placeholder: variable?.placeholder || '',
    variable_type_id: variable?.variable_type_id || '',
    default_value: variable?.default_value || '',
    validation_rules: variable?.validation_rules || '',
    options: variable?.options || '',
    is_required: variable?.is_required ?? true,
    sort_order: variable?.sort_order || 0,
  });

  const { data: variableTypes } = useQuery({
    queryKey: ['variable-types'],
    queryFn: async () => {
      const response = await fetch('/api/variable-types');
      if (!response.ok) throw new Error('Failed to fetch variable types');
      return response.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(
        variable ? `/api/variable-definitions/${variable.id}` : '/api/variable-definitions',
        {
          method: variable ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            category_id: categoryId,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to save variable');

      toast.success(variable ? 'Variable updated' : 'Variable created');
      onClose();
    } catch (error) {
      toast.error('Failed to save variable');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {variable ? 'Edit Variable' : 'New Variable'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.variable_type_id}
                onChange={(e) => setFormData({ ...formData, variable_type_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white"
                required
              >
                <option value="">Select a type</option>
                {variableTypes?.map((type: any) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Value
              </label>
              <input
                type="text"
                value={formData.default_value}
                onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validation Rules (JSON)
              </label>
              <textarea
                value={formData.validation_rules}
                onChange={(e) => setFormData({ ...formData, validation_rules: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options (JSON array for select types)
              </label>
              <textarea
                value={formData.options}
                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="h-4 w-4 text-indigo-600 rounded border-gray-300"
              />
              <label className="text-sm text-gray-700">
                Required
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {variable ? 'Save Changes' : 'Create Variable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}