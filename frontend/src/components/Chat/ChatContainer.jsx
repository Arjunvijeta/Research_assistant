import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import QuickActions from './QuickActions';
import StatusIndicator from '../UI/StatusIndicator';
import { useChat } from '../../hooks/useChat';

const ChatContainer = () => {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat();

  const handleQuickAction = (message) => {
    sendMessage(message);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-lg">
      {/* Header */}
      <div className="bg-research-blue-700 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Scientific Research Assistant</h1>
            <p className="text-research-blue-100 text-sm">
              Your AI-powered laboratory support system
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatusIndicator />
            <button
              onClick={clearMessages}
              className="text-research-blue-100 hover:text-white text-sm underline"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Connection Error:</strong> {error}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Make sure the backend API is running on the correct port.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <MessageInput 
        onSendMessage={sendMessage} 
        isLoading={isLoading}
      />

      {/* Quick Actions */}
      <QuickActions 
        onQuickAction={handleQuickAction} 
        isLoading={isLoading}
      />
    </div>
  );
};

export default ChatContainer;