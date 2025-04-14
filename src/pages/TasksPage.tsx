import React, { useState, useEffect, useCallback } from 'react';
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

// const getDifficultyLabel = (level: string) => {
//   switch (level) {
//     case '0':
//       return 'Easiest';
//     case '1':
//       return 'Easy';
//     case '2':
//       return 'Medium';
//     case '3':
//       return 'Hard';
//     case '4':
//       return 'Very Hard';
//     case '5':
//       return 'Hardest';
//     default:
//       return 'Unknown';
//   }
// };

export function TasksPage() {
  // State for UI
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedTemplateData, setSelectedTemplateData] = useState<PromptTemplate | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<number[]>([]);
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
    try {
      const authToken = await ensureAuthenticated();
      
      if (!authToken) {
        throw new Error('Authentication required');
      }
      
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      // If we get a 401 Unauthorized, try to login again
      if (response.status === 401) {
        // Clear token and try to login again
        localStorage.removeItem('auth_token');
        setToken(null);
        setIsAuthenticated(false);
        
        // Try again with fresh login
        const newToken = await login();
        if (!newToken) {
          throw new Error('Authentication failed');
        }
        
        // Retry the request with the new token
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        return retryResponse;
      }
      
      return response;
    } catch (error) {
      console.error('Error in authenticatedFetch:', error);
      throw error;
    }
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
    onError: (error: unknown) => { // Explicitly type error as unknown
      console.error('Error creating task:', error);
      // Handle specific error messages from backend if available
      let errorMessage = 'Failed to create task. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        try {
          // Attempt to parse if it's a JSON response error
          const errorData = JSON.parse(String(error));
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // Fallback if parsing fails or it's another type
          console.error('Could not parse error object:', parseError, 'Original error:', error);
        }
      }
      
      toast.error(errorMessage);
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
    onError: (error: any) => {
      console.error('Error deleting task:', error);
      let errorMessage = 'Failed to delete task';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        try {
          // Attempt to parse if it's a JSON response error
          const errorData = JSON.parse(String(error));
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // Fallback if parsing fails or it's another type
          console.error('Could not parse error:', error);
        }
      }
      toast.error(errorMessage);
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
    setSelectedDifficultyDistribution('balanced');
    setCustomDistribution({
      '0': 16,
      '1': 17,
      '2': 17,
      '3': 17,
      '4': 17,
      '5': 16
    });
  };

  // Fetch template data when template ID changes
  useEffect(() => {
    // Ensure selectedTemplate is a valid, non-empty string before fetching
    if (!selectedTemplate || typeof selectedTemplate !== 'string' || selectedTemplate.trim() === '') {
      console.log('Template selection cleared or invalid:', selectedTemplate);
      setSelectedTemplateData(null);
      setFormData(prev => ({
        ...prev,
        template_id: '', // Clear template_id in form data
        variable_values: {},
      }));
      return;
    }

    console.log('Fetching template data for ID:', selectedTemplate); // Log the ID being fetched
    
    // Show loading state
    setIsLoadingTemplateData(true);
    
    // Get the authentication token
    const token = localStorage.getItem('auth_token');
    if (!token) {
        console.error("Authentication token not found. Please log in.");
        toast.error("Authentication token not found. Please log in.");
        setIsLoadingTemplateData(false);
        // Optionally redirect to login or handle appropriately
        return; 
    }
    
    // Make the API request
    fetch(`/api/prompt-templates/${selectedTemplate}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.status === 404) {
          console.error('Template not found (404) for ID:', selectedTemplate);
          toast.error('Selected template could not be found.');
          throw new Error('Template not found (404)'); // Specific error for 404
      }
      if (!response.ok) {
        // Log the actual status text for other errors
        console.error(`HTTP error ${response.status}: ${response.statusText} for ID:`, selectedTemplate);
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`); // Include status text
      }
      return response.json();
    })
    .then(data => {
      console.log('Template data loaded:', data);
      setSelectedTemplateData(data);
      
      // Pre-populate form with default values
      const defaultValues: Record<string, any> = {};
      
      // Add default values for common variables
      defaultValues.total_questions = totalQuestions; // Use state value
      defaultValues.difficulty_distribution = JSON.stringify(
        PRESET_DISTRIBUTIONS.find(d => d.id === selectedDifficultyDistribution)?.distribution || {}
      );
      
      // Add values from template variables
      if (data.variables && Array.isArray(data.variables)) {
        data.variables.forEach((variable: TemplateVariable) => {
          if (variable && variable.name) {
            // Only add template default if it doesn't conflict with core settings and isn't already set
            if (!(variable.name in defaultValues) && variable.default_value) {
              defaultValues[variable.name] = variable.default_value;
            } else if (!(variable.name in defaultValues)) {
              defaultValues[variable.name] = ''; // Initialize other variables as empty
            }
          }
        });
      }
      
      setFormData(prev => ({
        ...prev,
        template_id: selectedTemplate,
        variable_values: defaultValues,
      }));
      
      // Update prompt preview
      setTimeout(() => {
        selectedTemplateData && setPromptPreview(selectedTemplateData.template_text);
      }, 100);
    })
    .catch(error => {
      console.error('Error fetching template data:', error);
      // Avoid showing generic error if specific 404 toast was already shown
      if (!error.message.includes('404')) {
        toast.error('Error loading template data. Please try again.');
      }
      // Clear data if fetch fails
      setSelectedTemplateData(null);
      setFormData(prev => ({
        ...prev,
        template_id: selectedTemplate, // Keep selected ID but clear values
        variable_values: {},
      }));
    })
    .finally(() => {
      setIsLoadingTemplateData(false);
    });
  }, [selectedTemplate, totalQuestions, selectedDifficultyDistribution]); // Add dependencies

  // Update form data when template changes
  useEffect(() => {
    if (selectedTemplate && selectedTemplateData) {
      try {
        // Initialize form data with current task settings and template defaults
        // Initialize form data with default values
        const initialValues: Record<string, any> = {};
 
        // Add default values for common variables
        initialValues.total_questions = totalQuestions; // Correct: Use state number value
        initialValues.difficulty_distribution = JSON.stringify(
          PRESET_DISTRIBUTIONS.find(d => d.id === selectedDifficultyDistribution)?.distribution || {}
        );
 
        // Add values from template variables
        if (selectedTemplateData.variables && Array.isArray(selectedTemplateData.variables)) {
          selectedTemplateData.variables.forEach((variable: TemplateVariable) => {
            if (variable && variable.name) {
              // Only add template default if it doesn't conflict with core settings and isn't already set
              if (!(variable.name in initialValues) && variable.default_value) {
                initialValues[variable.name] = variable.default_value;
              } else if (!(variable.name in initialValues)) {
                initialValues[variable.name] = ''; // Initialize other variables as empty
              }
            }
          });
        }
        
        setFormData({
          template_id: selectedTemplate,
          variable_values: initialValues,
        });
        
        // Update prompt preview
        selectedTemplateData && setPromptPreview(selectedTemplateData.template_text); // Ensure preview updates with defaults
 
      } catch (error: any) {
        console.error('Error initializing form data:', error);
        toast.error(`Error setting up form: ${error.message || 'Unknown error'}`);
      }
    }
  }, [selectedTemplate, selectedTemplateData, selectedDifficultyDistribution, totalQuestions]); // Added dependencies
 
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
            .filter(Boolean)
            .join(', '),
          subtopic: '',
        },
      }));
      selectedTopics.forEach(topicId => fetchSubtopics(String(topicId)));
    }
  }, [selectedTopics, topics]);

  // Update difficulty distribution when preset changes
  useEffect(() => {
    const preset = PRESET_DISTRIBUTIONS.find(d => d.id === selectedDifficultyDistribution);
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
  }, [selectedDifficultyDistribution, customDistribution]);

  // Update distribution total when custom distribution changes
  useEffect(() => {
    if (selectedDifficultyDistribution === 'custom') {
      const total = Object.values(customDistribution).reduce((sum, value) => sum + value, 0);
      setDistributionTotal(total);
    } else {
      setDistributionTotal(100);
    }
  }, [selectedDifficultyDistribution, customDistribution]);

  // Handle changes in variable inputs
  const handleVariableChange = (name: string, value: any) => {
    console.log(`handleVariableChange: name='${name}', value=`, value);
    setFormData(prev => {
      const updatedValues = { ...prev.variable_values, [name]: value };
      console.log('Updating formData.variable_values:', updatedValues);
      return {
        ...prev,
        variable_values: updatedValues,
      };
    });
  };

  // Effect to update prompt preview when template or variable values change
  useEffect(() => {
    console.log('Preview useEffect triggered. selectedTemplateData:', selectedTemplateData, 'formData.variable_values:', formData.variable_values);
    if (selectedTemplateData) {
      let preview = selectedTemplateData.template_text;
      
      // Replace variables in the preview
      preview = preview.replace(/{([^{}]+)}/g, (_, variableName) => {
        const value = formData.variable_values[variableName];
        const hasValue = value !== undefined && value !== null && value !== '';
        if (hasValue) {
          // Use simple string representation for preview
          return `[${variableName}=${String(value)}]`;
        } else {
          // Check if it's a predefined variable we handle specially
          if (variableName === 'topic') {
            const topicNames = selectedTopics
              .map(id => topics.find(t => t.topic_id === id)?.topic_name)
              .filter(Boolean)
              .join(', ');
            return topicNames ? `[topic=${topicNames}]` : '[NEEDS VALUE: topic]';
          } else if (variableName === 'subtopic') {
            const subtopicNames = selectedSubtopics
              .map(id => subtopics.find(st => st.subtopic_id === id)?.subtopic_name)
              .filter(Boolean)
              .join(', ');
            return subtopicNames ? `[subtopic=${subtopicNames}]` : '[NEEDS VALUE: subtopic]';
          } else if (variableName === 'number') {
            return `[NEEDS VALUE: number]`; // Placeholder for total_questions logic if needed
          } else if (variableName === 'difficulty_level') {
             return `[NEEDS VALUE: difficulty_level]`; // Placeholder for difficulty
          }
           else if (variableName === '1') {
             return `[NEEDS VALUE: 1]`; // Placeholder for difficulty
          }
           else if (variableName === '2') {
             return `[NEEDS VALUE: 2]`; // Placeholder for difficulty
          }
            else if (variableName === 'level') {
             return `[NEEDS VALUE: level]`; // Placeholder for difficulty
          }
          // Default placeholder for other variables
          return `[NEEDS VALUE: ${variableName}]`;
        }
      });

      console.log('Generated Preview String:', preview);
      selectedTemplateData && setPromptPreview(preview);
    } else {
      setPromptPreview(''); // Clear preview if no template selected
    }
  }, [selectedTemplateData, formData.variable_values, selectedTopics, selectedSubtopics, topics, subtopics]); // Rerun when template, form values, or topic selections change

  // Function to check if all required variables are filled
  const areRequiredVariablesFilled = useCallback(() => {
    console.log('Checking required variables. selectedTemplateData:', selectedTemplateData);
    if (!selectedTemplateData || !selectedTemplateData.variables) {
      console.log('Required check: No template or variables.');
      return true; // No template selected or no variables to check
    }

    return selectedTemplateData.variables.every((variable: TemplateVariable) => {
      if (!variable.is_required) {
        // console.log(`Variable '${variable.name}' is not required.`);
        return true; // Not required, so it doesn't block readiness
      }

      const value = formData.variable_values[variable.name];
      console.log(`Checking required variable: '${variable.name}', Value:`, value);
      const isFilled = value !== undefined && value !== null && value !== '';
      if (!isFilled) {
        console.warn(`Required variable '${variable.name}' is missing or empty!`);
      }
      return isFilled;
    });
  }, [selectedTemplateData, formData.variable_values]);

  // Render task creation status
  const renderTaskCreationStatus = () => {
    const isReady = areRequiredVariablesFilled();
    
    return (
      <div className="flex items-center">
        <div className={`flex-shrink-0 h-3 w-3 rounded-full ${isReady ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className={`ml-2 text-sm ${isReady ? 'text-green-600' : 'text-red-600'}`}>
          {isReady ? 'Ready to create' : 'Not ready'}
        </span>
      </div>
    );
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
              setViewingTopicId(null);
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
                  setViewingTopicId(null);
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
              .map(topic => {
                const highlightClass = getTopicHighlightClass(topic.topic_id);
                
                return (
                  <div 
                    key={topic.topic_id} 
                    className={`border-b border-gray-300 last:border-b-0 ${
                      viewingTopicId === topic.topic_id ? 'bg-indigo-50' : highlightClass
                    }`}
                  >
                    <div 
                      className="flex items-center p-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        // Single click to focus on a topic without selecting subtopics
                        setViewingTopicId(topic.topic_id);
                      }}
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
                        <div className="text-xs text-gray-500">
                          {(() => {
                            const topicSubtopics = subtopics.filter(st => st.topic_id === topic.topic_id);
                            const selectedCount = topicSubtopics.filter(st => 
                              selectedSubtopics.includes(st.subtopic_id)
                            ).length;
                            
                            if (selectedCount === 0) return '';
                            if (selectedCount === topicSubtopics.length) return `${selectedCount}/${topicSubtopics.length} subtopics selected`;
                            return `${selectedCount}/${topicSubtopics.length} subtopics selected`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
        
        {/* Subtopics for Selected Topic */}
        <div className="w-full md:w-1/2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Subtopics {viewingTopicId && `for ${topics.find(t => t.topic_id === viewingTopicId)?.topic_name || ''}`}
            </label>
            {viewingTopicId && (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const allSubtopicIds = subtopics
                      .filter(subtopic => subtopic.topic_id === viewingTopicId)
                      .map(subtopic => subtopic.subtopic_id);
                    setSelectedSubtopics(prev => {
                      const currentIds = new Set(prev);
                      allSubtopicIds.forEach(id => currentIds.add(id));
                      return Array.from(currentIds);
                    });
                    // Also make sure the parent topic is selected
                    if (!selectedTopics.includes(viewingTopicId)) {
                      setSelectedTopics(prev => [...prev, viewingTopicId]);
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
                        !subtopics.find(st => st.subtopic_id === id && st.topic_id === viewingTopicId)
                      )
                    );
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          
          <div className="border border-gray-300 rounded-md overflow-y-auto max-h-60">
            {viewingTopicId ? (
              subtopics
                .filter(subtopic => subtopic.topic_id === viewingTopicId)
                .map(subtopic => (
                  <div 
                    key={subtopic.subtopic_id} 
                    className={`border-b border-gray-300 last:border-b-0 ${
                      selectedSubtopics.includes(subtopic.subtopic_id) ? 'bg-green-50' : ''
                    }`}
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
                              if (!selectedTopics.includes(viewingTopicId)) {
                                setSelectedTopics(prev => [...prev, viewingTopicId]);
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
    );
  };

  // State for tracking which parameter groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Display Options': true
  });

  // Render variable inputs based on template
  const renderVariableInputs = () => {
    if (!selectedTemplateData || !selectedTemplateData.variables || selectedTemplateData.variables.length === 0) {
      return <p className="text-sm text-gray-500">No variables defined for this template.</p>;
    }

    // Group variables and log the result (keep this log for now)
    const groupedVariables = groupVariablesByCategory(selectedTemplateData.variables);
    console.log('Result of groupVariablesByCategory:', groupedVariables);

    console.log('renderVariableInputs called. Initial variables:', selectedTemplateData.variables);

    return (
      <div className="space-y-6">
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
                value={selectedDifficultyDistribution}
                onChange={(e) => setSelectedDifficultyDistribution(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {PRESET_DISTRIBUTIONS.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Additional Parameters */}
        {Object.entries(groupVariablesByCategory(selectedTemplateData.variables)).map(([groupName, varsInCategory]) => {
          console.log(`Processing category: '${groupName}', Variables found: ${varsInCategory.length}`);
          return (
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
                  {(() => {
                    const allowedParams = ['number', 'difficulty_level'];
                    const filteredVars = varsInCategory.filter(variable => allowedParams.includes(variable.name));
                    
                    return filteredVars.map((variable: TemplateVariable) => {
                      console.log(`Rendering input for variable: '${variable.name}', Type: '${variable.data_type}', Options:`, variable.options);
                      // HACK: Assuming 'variable.type' exists despite TemplateVariable interface lacking it.
                      // Interface also defines 'options' as string, but usage expects array.
                      // TODO: Correct TemplateVariable interface definition.
                      const inputType = (variable as any).type || 'text'; // Revert to using 'type', casting to any to bypass TS error for now
                      const isRequired = variable.is_required ?? false;
                      
                      return (
                        <div key={variable.name} className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {variable.display_name || variable.name}
                            {isRequired && <span className="text-red-500">*</span>}
                          </label>
                          
                          {variable.name === 'difficulty_level' ? (
                            <select
                              value={formData.variable_values[variable.name] || 'Balanced'}
                              onChange={(e) => {
                                handleVariableChange(variable.name, e.target.value);
                              }}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                              required={isRequired}
                            >
                              <option value="Balanced">Balanced</option>
                              <option value="Easy Heavy">Easy Heavy</option>
                              <option value="Hard Heavy">Hard Heavy</option>
                            </select>
                          ) : Array.isArray(variable.options) && variable.options.length > 0 ? (
                            <select
                              value={formData.variable_values[variable.name] || ''}
                              onChange={(e) => {
                                handleVariableChange(variable.name, e.target.value);
                              }}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                              required={isRequired}
                            >
                              {variable.options.map((option: string) => (
                                <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={inputType}
                              value={formData.variable_values[variable.name] || ''}
                              onChange={(e) => {
                                const value = inputType === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
                                handleVariableChange(variable.name, value);
                              }}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required={isRequired}
                              placeholder={variable.description || ''}
                              step={inputType === 'number' ? '1' : undefined} // Assuming integer steps for 'number' type
                            />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          );
        })}
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
      const topicNames = selectedTopics
        .map(topicId => topics?.find((t: Topic) => t.topic_id === topicId)?.topic_name || '')
        .filter(Boolean)
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
        .map((s: Subtopic) => s.subtopic_name || '')
        .filter(Boolean)
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

  // Group variables by category
  const groupVariablesByCategory = (variables: TemplateVariable[]) => {
    if (!variables) return {};
    
    // Initialize default and specific categories
    const grouped: Record<string, TemplateVariable[]> = {
      'Parameters': [],
      'Display Options': []
    };
    
    variables.forEach(variable => {
      if (variable.name === 'katex_style') {
        grouped['Display Options'].push(variable);
      } else {
        // Add all other variables to the default 'Parameters' group
        grouped['Parameters'].push(variable);
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

      if (selectedDifficultyDistribution === 'custom' && distributionTotal !== 100) {
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
            .filter(Boolean)
            .join(', '),
          subtopic: selectedSubtopics
            .map(subtopicId => subtopics?.find((s: Subtopic) => s.subtopic_id === subtopicId)?.subtopic_name || '')
            .filter(Boolean)
            .join(', '),
          difficulty_distribution: JSON.stringify(
            selectedDifficultyDistribution === 'custom' 
              ? customDistribution 
              : PRESET_DISTRIBUTIONS.find(d => d.id === selectedDifficultyDistribution)?.distribution || {}
          ),
          total_questions: totalQuestions.toString()
        }
      };

      createTaskMutation.mutate(updatedFormData);
    } catch (error) {
      console.error('Error submitting form:', error);
      let errorMessage = 'An error occurred while creating the task';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        try {
          // Attempt to parse if it's a JSON response error
          const errorData = JSON.parse(String(error));
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // Fallback if parsing fails or it's another type
          console.error('Could not parse error:', error);
        }
      }
      
      toast.error(errorMessage);
    }
  };

  // Get highlight class for topic based on subtopic selection status
  const getTopicHighlightClass = (topicId: number) => {
    const topicSubtopics = subtopics.filter(st => st.topic_id === topicId);
    if (topicSubtopics.length === 0) return '';
    
    const selectedCount = topicSubtopics.filter(st => 
      selectedSubtopics.includes(st.subtopic_id)
    ).length;
    
    if (selectedCount === 0) return '';
    if (selectedCount === topicSubtopics.length) return 'bg-green-50';
    return 'bg-yellow-50';
  };

  // Render template selection dropdown with loading state
  const renderTemplateDropdown = () => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Template
        </label>
        <div className="relative">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white"
            disabled={isLoadingTemplates || isLoadingTemplateData}
          >
            <option value="">Select a template</option>
            {templates.map((template: PromptTemplate) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          {(isLoadingTemplates || isLoadingTemplateData) && (
            <div className="absolute right-2 top-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
        {isLoadingTemplateData && (
          <p className="text-xs text-blue-600 mt-1">Loading template data...</p>
        )}
      </div>
    );
  };

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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Create New Task</h3>
                  {renderTaskCreationStatus()}
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
                {renderTemplateDropdown()}

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
                                let preview = selectedTemplateData.template_text;
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
                        
                        {selectedDifficultyDistribution === 'custom' && (
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
                  disabled={!areRequiredVariablesFilled() || (selectedDifficultyDistribution === 'custom' && distributionTotal !== 100)}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none ${
                    areRequiredVariablesFilled() && (selectedDifficultyDistribution !== 'custom' || distributionTotal === 100)
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