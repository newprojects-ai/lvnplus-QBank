import React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Settings, Zap, Server, Cpu, Variable, FolderTree } from 'lucide-react';
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

interface VariableCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
}

interface VariableDefinition {
  id: string;
  category_id: string;
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
}

export function SettingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [editingCategory, setEditingCategory] = useState<VariableCategory | null>(null);
  const [editingVariable, setEditingVariable] = useState<VariableDefinition | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    icon: 'Variable',
    color: 'indigo',
    sort_order: 0,
  });

  const [variableFormData, setVariableFormData] = useState({
    category_id: '',
    name: '',
    display_name: '',
    description: '',
    placeholder: '',
    variable_type_id: '',
    default_value: '',
    validation_rules: '',
    options: '',
    is_required: true,
    sort_order: 0,
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

  const { data: categories } = useQuery<VariableCategory[]>({
    queryKey: ['variable-categories'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/variable-categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch variable categories');
      return response.json();
    },
  });

  const { data: variables } = useQuery<VariableDefinition[]>({
    queryKey: ['variable-definitions', selectedCategory],
    enabled: !!selectedCategory,
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/variable-definitions/${selectedCategory}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch variables');
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
    
    console.log('Submitting form data:', { ...formData, api_key: '[REDACTED]' });

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

      const result = await response.json();
      console.log('Save response:', result);

      toast.success(editingConfig ? 'Configuration updated' : 'Configuration created');
      setIsModalOpen(false);
      setEditingConfig(null);
      refetch();
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
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
              setEditingCategory(null);
              setCategoryFormData({
                name: '',
                description: '',
                icon: 'Variable',
                color: 'indigo',
                sort_order: 0,
              });
              setIsCategoryModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <FolderTree className="w-5 h-5" />
            Add Category
          </button>
          <button
            onClick={() => {
              setEditingVariable(null);
              setVariableFormData({
                category_id: selectedCategory || '',
                name: '',
                display_name: '',
                description: '',
                placeholder: '',
                variable_type_id: '',
                default_value: '',
                validation_rules: '',
                options: '',
                is_required: true,
                sort_order: 0,
              });
              setIsVariableModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            disabled={!selectedCategory}
          >
            <Variable className="w-5 h-5" />
            Add Variable
          </button>
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

      {/* Configuration Modal */}
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Configuration name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
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
                    Model
                  </label>
                  <select
                    value={formData.model_name}
                    onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    required
                  >
                    <option value="">Select a model</option>
                    {aiModels?.filter(model => model.provider_id === formData.provider).map((model) => (
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
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value.trim() })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder={editingConfig ? '••••••••' : 'Enter API key'}
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
                    onChange={(e) => setFormData({ ...formData, max_tokens: Math.max(1, parseInt(e.target.value)) })}
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

      {/* Variable Management Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Variable className="w-5 h-5" />
            Variable Management
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-4 gap-6">
            {/* Categories List */}
            <div className="col-span-1 space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Categories</h3>
              <div className="space-y-2">
                {categories?.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg ${
                      selectedCategory === category.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${category.color}-500`} />
                      <span>{category.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(category);
                          setCategoryFormData(category);
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm('Are you sure you want to delete this category?')) return;
                          
                          const token = localStorage.getItem('token');
                          try {
                            const response = await fetch(`/api/variable-categories/${category.id}`, {
                              method: 'DELETE',
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            if (!response.ok) throw new Error('Failed to delete category');
                            toast.success('Category deleted');
                          } catch (error) {
                            toast.error('Failed to delete category');
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Variables List */}
            <div className="col-span-3">
              <h3 className="text-sm font-medium text-gray-