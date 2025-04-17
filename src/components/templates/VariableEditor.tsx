import React, { useState } from 'react';
import { TemplateVariable, VariableType } from '../../types/templates';

interface VariableEditorProps {
  variable: TemplateVariable;
  onSave: (variable: TemplateVariable) => void;
  onCancel: () => void;
}

const variableTypes: { value: VariableType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi Select' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
];

export function VariableEditor({ variable, onSave, onCancel }: VariableEditorProps) {
  const [formData, setFormData] = useState<TemplateVariable>(variable);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Display Name
        </label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Variable Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg font-mono"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          This will be used in the template as {{'{{'}{formData.name}{'}}'}}.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as VariableType })}
          className="w-full px-3 py-2 border rounded-lg bg-white"
          required
        >
          {variableTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Default Value
        </label>
        <input
          type="text"
          value={formData.defaultValue || ''}
          onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {(formData.type === 'select' || formData.type === 'multiselect') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Options (one per line)
          </label>
          <textarea
            value={formData.validation?.options?.join('\n') || ''}
            onChange={(e) => setFormData({
              ...formData,
              validation: {
                ...formData.validation,
                options: e.target.value.split('\n').filter(Boolean)
              }
            })}
            className="w-full px-3 py-2 border rounded-lg font-mono"
            rows={4}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.validation?.required ?? true}
          onChange={(e) => setFormData({
            ...formData,
            validation: {
              ...formData.validation,
              required: e.target.checked
            }
          })}
          className="h-4 w-4 text-indigo-600 rounded border-gray-300"
        />
        <label className="text-sm text-gray-700">
          Required
        </label>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Save Variable
        </button>
      </div>
    </form>
  );
}