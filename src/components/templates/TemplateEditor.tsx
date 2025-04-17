import React, { useState, useEffect } from 'react';
import { Template, TemplateVariable, TemplateValidationResult } from '../../types/templates';
import { validateTemplate, generatePreview } from '@lvnplus/core';
import { Variable, Pencil, Plus, AlertCircle, CheckCircle } from 'lucide-react';

interface TemplateEditorProps {
  template?: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [content, setContent] = useState(template?.currentVersion?.content || '');
  const [variables, setVariables] = useState<TemplateVariable[]>(
    template?.currentVersion?.variables || []
  );
  const [validation, setValidation] = useState<TemplateValidationResult | null>(null);
  const [showVariablePanel, setShowVariablePanel] = useState(false);

  // Validate template when content or variables change
  useEffect(() => {
    if (content) {
      const result = validateTemplate({
        ...template,
        name,
        description,
        currentVersion: {
          ...template?.currentVersion,
          content,
          variables,
        },
      } as Template);
      setValidation(result);
    }
  }, [content, variables]);

  const handleAddVariable = () => {
    const newVariable: TemplateVariable = {
      id: crypto.randomUUID(),
      name: `variable_${variables.length + 1}`,
      displayName: `Variable ${variables.length + 1}`,
      type: 'text',
      description: '',
      is_required: true,
      sort_order: variables.length,
    };
    setVariables([...variables, newVariable]);
    setShowVariablePanel(true);
  };

  const handleSave = () => {
    if (!validation?.isValid) return;

    const updatedTemplate: Template = {
      ...template,
      name,
      description,
      currentVersion: {
        id: crypto.randomUUID(),
        version: (template?.versions?.length || 0) + 1,
        content,
        variables,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user', // Replace with actual user ID
      },
      versions: [...(template?.versions || [])],
      created_at: template?.created_at || new Date().toISOString(),
      created_by: template?.created_by || 'current-user', // Replace with actual user ID
      updated_at: new Date().toISOString(),
      isActive: true,
    };

    onSave(updatedTemplate);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {template ? 'Edit Template' : 'Create Template'}
        </h2>
        
        {/* Basic Info */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
            />
          </div>
        </div>

        {/* Template Content */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Template Content
            </label>
            <button
              onClick={() => setShowVariablePanel(!showVariablePanel)}
              className="flex items-center gap-2 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800"
            >
              <Variable className="w-4 h-4" />
              {showVariablePanel ? 'Hide Variables' : 'Show Variables'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-${showVariablePanel ? '2' : '3'}`}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                rows={12}
                placeholder="Enter your template content here..."
              />
            </div>

            {showVariablePanel && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-900">Variables</h3>
                  <button
                    onClick={handleAddVariable}
                    className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    <Plus className="w-4 h-4" />
                    Add Variable
                  </button>
                </div>

                <div className="space-y-3">
                  {variables.map((variable) => (
                    <div
                      key={variable.id}
                      className="flex items-start gap-2 p-2 bg-white rounded border"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {variable.displayName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {`{{${variable.name}}}`}
                        </p>
                      </div>
                      <button
                        onClick={() => {/* Edit variable */}}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Validation Status */}
        {validation && (
          <div className={`p-4 rounded-lg mb-6 ${
            validation.isValid ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {validation.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={`font-medium ${
                validation.isValid ? 'text-green-700' : 'text-red-700'
              }`}>
                {validation.isValid ? 'Template is valid' : 'Template has issues'}
              </span>
            </div>

            {validation.errors.length > 0 && (
              <ul className="text-sm text-red-700 ml-6 list-disc">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}

            {validation.warnings.length > 0 && (
              <ul className="text-sm text-yellow-700 ml-6 list-disc">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!validation?.isValid}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {template ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}