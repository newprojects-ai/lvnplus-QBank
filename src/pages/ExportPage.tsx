import React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  question_text: string;
  status: string;
  export_status?: string;
}

export function ExportPage() {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const { data: questions } = useQuery<Question[]>({
    queryKey: ['approved-questions'],
    queryFn: async () => {
      const response = await fetch('/api/questions?status=approved');
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
  });

  const handleExport = async () => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select questions to export');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: selectedQuestions }),
      });

      if (!response.ok) throw new Error('Export failed');

      toast.success('Export started successfully');
    } catch (error) {
      toast.error('Failed to start export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Export Questions</h1>
        <button
          onClick={handleExport}
          disabled={selectedQuestions.length === 0 || isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          {isExporting ? 'Exporting...' : 'Export Selected'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Approved Questions
            </h2>
            <span className="text-sm text-gray-500">
              {selectedQuestions.length} selected
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {questions?.map((question) => (
            <div key={question.id} className="px-6 py-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(question.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedQuestions([...selectedQuestions, question.id]);
                    } else {
                      setSelectedQuestions(
                        selectedQuestions.filter((id) => id !== question.id)
                      );
                    }
                  }}
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{question.question_text}</p>
                </div>
                <div className="flex items-center gap-2">
                  {question.export_status === 'exported' ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Exported
                    </span>
                  ) : question.export_status === 'failed' ? (
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      Failed
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}