import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: {
    id: string;
    name: string;
    provider: string;
    model_name: string;
    api_key: string;
    max_tokens: number;
    temperature: number;
    is_default: boolean;
  };
}

export function ConfigModal({ isOpen, onClose, config }: ConfigModalProps) {
  const [formData, setFormData] = useState({
    name: config?.name || '',
    provider: config?.provider || '',
    model_name: config?.model_name || '',
    api_key: '',
    max_tokens: config?.max_tokens || 1000,
    temperature: config?.temperature || 0.7,
    is_default: config?.is_default || false,
  });

  const { data: providers } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: async () => {
      const response = await fetch('/api/settings/providers');
      if (!response.ok) throw new Error('Failed to fetch providers');
      return response.json();
    },
  });

  const { data: models } = useQuery({
    queryKey: ['ai-models', formData.provider],
    enabled: !!formData.provider,
    queryFn: async () => {
      const response = await fetch('/api/settings/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      return response.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(
        config ? `/api/settings/ai/${config.id}` : '/api/settings/ai',
        {
          method: config ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error('Failed to save configuration');

      toast.success(config ? 'Configuration updated' : 'Configuration created');
      onClose();
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {config ? 'Edit Configuration' : 'New Configuration'}
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
                Provider
              </label>
              <select
                value={formData.provider}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    provider: e.target.value,
                    model_name: '',
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg bg-white"
                required
              >
                <option value="">Select a provider</option>
                {providers?.map((provider: any) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                value={formData.model_name}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white"
                required
                disabled={!formData.provider}
              >
                <option value="">Select a model</option>
                {models?.filter((m: any) => m.provider_id === formData.provider)
                  .map((model: any) => (
                    <option key={model.id} value={model.name}>
                      {model.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder={config ? '••••••••' : 'Enter API key'}
                required={!config}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                value={formData.max_tokens}
                onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Consistent ({formData.temperature})</span>
                <span>Creative</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="h-4 w-4 text-indigo-600 rounded border-gray-300"
              />
              <label className="text-sm text-gray-700">
                Make Default Configuration
              </label>
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
              {config ? 'Save Changes' : 'Create Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}