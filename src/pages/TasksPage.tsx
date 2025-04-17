import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Template, TemplateVariable, TaskFormData, TaskPreviewData } from '@lvnplus/core';

interface FormData {
  template_id: string;
  variable_values: {
    [key: string]: any;
  };
}

interface Subject {
  subject_id: number;
  subject_name: string;
  description?: string;
}

interface Topic {
  topic_id: number;
  topic_name: string;
  description?: string;
}

interface Subtopic {
  subtopic_id: number;
  subtopic_name: string;
  description?: string;
}

// Preset difficulty distributions
const PRESET_DISTRIBUTIONS = [
  {
    id: 'equal',
    name: 'Equal Distribution',
    distribution: {
      '0': 16, // Easiest
      '1': 17,
      '2': 17,
      '3': 17,
      '4': 17,
      '5': 16  // Hardest
    },
  },
  {
    id: 'easy',
    name: 'Easy-focused',
    distribution: {
      '0': 30,
      '1': 25,
      '2': 20,
      '3': 15,
      '4': 7,
      '5': 3
    },
  },
  {
    id: 'medium',
    name: 'Medium-focused',
    distribution: {
      '0': 10,
      '1': 15,
      '2': 25,
      '3': 25,
      '4': 15,
      '5': 10
    },
  },
  {
    id: 'hard',
    name: 'Hard-focused',
    distribution: {
      '0': 3,
      '1': 7,
      '2': 15,
      '3': 20,
      '4': 25,
      '5': 30
    },
  },
  {
    id: 'custom',
    name: 'Custom Distribution',
    distribution: {
      '0': 16,
      '1': 17,
      '2': 17,
      '3': 17,
      '4': 17,
      '5': 16
    },
  },
  {
    id: 'balanced',
    name: 'Balanced',
    distribution: {
      '0': 10,
      '1': 15,
      '2': 20,
      '3': 20,
      '4': 15,
      '5': 10
    },
  },
];

export function TasksPage() {
  // State for UI
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedTemplateData, setSelectedTemplateData] = useState<Template | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Set<number>>(new Set());
  const [selectedSubtopics, setSelectedSubtopics] = useState<Set<number>>(new Set());

  // Query for templates
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await fetch('/api/prompt-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  // Query for subjects
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    enabled: true,
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/master-data/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch subjects');
      return response.json();
    },
  });

  // Query for topics
  const { data: topics = [] } = useQuery({
    queryKey: ['topics', selectedSubject],
    enabled: !!selectedSubject,
    queryFn: async () => {
      const response = await fetch(`/api/master-data/topics/${selectedSubject}`);
      if (!response.ok) throw new Error('Failed to fetch topics');
      return response.json();
    },
  });

  // Query for subtopics
  const { data: subtopics = [] } = useQuery({
    queryKey: ['subtopics', Array.from(selectedTopics)],
    enabled: selectedTopics.size > 0,
    queryFn: async () => {
      const responses = await Promise.all(
        Array.from(selectedTopics).map(topicId =>
          fetch(`/api/master-data/subtopics/${topicId}`)
        )
      );
      
      const results = await Promise.all(
        responses.map(response => {
          if (!response.ok) throw new Error('Failed to fetch subtopics');
          return response.json();
        })
      );
      
      return results.flat();
    },
  });

  // Query for template details when selected
  const { data: selectedTemplateDetails } = useQuery({
    queryKey: ['template-details', selectedTemplate],
    enabled: !!selectedTemplate,
    queryFn: async () => {
      const response = await fetch(`/api/prompt-templates/${selectedTemplate}`);
      if (!response.ok) throw new Error('Failed to fetch subtopics');
      return response.json();
    },
  });

  const [selectedDifficultyDistribution, setSelectedDifficultyDistribution] = useState<string>('balanced');
  const [customDistribution, setCustomDistribution] = useState<Record<string, number>>({
    '0': 16,
    '1': 17,
    '2': 17,
    '3': 17,
    '4': 17,
    '5': 16
  });
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [distributionTotal, setDistributionTotal] = useState<number>(100);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [viewingTopicId, setViewingTopicId] = useState<number | null>(null);
  const [isLoadingTemplateData, setIsLoadingTemplateData] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    template_id: '',
    variable_values: {},
  });
  const [promptPreview, setPromptPreview] = useState<string>('');

  // State for loading indicators

  // State for authentication
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Function to check if all required variables are filled
  const areRequiredVariablesFilled = useCallback(() => {
    if (!selectedTemplate || !selectedTemplateData) return false;
    
    // Check if template is selected
    if (!selectedTemplate) return false;
    
    // Check if subject is selected
    if (!selectedSubject) return false;
    
    // Check if at least one topic and subtopic are selected
    if (selectedTopics.size === 0 || selectedSubtopics.size === 0) return false;
    
    // Check if total questions is set
    if (!formData.variable_values.total_questions) return false;
    
    // Check if difficulty distribution adds up to 100%
    const distribution = formData.variable_values.difficulty_distribution;
    if (!distribution || Object.values(distribution).reduce((a, b) => a + b, 0) !== 100) return false;
    
    return true;
  }, [selectedTemplate, selectedTemplateData, selectedSubject, selectedTopics, selectedSubtopics, formData]);

  // Update form data when template is selected
  useEffect(() => {
    if (selectedTemplate && selectedTemplateDetails) {
      setSelectedTemplateData(selectedTemplateDetails);
      setFormData(prev => ({
        ...prev,
        template_id: selectedTemplate,
        variable_values: {
          ...prev.variable_values,
          total_questions: 10, // Default value
          difficulty_distribution: PRESET_DISTRIBUTIONS.find(d => d.id === 'balanced')?.distribution || {},
          katex_style: 'minimal' // Default value
        }
      }));
    }
  }, [selectedTemplate, selectedTemplateDetails]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create task');
      toast.success('Task created successfully');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };
  // Update prompt preview
  useEffect(() => {
    if (!selectedTemplateData) return;

    let preview = selectedTemplateData.template_text;
    
    // Replace variables with their values
    const variables = {
      topic: Array.from(selectedTopics).map(id => topics.find(t => t.topic_id === id)?.topic_name).join(', '),
      subtopic: Array.from(selectedSubtopics).map(id => subtopics.find(s => s.subtopic_id === id)?.subtopic_name).join(', '),
      total_questions: formData.variable_values.total_questions || '[NEEDS VALUE: total_questions]',
      difficulty_distribution: JSON.stringify(formData.variable_values.difficulty_distribution) || '[NEEDS VALUE: difficulty_distribution]',
      katex_style: formData.variable_values.katex_style || '[NEEDS VALUE: katex_style]'
    };

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      preview = preview.replace(regex, String(value));
    });

    setPromptPreview(preview);
  }, [selectedTemplateData, selectedTopics, selectedSubtopics, formData, topics, subtopics]);

  // Handle variable changes
  const handleVariableChange = useCallback((name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variable_values: {
        ...prev.variable_values,
        [name]: value
      }
    }));
  }, []);

  const renderVariableInputs = () => {
    if (!selectedTemplate || !selectedTemplateDetails) {
      return (
        <div className="text-gray-500 text-sm">
          Please select a template to configure variables
        </div>
      );
    }

    const variables = selectedTemplateDetails.variables || [];
    if (variables.length === 0) {
      return (
        <div className="text-gray-500 text-sm">
          No configurable variables found for this template
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {variables.map((variable: TemplateVariable) => (
            <div key={variable.name} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {variable.display_name}
                {variable.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {variable.variable_type_id === 'number' ? (
                <input
                  type="number"
                  value={formData.variable_values[variable.name] || variable.default_value || ''}
                  onChange={(e) => handleVariableChange(variable.name, parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="1"
                  required={variable.is_required}
                  placeholder={variable.description || `Enter ${variable.display_name.toLowerCase()}`}
                />
              ) : variable.variable_type_id === 'difficulty_level' ? (
                <select
                  value={formData.variable_values[variable.name] || variable.default_value || ''}
                  onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                  required={variable.is_required}
                >
                  <option value="">Select difficulty level</option>
                  {Array.isArray(variable.options) && variable.options.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : variable.variable_type_id === 'text' ? (
                <input
                  type="text"
                  value={formData.variable_values[variable.name] || variable.default_value || ''}
                  onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required={variable.is_required}
                  placeholder={variable.description || `Enter ${variable.display_name.toLowerCase()}`}
                />
              ) : variable.variable_type_id === 'select' ? (
                <select
                  value={formData.variable_values[variable.name] || variable.default_value || ''}
                  onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                  required={variable.is_required}
                >
                  <option value="">Select {variable.display_name.toLowerCase()}</option>
                  {Array.isArray(variable.options) && variable.options.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : null}
              {variable.description && (
                <p className="text-sm text-gray-500">{variable.description}</p>
              )}
            </div>
          ))}
      </div>
    );
  };

  // Render topic and subtopic selection
  const renderTopicSubtopicSelection = () => {
    return (
      <div className="grid grid-cols-2 gap-6 mt-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Topics</h3>
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {topics.map((topic) => {
                const topicSubtopics = subtopics.filter(s => s.topic_id === topic.topic_id);
                const selectedSubtopicCount = topicSubtopics.filter(s => selectedSubtopics.has(s.subtopic_id)).length;
                const isFullySelected = selectedSubtopicCount === topicSubtopics.length && topicSubtopics.length > 0;
                const isPartiallySelected = selectedSubtopicCount > 0 && !isFullySelected;
                
                return (
                  <button
                    key={topic.topic_id}
                    onClick={() => {
                      setViewingTopicId(topic.topic_id);
                      setSelectedTopics(prev => {
                        const newSet = new Set(prev);
                        newSet.add(topic.topic_id);
                        return newSet;
                      });
                    }}
                    className={`p-3 text-left rounded-lg flex justify-between items-center ${
                      isFullySelected
                        ? 'bg-green-100 text-green-800'
                        : isPartiallySelected
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{topic.topic_name}</span>
                    {selectedSubtopicCount > 0 && (
                      <span className="text-xs bg-white px-2 py-1 rounded-full">
                        {selectedSubtopicCount}/{topicSubtopics.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Subtopics
              {viewingTopicId && (
                <span className="text-sm text-gray-500 ml-2">
                  ({topics.find(t => t.topic_id === viewingTopicId)?.topic_name})
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {subtopics
                .filter((subtopic) => !viewingTopicId || subtopic.topic_id === viewingTopicId)
                .map((subtopic) => {
                  const isSelected = selectedSubtopics.has(subtopic.subtopic_id);
                  return (
                  <button
                    key={subtopic.subtopic_id}
                    onClick={() => {
                      setSelectedSubtopics(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(subtopic.subtopic_id)) {
                          newSet.delete(subtopic.subtopic_id);
                        } else {
                          newSet.add(subtopic.subtopic_id);
                        }
                        return newSet;
                      });
                    }}
                    className={`p-3 text-left rounded-lg ${
                      isSelected
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {subtopic.subtopic_name}
                  </button>
                )})}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Task creation status section
  const renderTaskStatus = () => {
    const isReady = areRequiredVariablesFilled();
    
    return (
      <div className="bg-white rounded-lg p-4 border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Task Creation Status</h3>
        <div className="space-y-2">
          <div className={`flex items-center ${isReady ? 'text-green-700' : 'text-red-700'}`}>
            {isReady ? '✓' : '✗'} {isReady ? 'Ready to create' : 'Not Ready'}
          </div>
          <div className="text-sm space-y-1">
            <div className={`flex items-center ${selectedTemplate ? 'text-green-700' : 'text-gray-500'}`}>
              {selectedTemplate ? '✓' : '•'} Template selected
            </div>
            <div className={`flex items-center ${selectedSubject ? 'text-green-700' : 'text-gray-500'}`}>
              {selectedSubject ? '✓' : '•'} Subject selected
            </div>
            <div className={`flex items-center ${selectedTopics.size > 0 ? 'text-green-700' : 'text-gray-500'}`}>
              {selectedTopics.size > 0 ? '✓' : '•'} Topics selected ({selectedTopics.size})
            </div>
            <div className={`flex items-center ${selectedSubtopics.size > 0 ? 'text-green-700' : 'text-gray-500'}`}>
              {selectedSubtopics.size > 0 ? '✓' : '•'} Subtopics selected ({selectedSubtopics.size})
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Task</h1>
      </div>

      <div className="grid gap-6">
        {/* Template Selection */}
        <div className="bg-white rounded-lg p-6 border">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Template</h2>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="">Select a template</option>
            {templates?.map((template: Template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Selection */}
        <div className="bg-white rounded-lg p-6 border">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Subject</h2>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="">Select a subject</option>
            {subjects?.map((subject) => (
              <option key={subject.subject_id} value={subject.subject_id}>
                {subject.subject_name}
              </option>
            ))}
          </select>
        </div>

        {/* Topics and Subtopics Selection */}
        {selectedSubject && (
          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Select Topics and Subtopics</h2>
            {renderTopicSubtopicSelection()}
          </div>
        )}

        {/* Variable Inputs */}
        {selectedTemplate && (
          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Configure Variables</h2>
            {renderVariableInputs()}
          </div>
        )}

        {/* Prompt Preview */}
        {selectedTemplate && (
          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Prompt Preview</h2>
            <pre className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm">
              {promptPreview}
            </pre>
          </div>
        )}

        {/* Task Status */}
        <div className="bg-white rounded-lg p-6 border">
          {renderTaskStatus()}
        </div>

        {/* Create Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!areRequiredVariablesFilled()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}