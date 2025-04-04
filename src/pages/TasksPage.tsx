import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

// Types
interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template_text: string;
  variables: TemplateVariable[];
  created_at: string;
  updated_at: string;
}

interface TemplateVariable {
  name: string;
  display_name: string;
  description: string;
  variable_type_id: string;
  is_required: boolean;
  default_value: string;
  options?: string;
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

interface FormData {
  template_id: string;
  variable_values: {
    [key: string]: any;
  };
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
];

const getDifficultyLabel = (level: string) => {
  switch (level) {
    case '0':
      return 'Easiest';
    case '1':
      return 'Easy';
    case '2':
      return 'Medium';
    case '3':
      return 'Hard';
    case '4':
      return 'Very Hard';
    case '5':
      return 'Hardest';
    default:
      return 'Unknown';
  }
};

export function TasksPage() {
  // State for UI
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedTemplateData, setSelectedTemplateData] = useState<PromptTemplate | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<number[]>([]);
  const [selectedDistribution, setSelectedDistribution] = useState<string>('equal');
  const [customDistribution, setCustomDistribution] = useState<Record<string, number>>({
    '0': 16,
    '1': 17,
    '2': 17,
    '3': 17,
    '4': 17,
    '5': 16
  });
  const [distributionTotal, setDistributionTotal] = useState<number>(100);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  // State for data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [formData, setFormData] = useState<FormData>({
    template_id: '',
    variable_values: {},
  });
  const [promptPreview, setPromptPreview] = useState<string>('');

  // State for loading indicators
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(false);
  const [isLoadingSubtopics, setIsLoadingSubtopics] = useState<boolean>(false);

  // State for authentication
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Login function
  const login = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'test123',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      const authToken = data.token;
      
      // Save token to localStorage
      localStorage.setItem('auth_token', authToken);
      setToken(authToken);
      setIsAuthenticated(true);
      
      return authToken;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Ensure authentication before API calls
  const ensureAuthenticated = async () => {
    if (!isAuthenticated && !isAuthenticating && !authError) {
      return await login();
    }
    return token;
  };

  // Add authentication headers to fetch requests
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const authToken = await ensureAuthenticated();
    
    if (!authToken) {
      throw new Error('Authentication required');
    }
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${authToken}`,
    };
    
    return fetch(url, {
      ...options,
      headers,
    });
  };

  // Fetch tasks
  const { data: tasks, isLoading: isLoadingTasks, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      return response.json();
    },
  });

  // Direct fetch for templates (bypassing authentication)
  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/prompt-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching templates:', error);
      return null;
    }
  };

  // Fetch templates
  const { data: templates, isLoading: isLoadingTemplates, refetch: refetchTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      // Try direct fetch first (unprotected endpoint)
      const directResult = await fetchTemplates();
      if (directResult) {
        return directResult;
      }
      
      // If direct fetch fails, try with authentication
      const response = await authenticatedFetch('/api/prompt-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return response.json();
    },
    retry: 3,
    refetchOnWindowFocus: false,
  });

  // Retry loading templates
  const retryLoadTemplates = () => {
    refetchTemplates();
  };

  // Fetch subjects
  const fetchSubjects = async () => {
    setIsLoadingSubjects(true);
    try {
      const response = await authenticatedFetch('/api/master-data/subjects');
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  // Fetch topics based on selected subject
  const fetchTopics = async (subjectId: string) => {
    setIsLoadingTopics(true);
    try {
      const response = await authenticatedFetch(`/api/master-data/topics/${subjectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }
      const data = await response.json();
      setTopics(data);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setIsLoadingTopics(false);
    }
  };

  // Fetch subtopics based on selected topic
  const fetchSubtopics = async (topicId: string) => {
    setIsLoadingSubtopics(true);
    try {
      const response = await authenticatedFetch(`/api/master-data/subtopics/${topicId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subtopics');
      }
      const data = await response.json();
      setSubtopics(data);
    } catch (error) {
      console.error('Error fetching subtopics:', error);
      toast.error('Failed to load subtopics');
    } finally {
      setIsLoadingSubtopics(false);
    }
  };

  // Fetch difficulty levels
  const { data: difficultyLevels } = useQuery({
    queryKey: ['difficultyLevels', selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return [];
      const response = await authenticatedFetch(`/api/master-data/difficulty-levels/${selectedSubject}`);
      if (!response.ok) {
        throw new Error('Failed to fetch difficulty levels');
      }
      return response.json();
    },
    enabled: !!selectedSubject,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: FormData) => {
      const response = await authenticatedFetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to create task');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Task created successfully');
      setIsModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: Error) => {
      console.error('Error creating task:', error);
      toast.error(`Failed to create task: ${error.message}`);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await authenticatedFetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete task');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Task deleted successfully');
      refetch();
    },
    onError: (error: Error) => {
      console.error('Error deleting task:', error);
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });

  // Reset form
  const resetForm = () => {
    setSelectedTemplate('');
    setSelectedTemplateData(null);
    setSelectedSubject('');
    setSelectedTopics([]);
    setSelectedSubtopics([]);
    setFormData({
      template_id: '',
      variable_values: {},
    });
    setPromptPreview('');
    setSelectedDistribution('equal');
    setCustomDistribution({
      '0': 16,
      '1': 17,
      '2': 17,
      '3': 17,
      '4': 17,
      '5': 16
    });
  };

  // Update selected template data when template changes
  useEffect(() => {
    if (selectedTemplate && templates) {
      const template = templates.find((t: PromptTemplate) => t.id === selectedTemplate);
      setSelectedTemplateData(template || null);
    } else {
      setSelectedTemplateData(null);
    }
  }, [selectedTemplate, templates]);

  // Update form data when template changes
  useEffect(() => {
    if (selectedTemplateData) {
      try {
        // Initialize form data with default values
        const initialValues: Record<string, any> = {};

        // Ensure variables array exists and is an array before iterating
        const variables = Array.isArray(selectedTemplateData.variables)
          ? selectedTemplateData.variables
          : [];

        // Add default values for common variables even if not in template
        initialValues.total_questions = 10;
        initialValues.katex_style = 'minimal';
        initialValues.difficulty_distribution = PRESET_DISTRIBUTIONS[0].distribution;

        // Add values from template variables
        variables.forEach(variable => {
          if (variable && variable.name) {
            initialValues[variable.name] = variable.default_value || '';
          }
        });

        setFormData({
          template_id: selectedTemplate,
          variable_values: initialValues,
        });
      } catch (error) {
        console.error('Error processing template data:', error);
        toast.error('Error loading template data');
      }
    }
  }, [selectedTemplate, selectedTemplateData]);

  // Update topics when subject changes
  useEffect(() => {
    if (selectedSubject) {
      setSelectedTopics([]);
      setSelectedSubtopics([]);
      setFormData(prev => ({
        ...prev,
        variable_values: {
          ...prev.variable_values,
          subject: subjects?.find((s: Subject) => s.subject_id === parseInt(selectedSubject))?.subject_name || '',
          topic: '',
          subtopic: '',
        },
      }));
      fetchTopics(selectedSubject);
    }
  }, [selectedSubject, subjects]);

  // Update subtopics when topic changes
  useEffect(() => {
    if (selectedTopics.length > 0) {
      setSelectedSubtopics([]);
      setFormData(prev => ({
        ...prev,
        variable_values: {
          ...prev.variable_values,
          topic: selectedTopics
            .map(topicId => topics?.find((t: Topic) => t.topic_id === topicId)?.topic_name || '')
            .join(', '),
          subtopic: '',
        },
      }));
      selectedTopics.forEach(topicId => fetchSubtopics(String(topicId)));
    }
  }, [selectedTopics, topics]);

  // Update difficulty distribution when preset changes
  useEffect(() => {
    const preset = PRESET_DISTRIBUTIONS.find(d => d.id === selectedDistribution);
    if (preset) {
      if (preset.id === 'custom') {
        setFormData(prev => ({
          ...prev,
          variable_values: {
            ...prev.variable_values,
            difficulty_distribution: customDistribution,
          },
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          variable_values: {
            ...prev.variable_values,
            difficulty_distribution: preset.distribution,
          },
        }));
        setCustomDistribution(preset.distribution);
      }
    }
  }, [selectedDistribution, customDistribution]);

  // Update distribution total when custom distribution changes
  useEffect(() => {
    if (selectedDistribution === 'custom') {
      const total = Object.values(customDistribution).reduce((sum, value) => sum + value, 0);
      setDistributionTotal(total);
    } else {
      setDistributionTotal(100);
    }
  }, [selectedDistribution, customDistribution]);

  // Generate prompt preview
  useEffect(() => {
    try {
      if (selectedTemplateData && selectedTemplateData.template_text) {
        let preview = selectedTemplateData.template_text;

        // Get all variables from the template text
        const variableMatches = preview.match(/{([^{}]+)}/g) || [];
        const variableNames = variableMatches.map(match => match.replace(/{|}/g, ''));

        // Replace variables with their values
        for (const varName of variableNames) {
          const value = formData.variable_values[varName];
          if (value !== undefined && value !== null && value !== '') {
            const regex = new RegExp(`{${varName}}`, 'g');
            if (typeof value === 'object') {
              preview = preview.replace(regex, JSON.stringify(value, null, 2));
            } else {
              preview = preview.replace(regex, String(value));
            }
          }
        }

        setPromptPreview(preview);
      } else if (selectedTemplateData) {
        setPromptPreview(selectedTemplateData.template_text || 'No template text available');
      } else {
        setPromptPreview('Select a template to see preview');
      }
    } catch (error) {
      console.error('Error generating prompt preview:', error);
      setPromptPreview('Error generating preview: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [selectedTemplateData, formData.variable_values]);

  // Check if all required variables have values
  const areRequiredVariablesFilled = () => {
    if (!selectedTemplateData) return false;
    if (!selectedTemplate) return false;

    try {
      // Check if subject and topic are selected (these are always required)
      if (!selectedSubject || selectedTopics.length === 0) {
        return false;
      }

      // Ensure variables array exists and is an array
      const variables = Array.isArray(selectedTemplateData.variables)
        ? selectedTemplateData.variables
        : [];

      // If no variables defined, consider it valid
      if (variables.length === 0) return true;

      // Check all required variables
      return variables
        .filter(v => v && v.is_required)
        .every(v => {
          if (!v || !v.name) return true; // Skip invalid variable definitions
          const value = formData.variable_values[v.name];
          return value !== undefined && value !== '' && value !== null;
        });
    } catch (error) {
      console.error('Error checking required variables:', error);
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!selectedTemplate) {
        toast.error('Please select a template');
        return;
      }

      if (!selectedSubject) {
        toast.error('Please select a subject');
        return;
      }

      if (selectedTopics.length === 0) {
        toast.error('Please select at least one topic');
        return;
      }

      if (!areRequiredVariablesFilled()) {
        toast.error('Please fill in all required variables');
        return;
      }

      if (selectedDistribution === 'custom' && distributionTotal !== 100) {
        toast.error('Difficulty distribution percentages must add up to 100%');
        return;
      }

      // Make sure subject and topic are properly set in the form data
      const updatedFormData = {
        ...formData,
        variable_values: {
          ...formData.variable_values,
          subject: subjects?.find((s: Subject) => s.subject_id === parseInt(selectedSubject))?.subject_name || '',
          topic: selectedTopics
            .map(topicId => topics?.find((t: Topic) => t.topic_id === topicId)?.topic_name || '')
            .join(', '),
          subtopic: selectedSubtopics
            .map(subtopicId => subtopics?.find((s: Subtopic) => s.subtopic_id === subtopicId)?.subtopic_name || '')
            .join(', '),
        }
      };

      createTaskMutation.mutate(updatedFormData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An error occurred while creating the task');
    }
  };

  // Handle custom distribution change
  const handleCustomDistributionChange = (level: string, value: number) => {
    setCustomDistribution(prev => ({
      ...prev,
      [level]: value
    }));
  };

  // Handle variable change
  const handleVariableChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variable_values: {
        ...prev.variable_values,
        [name]: value,
      },
    }));
  };

  // Group variables by category
  const groupVariablesByCategory = (variables: TemplateVariable[]) => {
    if (!variables) return {};
    
    const grouped: Record<string, TemplateVariable[]> = {
      'Display Options': []
    };
    
    variables.forEach(variable => {
      if (variable.name === 'katex_style') {
        grouped['Display Options'].push(variable);
      }
    });
    
    // Remove empty groups
    Object.keys(grouped).forEach(key => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });
    
    return grouped;
  };

  // Compute initial state for expanded groups
  useEffect(() => {
    if (selectedTemplateData && selectedTemplateData.variables) {
      const groups = Object.keys(groupVariablesByCategory(selectedTemplateData.variables));
      const initialExpandedState: Record<string, boolean> = {};
      groups.forEach(group => {
        initialExpandedState[group] = true;
      });
      setExpandedGroups(initialExpandedState);
    }
  }, [selectedTemplateData]);

  // Function to toggle group expansion
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Topic and Subtopic Selection UI
  const renderTopicSubtopicSelection = () => {
    return (
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h4 className="font-medium text-gray-700 mb-4">Topic and Subtopic Selection</h4>
        
        {/* Subject Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => {
              const newSubjectId = e.target.value;
              setSelectedSubject(newSubjectId);
              // Reset topic selections when subject changes
              setSelectedTopics([]);
              setSelectedSubtopics([]);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Select a subject</option>
            {subjects.map((subject) => (
              <option key={subject.subject_id} value={subject.subject_id}>
                {subject.subject_name}
              </option>
            ))}
          </select>
        </div>
        
        {selectedSubject && (
          <div className="flex flex-col md:flex-row md:space-x-4">
            {/* Topics List */}
            <div className="w-full md:w-1/2 mb-4 md:mb-0">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Topics
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allTopicIds = topics
                        .filter(topic => topic.subject_id === parseInt(selectedSubject))
                        .map(topic => topic.topic_id);
                      setSelectedTopics(allTopicIds);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTopics([]);
                      setSelectedSubtopics([]);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-300 rounded-md overflow-y-auto max-h-60">
                {topics
                  .filter(topic => topic.subject_id === parseInt(selectedSubject))
                  .map(topic => (
                    <div 
                      key={topic.topic_id} 
                      className="border-b border-gray-300 last:border-b-0"
                    >
                      <div 
                        className="flex items-center p-2 cursor-pointer hover:bg-gray-50"
                      >
                        <div className="flex-shrink-0 mr-2">
                          <input
                            type="checkbox"
                            checked={selectedTopics.includes(topic.topic_id)}
                            onChange={(e) => {
                              // Checkbox click to select/deselect
                              e.stopPropagation();
                              if (e.target.checked) {
                                setSelectedTopics(prev => [...prev, topic.topic_id]);
                              } else {
                                setSelectedTopics(prev => prev.filter(id => id !== topic.topic_id));
                                // Also remove any subtopics from this topic
                                setSelectedSubtopics(prev => 
                                  prev.filter(id => 
                                    !subtopics.find(st => st.subtopic_id === id && st.topic_id === topic.topic_id)
                                  )
                                );
                              }
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="text-sm font-medium">{topic.topic_name}</div>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
            
            {/* Subtopics for Selected Topic */}
            <div className="w-full md:w-1/2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Subtopics
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allSubtopicIds = subtopics
                        .filter(subtopic => subtopic.topic_id === selectedTopics[0])
                        .map(subtopic => subtopic.subtopic_id);
                      setSelectedSubtopics(prev => {
                        const currentIds = new Set(prev);
                        allSubtopicIds.forEach(id => currentIds.add(id));
                        return Array.from(currentIds);
                      });
                      // Also make sure the parent topic is selected
                      if (!selectedTopics.includes(selectedTopics[0])) {
                        setSelectedTopics(prev => [...prev, selectedTopics[0]]);
                      }
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubtopics(prev => 
                        prev.filter(id => 
                          !subtopics.find(st => st.subtopic_id === id && st.topic_id === selectedTopics[0])
                        )
                      );
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-300 rounded-md overflow-y-auto max-h-60">
                {selectedTopics.length > 0 ? (
                  subtopics
                    .filter(subtopic => subtopic.topic_id === selectedTopics[0])
                    .map(subtopic => (
                      <div 
                        key={subtopic.subtopic_id} 
                        className="border-b border-gray-300 last:border-b-0"
                      >
                        <div className="flex items-center p-2 cursor-pointer hover:bg-gray-50">
                          <div className="flex-shrink-0 mr-2">
                            <input
                              type="checkbox"
                              checked={selectedSubtopics.includes(subtopic.subtopic_id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubtopics(prev => [...prev, subtopic.subtopic_id]);
                                  // Also make sure the parent topic is selected
                                  if (!selectedTopics.includes(selectedTopics[0])) {
                                    setSelectedTopics(prev => [...prev, selectedTopics[0]]);
                                  }
                                } else {
                                  setSelectedSubtopics(prev => prev.filter(id => id !== subtopic.subtopic_id));
                                }
                              }}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="text-sm">{subtopic.subtopic_name}</div>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Select a topic to view its subtopics
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Selected Topics and Subtopics Summary */}
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Selected Items:</div>
          <div className="bg-white p-3 rounded-md border border-gray-200 text-sm">
            {selectedTopics.length === 0 ? (
              <div className="text-gray-500">No topics selected</div>
            ) : (
              <div>
                <div className="mb-2">
                  <span className="font-medium">Topics:</span> {selectedTopics.length}
                </div>
                <div>
                  <span className="font-medium">Subtopics:</span> {selectedSubtopics.length}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // State for tracking which parameter groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Display Options': true
  });

  // Render variable inputs based on template
  const renderVariableInputs = () => {
    if (!selectedTemplateData || !selectedTemplateData.variables) {
      return null;
    }

    const groupedVariables = groupVariablesByCategory(selectedTemplateData.variables);

    return (
      <div className="space-y-6">
        {/* Subject, Topic, Subtopic Selection */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h4 className="font-medium text-gray-700 mb-4">Subject Selection</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubject || ''}
              onChange={(e) => {
                const subjectId = e.target.value;
                setSelectedSubject(subjectId ? subjectId : '');
                if (subjectId) {
                  fetchTopics(subjectId);
                } else {
                  setTopics([]);
                  setSelectedTopics([]);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select a subject</option>
              {isLoadingSubjects ? (
                <option disabled>Loading subjects...</option>
              ) : subjects && subjects.length > 0 ? (
                subjects.map((subject: Subject) => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name}
                  </option>
                ))
              ) : (
                <option disabled>No subjects available</option>
              )}
            </select>
          </div>
        </div>

        {/* Topic and Subtopic Selection */}
        {renderTopicSubtopicSelection()}

        {/* Difficulty Distribution */}
        {selectedTemplateData.variables.some((variable: any) => variable.name === 'difficulty_distribution') && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-4">Difficulty Distribution</h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Questions <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.variable_values.total_questions || 10}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 10;
                  handleVariableChange('total_questions', value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distribution Preset
              </label>
              <select
                value={selectedDistribution}
                onChange={(e) => setSelectedDistribution(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {PRESET_DISTRIBUTIONS.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedDistribution === 'custom' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-gray-700">Custom Distribution</h5>
                  <span className={`text-sm font-medium ${distributionTotal === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    Total: {distributionTotal}%
                  </span>
                </div>
                
                {Object.entries(customDistribution).map(([level, percentage]) => (
                  <div key={level} className="flex items-center gap-4">
                    <label className="block text-sm font-medium text-gray-700 w-24">
                      Level {level}: {getDifficultyLabel(level)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={percentage}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        handleCustomDistributionChange(level, value);
                      }}
                      className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {percentage}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Additional Parameters */}
        {Object.entries(groupVariablesByCategory(selectedTemplateData.variables)).map(([groupName, variables]) => (
          <div key={groupName} className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-700">{groupName}</h4>
              <button
                type="button"
                onClick={() => toggleGroup(groupName)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className={`text-2xl ${expandedGroups[groupName] ? 'rotate-180' : ''}`}>▼</span>
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              {groupName === 'Display Options' && 
                'Visual formatting settings including KaTeX math rendering options and layout preferences.'}
            </p>
            
            {expandedGroups[groupName] && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {variables.map((variable: any) => {
                  if (!variable || !variable.name) return null;
                  
                  const inputType = variable.type === 'number' ? 'number' : 'text';
                  const isRequired = !!variable.is_required;
                  
                  return (
                    <div key={variable.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {variable.display_name || variable.name}
                        {isRequired && <span className="text-red-500">*</span>}
                      </label>
                      
                      {/* Special handling for katex_style */}
                      {variable.name === 'katex_style' ? (
                        <select
                          value={formData.variable_values[variable.name] || ''}
                          onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required={isRequired}
                        >
                          <option value="">None (No KaTeX)</option>
                          <option value="minimal">Minimal</option>
                          <option value="standard">Standard</option>
                          <option value="full">Full</option>
                        </select>
                      ) : (
                        <input
                          type={inputType}
                          value={formData.variable_values[variable.name] || ''}
                          onChange={(e) => {
                            const value = inputType === 'number' ? parseInt(e.target.value) : e.target.value;
                            handleVariableChange(variable.name, value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required={isRequired}
                          placeholder={variable.description || ''}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Attempt authentication on component mount
  useEffect(() => {
    const attemptAuth = async () => {
      try {
        if (!isAuthenticated && !isAuthenticating && !authError) {
          await login();
        }
      } catch (error) {
        console.error('Authentication error:', error);
      }
    };
    
    attemptAuth();
  }, []);

  // Load subjects after authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubjects();
    }
  }, [isAuthenticated]);

  // Add a function to retry authentication
  const retryAuthentication = async () => {
    setAuthError(null);
    await login();
  };

  // Render authentication error message if needed
  const renderAuthError = () => {
    if (authError) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <div>
            <p className="font-medium">Authentication Error</p>
            <p className="text-sm">{authError}</p>
          </div>
          <button 
            onClick={retryAuthentication}
            className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-1 px-2 rounded text-sm"
          >
            Retry
          </button>
        </div>
      );
    }
    return null;
  };

  // Handle topic selection (multiple)
  const handleTopicSelection = (topicId: number) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  };

  // Handle subtopic selection (multiple)
  const handleSubtopicSelection = (subtopicId: number) => {
    setSelectedSubtopics(prev => {
      if (prev.includes(subtopicId)) {
        return prev.filter(id => id !== subtopicId);
      } else {
        return [...prev, subtopicId];
      }
    });
  };

  // Update form data when topics or subtopics selection changes
  useEffect(() => {
    if (selectedTopics.length > 0) {
      const topicNames = topics
        ?.filter((t: Topic) => selectedTopics.includes(t.topic_id))
        .map((t: Topic) => t.topic_name)
        .join(', ');
      
      setFormData(prev => ({
        ...prev,
        variable_values: {
          ...prev.variable_values,
          topic: topicNames || '',
        },
      }));
    }
  }, [selectedTopics, topics]);

  useEffect(() => {
    if (selectedSubtopics.length > 0) {
      const subtopicNames = subtopics
        ?.filter((s: Subtopic) => selectedSubtopics.includes(s.subtopic_id))
        .map((s: Subtopic) => s.subtopic_name)
        .join(', ');
      
      setFormData(prev => ({
        ...prev,
        variable_values: {
          ...prev.variable_values,
          subtopic: subtopicNames || '',
        },
      }));
    }
  }, [selectedSubtopics, subtopics]);

  return (
    <div className="container mx-auto px-4 py-8">
      {renderAuthError()}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      {isLoadingTasks ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : tasks && tasks.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task: any) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {task.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.prompt_template?.name || 'Unknown Template'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.created_at ? format(new Date(task.created_at), 'MMM d, yyyy HH:mm') : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        task.status === 'failed' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this task?')) {
                            deleteTaskMutation.mutate(task.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 mb-4">No tasks found. Create a new task to get started.</p>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>
      )}

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Template Selection */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-4">Template Selection</h4>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Template <span className="text-red-500">*</span>
                  </label>
                  
                  {isLoadingTemplates ? (
                    <div className="p-4 bg-gray-50 rounded-md flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
                      <span>Loading templates...</span>
                    </div>
                  ) : templates && templates.length > 0 ? (
                    <div className="relative">
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="">Select a template</option>
                        {templates.map((template: PromptTemplate) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                      
                      {selectedTemplate && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setExpandedTemplate(expandedTemplate === selectedTemplate ? null : selectedTemplate)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                          >
                            {expandedTemplate === selectedTemplate ? 'Hide' : 'Show'} template details
                            <span className={`ml-1 text-xs transition-transform duration-200 ${
                              expandedTemplate === selectedTemplate ? 'transform rotate-180' : ''
                            }`}>▼</span>
                          </button>
                          
                          {expandedTemplate === selectedTemplate && selectedTemplateData && (
                            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                              <div className="text-sm mb-2">
                                <span className="font-medium">Description:</span> {selectedTemplateData.description}
                              </div>
                              <div className="text-sm mb-2">
                                <span className="font-medium">Template Variables:</span>
                              </div>
                              <div className="bg-white p-2 rounded border border-gray-200 text-sm font-mono whitespace-pre-wrap">
                                {selectedTemplateData.template_text.split('\n').map((line, i) => (
                                  <div key={i} className="py-0.5">
                                    {line.replace(/{([^{}]+)}/g, (match) => (
                                      `<span class="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded border border-yellow-200">${match}</span>`
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-md text-center text-gray-500">
                      No templates available
                    </div>
                  )}
                  
                  {(!templates || templates.length === 0) && !isLoadingTemplates && (
                    <div className="mt-2 text-sm text-red-600">
                      <p>No templates found. Please check your connection or authentication.</p>
                      <div className="mt-1 flex space-x-2">
                        <button 
                          onClick={retryLoadTemplates}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                          type="button"
                        >
                          Retry Loading Templates
                        </button>
                        <span className="text-gray-400">|</span>
                        <button 
                          onClick={retryAuthentication}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                          type="button"
                        >
                          Retry Authentication
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Template Variables */}
                {selectedTemplateData && (
                  <>
                    {renderVariableInputs()}

                    {/* Prompt Preview */}
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                      <h4 className="font-medium text-gray-700 mb-4">Prompt Preview</h4>
                      {promptPreview.startsWith('Error generating preview') ? (
                        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700">
                          <p className="font-medium">Error Preview</p>
                          <p className="text-sm mt-1">{promptPreview.replace('Error generating preview: ', '')}</p>
                          <button
                            type="button"
                            onClick={() => {
                              // Force regenerate preview
                              if (selectedTemplateData) {
                                let preview = selectedTemplateData.template_text || '';
                                setPromptPreview(preview);
                              }
                            }}
                            className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium underline"
                          >
                            Retry Preview Generation
                          </button>
                        </div>
                      ) : (
                        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-inner">
                          <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto">
                            {promptPreview.split('\n').map((line, i) => {
                              // Process the line to highlight variables
                              const processedLine = line.replace(/{([^{}]+)}/g, (_, variableName) => {
                                // Check if this variable has a value
                                const hasValue = formData.variable_values[variableName] !== undefined && 
                                               formData.variable_values[variableName] !== null && 
                                               formData.variable_values[variableName] !== '';
                                
                                if (hasValue) {
                                  // Variable has a value - show in green
                                  return `[${variableName}=${formData.variable_values[variableName]}]`;
                                } else {
                                  // Variable needs a value - show in yellow
                                  return `[NEEDS VALUE: ${variableName}]`;
                                }
                              });
                              
                              return (
                                <div key={i} className="py-1">
                                  {processedLine.includes('[NEEDS VALUE:') ? (
                                    <span className="bg-yellow-50 text-yellow-800 px-1 py-0.5 rounded border border-yellow-200">
                                      {processedLine}
                                    </span>
                                  ) : processedLine.includes('[') ? (
                                    <span className="bg-green-50 text-green-800 px-1 py-0.5 rounded border border-green-200">
                                      {processedLine}
                                    </span>
                                  ) : (
                                    processedLine
                                  )}
                                </div>
                              );
                            })}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Debug info for Create Task button */}
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-700">Task Creation Status</h4>
                        <span className={areRequiredVariablesFilled() ? "text-green-600" : "text-red-600"}>
                          {areRequiredVariablesFilled() ? "✓ Ready" : "✗ Not Ready"}
                        </span>
                      </div>
                      
                      <div className="text-sm space-y-2">
                        <div className="flex items-center">
                          <span className={selectedTemplate ? "text-green-600" : "text-red-600"}>
                            {selectedTemplate ? "✓" : "✗"}
                          </span>
                          <span className="ml-2">Template selected</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className={selectedSubject ? "text-green-600" : "text-red-600"}>
                            {selectedSubject ? "✓" : "✗"}
                          </span>
                          <span className="ml-2">Subject selected</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className={selectedTopics.length > 0 ? "text-green-600" : "text-red-600"}>
                            {selectedTopics.length > 0 ? "✓" : "✗"}
                          </span>
                          <span className="ml-2">Topic selected</span>
                        </div>
                        
                        {selectedDistribution === 'custom' && (
                          <div className="flex items-center">
                            <span className={distributionTotal === 100 ? "text-green-600" : "text-red-600"}>
                              {distributionTotal === 100 ? "✓" : "✗"}
                            </span>
                            <span className="ml-2">Custom distribution total is 100% (currently {distributionTotal}%)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!areRequiredVariablesFilled() || (selectedDistribution === 'custom' && distributionTotal !== 100)}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none ${
                    areRequiredVariablesFilled() && (selectedDistribution !== 'custom' || distributionTotal === 100)
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-indigo-300 cursor-not-allowed'
                  }`}
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}