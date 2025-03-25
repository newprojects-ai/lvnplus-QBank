import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Settings, RefreshCw, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface TestResult {
  success: boolean;
  response?: string;
  error?: string;
  timing?: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export function DeepSeekPlayground() {
  const [prompt, setPrompt] = useState('Generate a math question about quadratic equations.');
  const [model, setModel] = useState('deepseek-chat');
  const [role, setRole] = useState('teacher');
  const [temperature, setTemperature] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const { data: aiConfigs } = useQuery({
    queryKey: ['ai-configs'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const response = await fetch('/api/settings/ai', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch AI configurations');
      return response.json();
    },
  });

  const handleTest = async () => {
    setIsLoading(true);
    const startTime = performance.now();

    try {
      const deepseekConfig = aiConfigs?.find((c: any) => c.provider === 'deepseek');
      
      if (!deepseekConfig) {
        toast.error('No DeepSeek configuration found');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/settings/ai/${deepseekConfig.id}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          model,
          role,
          temperature,
        }),
      });

      const data = await response.json();
      const endTime = performance.now();

      setTestResult({
        success: data.success,
        response: data.response,
        error: data.error,
        usage: data.usage,
        timing: Math.round(endTime - startTime),
      });

      if (data.success) {
        toast.success('Test completed successfully');
      } else {
        toast.error(`Test failed: ${data.error}`);
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Failed to run test');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">DeepSeek Playground</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.href = '/settings'}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Settings className="w-5 h-5" />
            Configure API
          </button>
          <button
            onClick={handleTest}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            {isLoading ? 'Running...' : 'Run Test'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="deepseek-chat">DeepSeek Chat</option>
              <option value="deepseek-coder">DeepSeek Coder</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="expert">Subject Expert</option>
              <option value="">No Role</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Consistent ({temperature})</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-64 px-3 py-2 border rounded-lg font-mono text-sm"
              placeholder="Enter your prompt here..."
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Response</h2>
            {testResult && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {testResult.timing}ms | {testResult.usage?.total_tokens || 0} tokens
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(testResult.response || '');
                    toast.success('Copied to clipboard');
                  }}
                  className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {testResult ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                testResult.success ? 'bg-green-50 border border-green-200' : 
                'bg-red-50 border border-red-200'
              }`}>
                {testResult.usage && (
                  <div className="mb-2 text-xs text-gray-500">
                    Tokens: {testResult.usage.prompt_tokens} prompt + {testResult.usage.completion_tokens} completion = {testResult.usage.total_tokens} total
                  </div>
                )}
                <pre className={`whitespace-pre-wrap font-mono text-sm ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.success ? testResult.response : testResult.error}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Run a test to see the response
            </div>
          )}
        </div>
      </div>
    </div>
  );
}