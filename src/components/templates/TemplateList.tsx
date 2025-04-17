import React from 'react';
import { Template } from '../../types/templates';
import { FileText, Pencil, Trash2, Copy, Eye } from 'lucide-react';

interface TemplateListProps {
  templates: Template[];
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
  onDuplicate: (template: Template) => void;
  onPreview: (template: Template) => void;
}

export function TemplateList({
  templates,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview
}: TemplateListProps) {
  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {template.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-500">
                    Version {template.currentVersion.version}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(template.updated_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {template.currentVersion.variables.length} Variables
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPreview(template)}
                className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
                title="Preview"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDuplicate(template)}
                className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
                title="Duplicate"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                onClick={() => onEdit(template)}
                className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
                title="Edit"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(template)}
                className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Variables
            </div>
            <div className="flex flex-wrap gap-2">
              {template.currentVersion.variables.map((variable) => (
                <span
                  key={variable.id}
                  className="px-2 py-1 bg-white border rounded text-sm text-gray-600"
                >
                  {variable.displayName}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Preview
            </div>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
              {template.currentVersion.content}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}