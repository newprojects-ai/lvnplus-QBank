import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Define interfaces for data structures
interface Subject {
  id: number;
  subject_name: string;
}

interface Topic {
  id: number;
  topic_name: string;
  subject_id: number; // Added subject_id
}

interface Subtopic {
  id: number;
  subtopic_name: string;
  topic_id: number; // Added topic_id
}

interface DifficultyLevel {
  level_id: number;
  level_name: string;
  level_value: number;
  purpose: string;
  characteristics: string;
  focus_area: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  subject_id?: number;
  topic_id?: number;
  subtopic_id?: number;
  difficulty_level?: number; // Keep this for potential data structure consistency
  level_id?: number; // ID associated with the DifficultyLevel
  question_format: string;
  options_format: string | string[]; // Can be JSON string or array
  solution_format: string;
  example_question?: string;
  variables?: string; // Assuming variables are stored as a JSON string
}

interface TemplateFormData {
  name: string;
  description: string;
  subject_id: number | null;
  topic_id: number | null;
  subtopic_id: number | null;
  difficulty_level: number | null; // Keep this, might be used elsewhere or legacy
  level_id: number | null; // Use level_id for the dropdown selection
  question_format: string;
  options_format: string[]; // Always work with array internally
  solution_format: string;
  example_question: string;
}

// Define the structure for Variable Types if needed, e.g., for displaying available variables
// interface VariableType {
//   id: string;
//   name: string;
//   description: string;
// }

const ItemTypes = {
  TEMPLATE: 'template',
};

interface TemplateRowProps {
  template: Template;
  index: number;
  moveTemplate: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
}

const TemplateRow: React.FC<TemplateRowProps> = ({ template, index, moveTemplate, onEdit, onDelete }) => {
  const ref = React.useRef<HTMLTableRowElement>(null);
  const [, drop] = useDrop({
    accept: ItemTypes.TEMPLATE,
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveTemplate(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TEMPLATE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <tr 
      ref={ref} 
      key={template.id} 
      className={`border-b ${isDragging ? 'opacity-50' : ''} hover:bg-gray-50`}
      style={{ cursor: 'move' }}
    >
      <td className="py-3 px-4">{template.name}</td>
      <td className="py-3 px-4">{template.description || '-'}</td>
      <td className="py-3 px-4">
        <button onClick={() => onEdit(template)} className="text-blue-600 hover:text-blue-800 mr-2">
          Edit
        </button>
        <button onClick={() => onDelete(template.id)} className="text-red-600 hover:text-red-800">
          Delete
        </button>
      </td>
    </tr>
  );
};

const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  // Initial form state
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    subject_id: null,
    topic_id: null,
    subtopic_id: null,
    difficulty_level: null,
    level_id: null,
    question_format: '',
    options_format: ['', '', '', ''],
    solution_format: '',
    example_question: '',
  });

  const { 
    data: templates, 
    isLoading: isLoadingTemplates, 
    error: templatesError, 
    refetch: refetchTemplates 
  } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token'); 
      if (!token) {
        setAuthError('Authentication token not found. Please log in.');
        throw new Error('No authentication token found');
      }
      const response = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401) {
          setAuthError('Unauthorized. Please log in again.');
        }
        throw new Error(`HTTP error ${response.status}`);
      }
      setAuthError(null); 
      return response.json();
    },
    retry: (failureCount, error: any) => {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 3; 
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { 
    data: subjects, 
    isLoading: isLoadingSubjects, 
    error: subjectsError 
  } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token'); 
      if (!token) throw new Error('No authentication token found');
      const response = await fetch('/api/master-data/subjects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch subjects');
      return response.json();
    },
    enabled: !authError, 
  });

  const { data: topics } = useQuery<Topic[]>({
    queryKey: ['topics', selectedSubject],
    enabled: !!selectedSubject && !authError, 
    queryFn: async () => {
      const token = localStorage.getItem('auth_token'); 
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`/api/master-data/topics/${selectedSubject}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch topics');
      return response.json();
    },
  });

  const { data: subtopics } = useQuery<Subtopic[]>({
    queryKey: ['subtopics', selectedTopic],
    enabled: !!selectedTopic && !authError, 
    queryFn: async () => {
      const token = localStorage.getItem('auth_token'); 
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`/api/master-data/subtopics/${selectedTopic}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch subtopics');
      return response.json();
    },
  });

  const { data: difficultyLevels } = useQuery<DifficultyLevel[]>({
    queryKey: ['difficulty-levels'], 
    enabled: !authError, 
    queryFn: async () => {
      const token = localStorage.getItem('auth_token'); 
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`/api/master-data/difficulty-levels`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch difficulty levels');
      return response.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('auth_token'); 
    if (!token) {
      console.error('No authentication token found');
      toast.error('Authentication required. Please log in again.');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Template name is required.');
      return;
    }
    if (!formData.question_format.trim()) {
      toast.error('Question format is required.');
      return;
    }
    if (!formData.solution_format.trim()) {
      toast.error('Solution format is required.');
      return;
    }

    const endpoint = editingTemplate 
      ? `/api/templates/${editingTemplate.id}` 
      : '/api/templates';
    const method = editingTemplate ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          options_format: typeof formData.options_format === 'string' 
            ? formData.options_format 
            : JSON.stringify(formData.options_format),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save template' }));
        console.error('Save template error:', response.status, errorData);
        toast.error(`Failed to save template: ${errorData.message || response.statusText}`);
        throw new Error('Failed to save template');
      }

      const result = await response.json();
      toast.success(`Template ${editingTemplate ? 'updated' : 'created'} successfully! ID: ${result.id}`);

      setIsModalOpen(false);
      setEditingTemplate(null);
      refetchTemplates(); 
    } catch (error) {
      console.error('Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      if (!errorMessage.includes('Failed to save template')) {
         toast.error('An unexpected error occurred while saving the template.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    const token = localStorage.getItem('auth_token'); 
    if (!token) {
      console.error('No authentication token found');
      toast.error('Authentication required. Please log in again.');
      return;
    }

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ message: 'Failed to delete template' }));
         console.error('Delete template error:', response.status, errorData);
         toast.error(`Failed to delete template: ${errorData.message || response.statusText}`);
         throw new Error('Failed to delete template');
      }

      toast.success('Template deleted successfully!');
      refetchTemplates(); 
    } catch (error) {
      console.error('Error deleting template:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      if (!errorMessage.includes('Failed to delete template')) {
         toast.error('An unexpected error occurred while deleting the template.');
      }
    }
  };

  function insertVariableIntoTextarea(variableName: string, fieldName: string): void {
    try {
      const textarea = document.querySelector(`textarea[name="${fieldName}"]`) as HTMLTextAreaElement;
      if (!textarea) {
        console.error(`Textarea with name ${fieldName} not found`);
        toast.error(`Could not find textarea for ${fieldName}`);
        return;
      }
      
      const startPos = textarea.selectionStart || 0;
      const endPos = textarea.selectionEnd || 0;
      
      const variableText = `{{${variableName}}}`;
      
      const currentValue = textarea.value;
      
      const newValue = 
        currentValue.substring(0, startPos) + 
        variableText + 
        currentValue.substring(endPos);
      
      textarea.value = newValue;
      
      textarea.focus();
      const newCursorPos = startPos + variableText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      
      const inputEvent = new Event('input', { bubbles: true });
      textarea.dispatchEvent(inputEvent);
      
      toast.success(`Variable ${variableText} inserted`);
    } catch (error) {
      console.error('Error inserting variable:', error);
      toast.error('Failed to insert variable');
    }
  }
  
  const renderVariableButtonsForField = (fieldName: string): JSX.Element => {
    const variables = ['subject', 'topic', 'subtopic', 'difficulty']; 
    return (
       <div className="flex flex-wrap gap-1 mb-2">
        {variables.map(variable => (
         <button
          key={`${fieldName}-${variable}`} 
          type="button"
           className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
           onClick={() => insertVariableIntoTextarea(variable, fieldName)}
         >
          {variable}
         </button>
        ))}
       </div>
     );
   };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    
    try {
      // Parse options_format if it's a string
      let optionsFormat: string[] = [];
      try {
        if (typeof template.options_format === 'string' && template.options_format.trim().startsWith('[')) {
          optionsFormat = JSON.parse(template.options_format);
          // Ensure it's an array of strings
          if (!Array.isArray(optionsFormat) || optionsFormat.some(opt => typeof opt !== 'string')) {
             console.warn('Parsed options_format is not an array of strings, resetting.', optionsFormat);
             optionsFormat = ['', '', '', '']; 
          }
          // Ensure it has 4 elements, padding if necessary
          while (optionsFormat.length < 4) optionsFormat.push('');
          if (optionsFormat.length > 4) optionsFormat = optionsFormat.slice(0, 4);
        } else if (Array.isArray(template.options_format)) {
           // Ensure it's an array of strings and has 4 elements
           optionsFormat = template.options_format.map(opt => String(opt));
           while (optionsFormat.length < 4) optionsFormat.push('');
           if (optionsFormat.length > 4) optionsFormat = optionsFormat.slice(0, 4);
        } else {
           console.warn('options_format is not a valid JSON string or array, resetting.', template.options_format);
           optionsFormat = ['', '', '', '']; 
        }
      } catch (err) {
        console.error('Error parsing options format during edit:', err, template.options_format);
        optionsFormat = ['', '', '', '']; // Default to empty strings on parse error
      }
      
      // Create a properly typed form data object
      const updatedFormData: TemplateFormData = {
        name: template.name || '',
        description: template.description || '',
        subject_id: template.subject_id ?? null,
        topic_id: template.topic_id ?? null,
        subtopic_id: template.subtopic_id ?? null,
        difficulty_level: template.difficulty_level ?? null, // Keep null check
        level_id: template.level_id ?? null, // Use level_id from template
        question_format: template.question_format || '',
        options_format: optionsFormat, // Use the parsed and validated array
        solution_format: template.solution_format || '',
        example_question: template.example_question || '',
      };
      
      // Update form data state
      setFormData(updatedFormData);
      
      // Set selections for dropdowns - ensure IDs are valid numbers before setting
      setSelectedSubject(typeof template.subject_id === 'number' ? template.subject_id : null);
      setSelectedTopic(typeof template.topic_id === 'number' ? template.topic_id : null);
      
      // Open the modal
      setIsModalOpen(true);
      
      console.log('Editing template:', template.id, updatedFormData);
    } catch (error) {
      console.error('Error setting up edit form:', error);
      toast.error('Failed to load template for editing');
    }
  };

  return (
    <div className="p-8">
      {(authError || subjectsError || templatesError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {authError || 
           (subjectsError && 'Failed to load subjects. Please try again.') ||
           (templatesError && 'Failed to load templates. Please try again.')}
        </div>
      )}

      {(isLoadingTemplates || isLoadingSubjects) && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          Loading...
          {/* Optionally show which part is loading */} 
          {/* {isLoadingTemplates && <span>Loading templates... </span>} */} 
          {/* {isLoadingSubjects && <span>Loading subjects... </span>} */} 
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <button
          onClick={() => {
            setEditingTemplate(null);
            const defaultFormData: TemplateFormData = {
              name: '',
              description: '',
              subject_id: null,
              topic_id: null,
              subtopic_id: null,
              difficulty_level: null,
              level_id: null,
              question_format: '',
              options_format: ['', '', '', ''],
              solution_format: '',
              example_question: '',
            };
            setFormData(defaultFormData);
            
            setSelectedSubject(null);
            setSelectedTopic(null);
            
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          New Template
        </button>
      </div>

      <div className="grid gap-6">
        {isLoadingTemplates ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Loading templates...</p>
          </div>
        ) : templatesError ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-red-500">Error loading templates. Please try again.</p>
          </div>
        ) : !templates?.length ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No templates found. Create your first template!</p>
          </div>
        ) : templates?.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{template.name}</h2>
                <p className="text-gray-600">{template.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Subject</p>
                <p className="text-gray-900">{template.subject.subject_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Topic</p>
                <p className="text-gray-900">{template.topic.topic_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Subtopic</p>
                <p className="text-gray-900">{template.subtopic.subtopic_name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Question Format</p>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm">{template.question_format}</pre>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Options Format</p>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm">{template.options_format}</pre>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Solution Format</p>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm">{template.solution_format}</pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'New Template'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
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
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={formData.subject_id ?? ''}
                    onChange={(e) => {
                      const subjectId = parseInt(e.target.value);
                      setSelectedSubject(subjectId);
                      setFormData({
                        ...formData,
                        subject_id: subjectId,
                        topic_id: null,
                        subtopic_id: null,
                        level_id: null,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects?.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic
                  </label>
                  <select
                    value={formData.topic_id ?? ''}
                    onChange={(e) => {
                      const topicId = parseInt(e.target.value);
                      setSelectedTopic(topicId);
                      setFormData({
                        ...formData,
                        topic_id: topicId,
                        subtopic_id: null,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    required
                    disabled={!selectedSubject}
                  >
                    <option value="">Select a topic</option>
                    {topics?.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.topic_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtopic
                  </label>
                  <select
                    value={formData.subtopic_id ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subtopic_id: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    required
                    disabled={!selectedTopic}
                  >
                    <option value="">Select a subtopic</option>
                    {subtopics?.map((subtopic) => (
                      <option key={subtopic.id} value={subtopic.id}>
                        {subtopic.subtopic_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedSubject && difficultyLevels && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.level_id ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level_id: parseInt(e.target.value),
                        difficulty_level: difficultyLevels.find(
                          (l) => l.level_id === parseInt(e.target.value)
                        )?.level_value || null,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    required
                  >
                    <option value="">Select difficulty level</option>
                    {difficultyLevels.map((level) => (
                      <option key={level.level_id} value={level.level_id}>
                        {level.level_name} (Value: {level.level_value})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Format
                </label>
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">
                    Click a variable to insert it at cursor position:
                  </div>
                  {renderVariableButtonsForField('question_format')}
                </div>
                <textarea
                  name="question_format"
                  value={formData.question_format}
                  onChange={(e) => setFormData({ ...formData, question_format: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg h-32"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options Format
                </label>
                <div className="space-y-2">
                  {formData.options_format.map((option, index) => (
                    <input
                      key={index}
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...formData.options_format];
                        newOptions[index] = e.target.value;
                        setFormData({ ...formData, options_format: newOptions });
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Solution Format
                </label>
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">
                    Click a variable to insert it at cursor position:
                  </div>
                  {renderVariableButtonsForField('solution_format')}
                </div>
                <textarea
                  name="solution_format"
                  value={formData.solution_format}
                  onChange={(e) => setFormData({ ...formData, solution_format: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg h-32"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Example Question (Optional)
                </label>
                <textarea
                  value={formData.example_question}
                  onChange={(e) => setFormData({ ...formData, example_question: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg h-32"
                />
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
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;