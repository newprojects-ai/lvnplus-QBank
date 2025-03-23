import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, X, Edit2, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import katex from 'katex';

interface Question {
  id: string;
  batch_id: string;
  question_text: string;
  question_text_plain: string;
  options: string;
  options_plain: string;
  correct_answer: string;
  correct_answer_plain: string;
  solution: string;
  solution_plain: string;
  status: string;
  difficulty_level: number;
}

interface Batch {
  id: string;
  template: {
    name: string;
  };
  created_at: string;
  status: string;
}

export function ReviewerPage() {
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Question> | null>(null);

  const { data: batches } = useQuery<Batch[]>({
    queryKey: ['batches'],
    queryFn: async () => {
      const response = await fetch('/api/batches');
      if (!response.ok) throw new Error('Failed to fetch batches');
      return response.json();
    },
  });

  const { data: questions, refetch: refetchQuestions } = useQuery<Question[]>({
    queryKey: ['batch-questions', selectedBatch],
    enabled: !!selectedBatch,
    queryFn: async () => {
      const response = await fetch(`/api/batches/${selectedBatch}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
  });

  const currentQuestion = questions?.[currentIndex];

  useEffect(() => {
    // Reset index when changing batches
    setCurrentIndex(0);
    setIsEditing(false);
    setEditForm(null);
  }, [selectedBatch]);

  const renderKaTeX = (text: string) => {
    try {
      return katex.renderToString(text, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return text;
    }
  };

  const handleApprove = async () => {
    if (!currentQuestion) return;

    try {
      const response = await fetch(`/api/questions/${currentQuestion.id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to approve question');

      await refetchQuestions();
      toast.success('Question approved successfully');

      // Move to next question if available
      if (currentIndex < (questions?.length || 0) - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      toast.error('Failed to approve question');
    }
  };

  const handleReject = async () => {
    if (!currentQuestion) return;

    try {
      const response = await fetch(`/api/questions/${currentQuestion.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to reject question');

      await refetchQuestions();
      toast.success('Question rejected');

      // Move to next question if available or reset index
      if (currentIndex >= (questions?.length || 0) - 1) {
        setCurrentIndex(Math.max(0, (questions?.length || 1) - 2));
      }
    } catch (error) {
      toast.error('Failed to reject question');
    }
  };

  const handleSaveEdit = async () => {
    if (!currentQuestion || !editForm) return;

    try {
      const response = await fetch(`/api/questions/${currentQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Failed to update question');

      await refetchQuestions();
      setIsEditing(false);
      setEditForm(null);
      toast.success('Question updated successfully');
    } catch (error) {
      toast.error('Failed to update question');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Question Reviewer</h1>
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="">Select a batch</option>
          {batches?.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.template.name} ({new Date(batch.created_at).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {selectedBatch && questions?.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No questions found in this batch.</p>
        </div>
      )}

      {selectedBatch && currentQuestion && (
        <div className="grid gap-6">
          {/* Navigation */}
          <div className="bg-white rounded-lg shadow px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="p-2 text-gray-600 hover:text-indigo-600 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <button
                onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                disabled={currentIndex === questions.length - 1}
                className="p-2 text-gray-600 hover:text-indigo-600 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                currentQuestion.status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {currentQuestion.status}
              </span>
            </div>
          </div>

          {/* Question Content */}
          <div className="bg-white rounded-lg shadow p-6">
            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text (with KaTeX)
                  </label>
                  <textarea
                    value={editForm?.question_text || ''}
                    onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg h-32"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text (Plain)
                  </label>
                  <textarea
                    value={editForm?.question_text_plain || ''}
                    onChange={(e) => setEditForm({ ...editForm, question_text_plain: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg h-32"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm(null);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Question</h3>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderKaTeX(currentQuestion.question_text),
                    }}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Options</h3>
                  <div className="grid gap-4">
                    {JSON.parse(currentQuestion.options).map((option: string, index: number) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          option === currentQuestion.correct_answer
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: renderKaTeX(option),
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Solution</h3>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderKaTeX(currentQuestion.solution),
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => {
                setIsEditing(true);
                setEditForm(currentQuestion);
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReject}
                className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={currentQuestion.status === 'approved'}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}