import React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Settings, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface AIConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  max_tokens: number;
  temperature: number;
  is_default: boolean;
}

export function SettingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai',
    model: 'gpt-4',
    api_key: '',
    max_tokens: 1000,
    temperature: 0.7,
    is_default: false,
  });

  const { data: aiConfigs, refetch } = useQuery<AIConfig[]>({
    queryKey: ['ai-configs'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings/ai', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch AI configurations');
      return response.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required');
      return;
    }
    
    try {
      const response = await fetch(
        editingConfig ? `/api/settings/ai/${editingConfig.id}` : '/api/settings/ai',
        {
          method: editingConfig ? 'PUT' : 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error('Failed to save configuration');

      toast.success(
        editingConfig
          ? 'Configuration updated successfully'
          : 'Configuration created successfully'
      );
      setIsModalOpen(false);
      setEditingConfig(null);
      refetch();
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch(`/api/settings/ai/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete configuration');

      toast.success('Configuration deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete configuration');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={() => {
            setEditingConfig(null);
            setFormData({
              name: '',
              provider: 'openai',
              model: 'gpt-4',
              api_key: '',
              max_tokens: 1000,
              temperature: 0.7,
              is_default: false,
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          Add AI Configuration
        </button>
      </div>

      <div className="grid gap-6">
        {aiConfigs?.map((config) => (
          <div key={config.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {config.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {config.provider} - {config.model}
                </p>
                {config.is_default && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Default
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingConfig(config);
                    setFormData({
                      name: config.name,
                      provider: config.provider,
                      model: config.model,
                      api_key: '',
                      max_tokens: config.max_tokens,
                      temperature: config.temperature,
                      is_default: config.is_default,
                    });
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      if (!token) {
                        toast.error('Authentication required');
                        return;
                      }

                      const response = await fetch(`/api/settings/ai/${config.id}/test`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      
                      if (!response.ok) {
                        throw new Error('Test request failed');
                      }
                      
                      const data = await response.json();
                      
                      if (data.success) {
                        toast.success('Configuration test successful!');
                      } else {
                        toast.error(data.error || 'Test failed');
                      }
                    } catch (error) {
                      console.error('Test error:', error);
                      toast.error(error instanceof Error ? error.message : 'Failed to test configuration');
                    }
                  }}
                  className="p-2 text-gray-600 hover:text-yellow-600 rounded-lg hover:bg-gray-100"
                >
                  <Zap className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(config.id)}
                  className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Max Tokens</p>
                <p className="text-gray-900">{config.max_tokens}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Temperature</p>
                <p className="text-gray-900">{config.temperature}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingConfig ? 'Edit Configuration' : 'New Configuration'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="My GPT-4 Configuration"
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
                    onChange={(e) =>
                      setFormData({ ...formData, provider: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="deepseek">DeepSeek</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {formData.provider === 'openai' ? (
                      <>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </>
                    ) : (
                      <>
                        <option value="deepseek-chat">DeepSeek Chat</option>
                        <option value="deepseek-coder">DeepSeek Coder</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.api_key}
                    onChange={(e) =>
                      setFormData({ ...formData, api_key: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required={!editingConfig}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_tokens: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Consistent</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) =>
                      setFormData({ ...formData, is_default: e.target.checked })
                    }
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                  />
                  <label className="text-sm text-gray-700">
                    Set as default configuration
                  </label>
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
                  {editingConfig ? 'Save Changes' : 'Create Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}