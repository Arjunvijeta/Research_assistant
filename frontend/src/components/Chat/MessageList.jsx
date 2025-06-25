import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import LoadingSpinner from '../UI/LoadingSpinner';

const MessageList = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessage = (message) => {
    return (
      <div className="space-y-2">
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {message.actions && message.actions.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg border text-sm">
            <h4 className="font-semibold text-gray-700 mb-2">Actions Taken:</h4>
            {message.actions.map((action, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <span className="font-medium text-research-blue-600">
                  {action.action}:
                </span>
                <div className="ml-2 text-gray-600 font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                  {JSON.stringify(action.result, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {message.needsReview && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded-lg text-sm">
            ⚠️ This response has been flagged for human review due to safety or regulatory implications.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
            message.type === 'user' 
              ? 'bg-research-blue-600 text-white rounded-2xl rounded-br-md' 
              : `bg-white border rounded-2xl rounded-bl-md shadow-sm ${message.isError ? 'border-red-200' : 'border-gray-200'}`
          } px-4 py-3`}>
            {formatMessage(message)}
            
            <div className={`flex items-center justify-between mt-2 text-xs ${
              message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <span>{format(message.timestamp, 'HH:mm')}</span>
              {message.confidence && (
                <span className="ml-2 font-medium">
                  Confidence: {(message.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-gray-500 text-sm">Thinking...</span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;