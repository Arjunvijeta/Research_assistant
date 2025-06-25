import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Button from '../UI/Button';

const MessageInput = ({ onSendMessage, isLoading, placeholder }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder || "Ask about equipment booking, order status, protocols, or any research-related questions..."}
            disabled={isLoading}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-research-blue-500 focus:border-research-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="flex items-center gap-2"
          >
            <Send size={16} />
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;