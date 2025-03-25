import React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Settings, Zap, Server, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';

interface AIConfig {
  id: string;
  name: string;
  provider: string;
  model_name: string;
  max_tokens: number;
  temperature: number;
  is_default: boolean;
  api_key: string;
}

interface AIProvider {
  id: string;
  name: string;
  description: string;
  api_base_url: string;
  active: boolean;
}

interface AIModel {
  id: string;
  provider_id: string;
  name: string;
  description: string;
  max_tokens: number;
  supports_functions: boolean;
  supports_vision: boolean;
  active: boolean;
}

export function SettingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai',
    model_name: 'gpt-4',
    api_key: '',
    max_tokens: 1000,
    temperature: 0.7,
    is_default: false,
  });

  const [providerFormData, setProviderFormData] = useState({
    name: '',
    description: '',
    api_base_url: '',
    active: true,
  });

  const [modelFormData, setModelFormData] = useState({
    provider_id: '',
    name: '',
    description: '',
    max_tokens: 2048,
    supports_functions: false,
    supports_vision: false,
    active: true,
  });

  const { data: aiModels } = useQuery({
    queryKey: ['ai-models'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings/models', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch AI models');
      return response.json();
    },
  });

  const { data: providers } = useQuery<AIProvider[]>({
    queryKey: ['ai-providers'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings/providers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch AI providers');
      return response.json();
    },
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

      toast.success(editingConfig ? 'Configuration updated' : 'Configuration created');
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

  const handleProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch(
        editingProvider ? `/api/settings/providers/${editingProvider.id}` : '/api/settings/providers',
        {
          method: editingProvider ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(providerFormData),
        }
      );

      if (!response.ok) throw new Error('Failed to save provider');

      toast.success(editingProvider ? 'Provider updated' : 'Provider created');
      setIsProviderModalOpen(false);
      setEditingProvider(null);
    } catch (error) {
      toast.error('Failed to save provider');
    }
  };

  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch(
        editingModel ? `/api/settings/models/${editingModel.id}` : '/api/settings/models',
        {
          method: editingModel ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(modelFormData),
        }
      );

      if (!response.ok) throw new Error('Failed to save model');

      toast.success(editingModel ? 'Model updated' : 'Model created');
      setIsModelModalOpen(false);
      setEditingModel(null);
    } catch (error) {
      toast.error('Failed to save model');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setEditingProvider(null);
              setProviderFormData({
                name: '',
                description: '',
                api_base_url: '',
                active: true,
              });
              setIsProviderModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Server className="w-5 h-5" />
            Add Provider
          </button>
          <button
            onClick={() => {
              setEditingModel(null);
              setModelFormData({
                provider_id: '',
                name: '',
                description: '',
                max_tokens: 2048,
                supports_functions: false,
                supports_vision: false,
                active: true,
              });
              setIsModelModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Cpu className="w-5 h-5" />
            Add Model
          </button>
          <button
            onClick={() => {
              setEditingConfig(null);
              setFormData({
                name: '',
                provider: 'openai',
                model_name: 'gpt-4',
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
            Add Configuration
          </button>
        </div>
      </div>

      {/* Provider Modal */}
      {isProviderModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <form onSubmit={handleProviderSubmit} className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProvider ? 'Edit Provider' : 'New Provider'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsProviderModalOpen(false)}
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
                    value={providerFormData.name}
                    onChange={(e) => setProviderFormData({ ...providerFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={providerFormData.description}
                    onChange={(e) => setProviderFormData({ ...providerFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={providerFormData.api_base_url}
                    onChange={(e) => setProviderFormData({ ...providerFormData, api_base_url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="https://api.example.com/v1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={providerFormData.active}
                    onChange={(e) => setProviderFormData({ ...providerFormData, active: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                  />
                  <label className="text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsProviderModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingProvider ? 'Save Changes' : 'Create Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Model Modal */}
      {isModelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <form onSubmit={handleModelSubmit} className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingModel ? 'Edit Model' : 'New Model'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModelModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider
                  </label>
                  <select
                    value={modelFormData.provider_id}
                    onChange={(e) => setModelFormData({ ...modelFormData, provider_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    required
                  >
                    <option value="">Select a provider</option>
                    {providers?.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={modelFormData.name}
                    onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={modelFormData.description}
                    onChange={(e) => setModelFormData({ ...modelFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={modelFormData.max_tokens}
                    onChange={(e) => setModelFormData({ ...modelFormData, max_tokens: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={modelFormData.supports_functions}
                      onChange={(e) => setModelFormData({ ...modelFormData, supports_functions: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                    />
                    <label className="text-sm text-gray-700">
                      Supports Functions
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={modelFormData.supports_vision}
                      onChange={(e) => setModelFormData({ ...modelFormData, supports_vision: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                    />
                    <label className="text-sm text-gray-700">
                      Supports Vision
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={modelFormData.active}
                    onChange={(e) => setModelFormData({ ...modelFormData, active: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                  />
                  <label className="text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModelModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingModel ? 'Save Changes' : 'Create Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* Providers Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Server className="w-5 h-5" />
              AI Providers
            </h2>
          </div>
          <div className="p-6 divide-y divide-gray-200">
            {providers?.map((provider) => (
              <div key={provider.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{provider.name}</h3>
                    <p className="text-sm text-gray-500">{provider.description}</p>
                    {provider.api_base_url && (
                      <p className="text-sm text-gray-500 mt-1">API: {provider.api_base_url}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingProvider(provider);
                        setProviderFormData(provider);
                        setIsProviderModalOpen(true);
                      }}
                      className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Models Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              AI Models
            </h2>
          </div>
          <div className="p-6 divide-y divide-gray-200">
            {aiModels?.map((model) => (
              <div key={model.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{model.name}</h3>
                    <p className="text-sm text-gray-500">{model.description}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Max Tokens: {model.max_tokens}
                      </span>
                      {model.supports_functions && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Functions
                        </span>
                      )}
                      {model.supports_vision && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Vision
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingModel(model);
                        setModelFormData(model);
                        setIsModelModalOpen(true);
                      }}
                      className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configurations Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              AI Configurations
            </h2>
          </div>
          <div className="p-6">
            {aiConfigs?.map((config) => (
              <div key={config.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {config.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {config.provider} - {config.model_name}
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
                          model_name: config.model_name,
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
        </div>
      </div>
    </div>
  );
}