import React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  subject_id: number;
  topic_id: number;
  subtopic_id: number;
  difficulty_level: number;
  level_id: number;
  question_format: string;
  options_format: string;
  solution_format: string;
  example_question?: string;
  created_at: string;
  created_by: string;
  subject: {
    subject_id: number;
    subject_name: string;
  };
  topic: {
    topic_id: number;
    topic_name: string;
  };
  subtopic: {
    subtopic_id: number;
    subtopic_name: string;
  };
  difficulty_level: {
    level_id: number;
    level_name: string;
    level_value: number;
    purpose: string;
    characteristics: string;
    focus_area: string;
  };
}

interface TemplateFormData {
  name: string;
  description: string;
  subject_id: number;
  topic_id: number;
  subtopic_id: number;
  difficulty_level: number;
  level_id: number;
  question_format: string;
  options_format: string[];
  solution_format: string;
  example_question?: string;
}

interface Subject {
  subject_id: number;
  subject_name: string;
}

interface Topic {
  topic_id: number;
  topic_name: string;
}

interface Subtopic {
  subtopic_id: number;
  subtopic_name: string;
}

interface DifficultyLevel {
  level_id: number;
  level_name: string;
  level_value: number;
  purpose: string;
  characteristics: string;
  focus_area: string;
}

export function TemplatesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    subject_id: 0,
    topic_id: 0,
    subtopic_id: 0,
    difficulty_level: 2,
    level_id: 0,
    question_format: '',
    options_format: ['', '', '', ''],
    solution_format: '',
    example_question: '',
  });

  const { data: templates, refetch: refetchTemplates, isLoading: isLoadingTemplates, error: templatesError } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  const { data: subjects, isLoading: isLoadingSubjects, error: subjectsError } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      console.log('Fetching subjects...');
      const response = await fetch('/api/master-data/subjects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to fetch subjects:', error);
        throw new Error(`Failed to fetch subjects: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Subjects fetched successfully:', data);
      return data;
    },
  });

  const { data: topics } = useQuery<Topic[]>({
    queryKey: ['topics', selectedSubject],
    enabled: !!selectedSubject,
    queryFn: async () => {
      const response = await fetch(`/api/master-data/topics/${selectedSubject}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch topics');
      return response.json();
    },
  });

  const { data: subtopics } = useQuery<Subtopic[]>({
    queryKey: ['subtopics', selectedTopic],
    enabled: !!selectedTopic,
    queryFn: async () => {
      const response = await fetch(`/api/master-data/subtopics/${selectedTopic}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch subtopics');
      return response.json();
    },
  });

  const { data: difficultyLevels } = useQuery<DifficultyLevel[]>({
    queryKey: ['difficulty-levels', selectedSubject],
    enabled: !!selectedSubject,
    queryFn: async () => {
      const response = await fetch(`/api/master-data/difficulty-levels/${selectedSubject}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch difficulty levels');
      return response.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/templates', {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          id: editingTemplate?.id,
          options_format: JSON.stringify(formData.options_format),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      setIsModalOpen(false);
      setEditingTemplate(null);
      refetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      subject_name: template.subject_name,
      topic_name: template.topic_name,
      subtopic_name: template.subtopic_name,
      difficulty_level: template.difficulty_level,
      question_format: template.question_format,
      options_format: JSON.parse(template.options_format),
      solution_format: template.solution_format,
      example_question: template.example_question,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      refetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  return (
    <div className="p-8">
      {/* Debug information */}
      {subjectsError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">Error loading subjects: {subjectsError.message}</p>
        </div>
      )}
      {isLoadingSubjects && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700">Loading subjects...</p>
        </div>
      )}
      {subjects && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">Subjects loaded: {subjects.length}</p>
          <pre className="mt-2 text-sm">{JSON.stringify(subjects, null, 2)}</pre>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setFormData({
              name: '',
              description: '',
              subject_name: '',
              topic_name: '',
              subtopic_name: '',
              difficulty_level: 2,
              question_format: '',
              options_format: ['', '', '', ''],
              solution_format: '',
              example_question: '',
            });
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
                    value={formData.subject_id || ''}
                    onChange={(e) => {
                      const subjectId = parseInt(e.target.value);
                      setSelectedSubject(subjectId);
                      setFormData({
                        ...formData,
                        subject_id: subjectId,
                        topic_id: 0,
                        subtopic_id: 0,
                        level_id: 0,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects?.map((subject) => (
                      <option key={subject.subject_id} value={subject.subject_id}>
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
                    value={formData.topic_id || ''}
                    onChange={(e) => {
                      const topicId = parseInt(e.target.value);
                      setSelectedTopic(topicId);
                      setFormData({
                        ...formData,
                        topic_id: topicId,
                        subtopic_id: 0,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    required
                    disabled={!selectedSubject}
                  >
                    <option value="">Select a topic</option>
                    {topics?.map((topic) => (
                      <option key={topic.topic_id} value={topic.topic_id}>
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
                    value={formData.subtopic_id || ''}
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
                      <option key={subtopic.subtopic_id} value={subtopic.subtopic_id}>
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
                    value={formData.level_id || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level_id: parseInt(e.target.value),
                        difficulty_level: difficultyLevels.find(
                          (l) => l.level_id === parseInt(e.target.value)
                        )?.level_value || 2,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    required
                  >
                    <option value="">Select difficulty level</option>
                    {difficultyLevels.map((level) => (
                      <option key={level.level_id} value={level.level_id}>
                        {level.level_name} (Level {level.level_value})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Format
                </label>
                <textarea
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
                <textarea
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
}