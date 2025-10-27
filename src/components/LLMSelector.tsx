'use client';

interface LLMConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  isActive: boolean;
}

interface LLMSelectorProps {
  llmConfigs: LLMConfig[];
  selectedLLMs: string[];
  onSelectLLMs: (ids: string[]) => void;
  maxSelection: number;
}

export default function LLMSelector({
  llmConfigs,
  selectedLLMs,
  onSelectLLMs,
  maxSelection,
}: LLMSelectorProps) {
  const activeLLMs = llmConfigs.filter((config) => config.isActive);

  const handleToggle = (id: string) => {
    if (selectedLLMs.includes(id)) {
      onSelectLLMs(selectedLLMs.filter((llmId) => llmId !== id));
    } else {
      if (selectedLLMs.length >= maxSelection) {
        alert(`You can select a maximum of ${maxSelection} LLMs`);
        return;
      }
      onSelectLLMs([...selectedLLMs, id]);
    }
  };

  if (activeLLMs.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-2">
        No LLMs configured. Please add an LLM to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select LLMs to compare (max {maxSelection})
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selectedLLMs.length} / {maxSelection} selected
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeLLMs.map((config) => (
          <button
            key={config.id}
            onClick={() => handleToggle(config.id)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              selectedLLMs.includes(config.id)
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:border-indigo-500'
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{config.name}</span>
              <span className="text-xs opacity-75">{config.provider}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
