import React from 'react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  subject_name: string;
  topic_name: string;
  subtopic_name: string;
}

interface AIConfig {
  id: string;
  provider: string;
  model: string;
  temperature: number;
}

interface GenerationStatus {
  batchId: string;
  status: 'pending' | 'completed' | 'failed';
  progress: number;
  total: number;
  error?: string;
}

export function GeneratorPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [count, setCount] = useState(5);
  const [difficultyLevel, setDifficultyLevel] = useState(2);
  const [temperature, setTemperature] = useState(0.7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);

  const { data: templates } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  const { data: aiConfigs } = useQuery<AIConfig[]>({
    queryKey: ['ai-configs'],
    queryFn: async () => {
      const response = await fetch('/api/ai/config');
      if (!response.ok) throw new Error('Failed to fetch AI configurations');
      return response.json();
    },
  });

  const selectedTemplateDetails = templates?.find(t => t.id === selectedTemplate);

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          count,
          difficultyLevel,
          temperature,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start generation');
      }

      const data = await response.json();
      setGenerationStatus({
        batchId: data.batchId,
        status: 'pending',
        progress: 0,
        total: count,
      });

      toast.success('Generation started successfully');
    } catch (error) {
      toast.error('Failed to start generation');
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (generationStatus?.status === 'pending') {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/batches/${generationStatus.batchId}`);
          const data = await response.json();

          setGenerationStatus(prev => ({
            ...prev!,
            status: data.status,
            progress: data.progress,
            error: data.error_message,
          }));

          if (data.status !== 'pending') {
            clearInterval(interval);
            if (data.status === 'completed') {
              toast.success('Questions generated successfully!');
            } else if (data.status === 'failed') {
              toast.error('Generation failed: ' + data.error_message);
            }
          }
        } catch (error) {
          console.error('Status check error:', error);
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [generationStatus?.batchId, generationStatus?.status]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Question Generator</h1>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">Select a template</option>
              {templates?.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplateDetails && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Template Details</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Subject</p>
                  <p className="font-medium">{selectedTemplateDetails.subject_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Topic</p>
                  <p className="font-medium">{selectedTemplateDetails.topic_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Subtopic</p>
                  <p className="font-medium">{selectedTemplateDetails.subtopic_name}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Easy</span>
                <span>Medium</span>
                <span>Hard</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Temperature
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
                <span>Consistent</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedTemplate || isGenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Brain className="w-5 h-5" />
            {isGenerating ? 'Starting Generation...' : 'Generate Questions'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Generation Status</h2>
          
          {generationStatus ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  generationStatus.status === 'completed' ? 'bg-green-500' :
                  generationStatus.status === 'failed' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`} />
                <span className="font-medium capitalize">{generationStatus.status}</span>
              </div>
              
              {generationStatus.status === 'pending' && (
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${(generationStatus.progress / generationStatus.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Generated {generationStatus.progress} of {generationStatus.total} questions
                  </p>
                </div>
              )}
              
              {generationStatus.status === 'failed' && generationStatus.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{generationStatus.error}</p>
                </div>
              )}
              
              {generationStatus.status === 'completed' && (
                <p className="text-sm text-gray-700">
                  Successfully generated {generationStatus.total} questions! You can now review them in the Reviewer page.
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No active generation</p>
          )}
        </div>
      </div>
    </div>
  );
}