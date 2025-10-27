'use client';

import { AlertCircle, Clock } from 'lucide-react';

interface Response {
  id: string;
  llmConfigId: string;
  llmName: string;
  content: string;
  responseTime: string;
  error?: string;
}

interface ResponseGridProps {
  responses: Response[];
}

export default function ResponseGrid({ responses }: ResponseGridProps) {
  if (responses.length === 0) {
    return null;
  }

  const gridCols = responses.length === 1 ? 'grid-cols-1' :
                   responses.length === 2 ? 'grid-cols-2' :
                   responses.length <= 4 ? 'grid-cols-2' :
                   'grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {responses.map((response) => (
        <div
          key={response.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {response.llmName}
            </h3>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              {response.responseTime}
            </div>
          </div>
          {response.error ? (
            <div className="flex-1 flex items-center justify-center text-red-500 dark:text-red-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">{response.error}</span>
            </div>
          ) : (
            <div className="flex-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">
              {response.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
