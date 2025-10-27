'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Settings, Plus, Send, Loader2 } from 'lucide-react';
import ConversationSidebar from './ConversationSidebar';
import LLMSelector from './LLMSelector';
import ResponseGrid from './ResponseGrid';
import LLMConfigModal from './LLMConfigModal';

interface LLMConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  isActive: boolean;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  responses?: Array<{
    id: string;
    llmConfigId: string;
    llmName: string;
    content: string;
    responseTime: string;
    error?: string;
  }>;
  createdAt: Date;
}

interface PlaygroundClientProps {
  llmConfigs: LLMConfig[];
  conversations: Conversation[];
  userId: string;
}

export default function PlaygroundClient({
  llmConfigs: initialConfigs,
  conversations: initialConversations,
  userId,
}: PlaygroundClientProps) {
  const [llmConfigs, setLlmConfigs] = useState(initialConfigs);
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedLLMs, setSelectedLLMs] = useState<string[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // Fetch messages for this conversation
    const response = await fetch(`/api/conversations/${conversationId}/messages`);
    if (response.ok) {
      const data = await response.json();
      setMessages(data.messages);
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setPrompt('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || selectedLLMs.length === 0 || loading) return;

    if (selectedLLMs.length > 10) {
      alert('You can select a maximum of 10 LLMs');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          llmConfigIds: selectedLLMs,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Update or set conversation ID
      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId);
        // Refresh conversations list
        const conversationsRes = await fetch('/api/conversations');
        if (conversationsRes.ok) {
          const conversationsData = await conversationsRes.json();
          setConversations(conversationsData.conversations);
        }
      }

      // Add user message and responses
      setMessages((prev) => [...prev, data.userMessage, data.assistantMessage]);
      setPrompt('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigAdded = (config: LLMConfig) => {
    setLlmConfigs((prev) => [...prev, config]);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      {showSidebar && (
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                LLM Playground
              </h1>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add LLM</span>
            </button>
          </div>
        </header>

        {/* LLM Selector */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <LLMSelector
            llmConfigs={llmConfigs}
            selectedLLMs={selectedLLMs}
            onSelectLLMs={setSelectedLLMs}
            maxSelection={10}
          />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Start a conversation</p>
                <p className="text-sm">Select LLMs and send a message to begin</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className="space-y-4">
                  {message.role === 'user' ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  ) : (
                    <ResponseGrid responses={message.responses || []} />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt..."
              disabled={loading || selectedLLMs.length === 0}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim() || selectedLLMs.length === 0}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          {selectedLLMs.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Please select at least one LLM to start
            </p>
          )}
        </div>
      </div>

      {/* LLM Config Modal */}
      {showConfigModal && (
        <LLMConfigModal
          onClose={() => setShowConfigModal(false)}
          onConfigAdded={handleConfigAdded}
          userId={userId}
        />
      )}
    </div>
  );
}
