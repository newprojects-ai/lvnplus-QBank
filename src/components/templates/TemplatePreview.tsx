import React, { useState, useEffect } from 'react';
import { Template, TemplatePreview as ITemplatePreview } from '../../types/templates';
import { generatePreview } from '../../utils/templateUtils';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface TemplatePreviewProps {
  template: Template;
  onClose: () => void;
}

export function TemplatePreview({ template, onClose }: TemplatePreviewProps) {
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [preview, setPreview] = useState<ITemplatePreview | null>(null);

  useEffect(() => {
    const result = generatePreview(template, variables);
    setPreview(result);
  }, [template, variables]);

  const handleVariableChange = (name: string, value: any) => {
    setVariables(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Preview: {template.name}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Variables
            </h3>
            <div className="space-y-4">
              {template.currentVersion.variables.map((variable) => (
                <div key={variable.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {variable.displayName}
                    {variable.validation?.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  
                  {variable.type === 'select' ? (
                    <select
                      value={variables[variable.name] || ''}
                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="">Select an option</option>
                      {variable.validation?.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : variable.type === 'number' ? (
                    <input
                      type="number"
                      value={variables[variable.name] || ''}
                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      min={variable.validation?.min}
                      max={variable.validation?.max}
                    />
                  ) : variable.type === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={variables[variable.name] || false}
                      onChange={(e) => handleVariableChange(variable.name, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                    />
                  ) : (
                    <input
                      type="text"
                      value={variables[variable.name] || ''}
                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Preview
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {preview?.renderedContent || template.currentVersion.content}
                </pre>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                {preview?.isValid ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <span className={`font-medium ${
                  preview?.isValid ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {preview?.isValid ? 'All variables set' : 'Missing variables'}
                </span>
              </div>

              {preview?.missingVariables.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4 mt-2">
                  <p className="text-sm text-yellow-700 mb-2">
                    The following variables are required:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-600">
                    {preview.missingVariables.map((varName) => (
                      <li key={varName}>
                        {template.currentVersion.variables.find(v => v.name === varName)?.displayName || varName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}