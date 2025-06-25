import { useState, useCallback, useRef, useEffect } from "react";
import { chatApi } from "../services/api";

export const useChat = (customerId = "DEMO_USER") => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content:
        "Hello! I'm your scientific research assistant. I can help you with equipment booking, order status, protocol questions, and more. How can I assist you today?",
      timestamp: new Date(),
      confidence: null,
      actions: [],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messageIdRef = useRef(2);

  const addMessage = useCallback((message) => {
    setMessages((prev) => [
      ...prev,
      { ...message, id: messageIdRef.current++ },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (messageText) => {
      if (!messageText.trim() || isLoading) return;

      setError(null);

      // Add user message
      const userMessage = {
        type: "user",
        content: messageText,
        timestamp: new Date(),
      };
      addMessage(userMessage);
      setIsLoading(true);

      try {
        // Call API
        const response = await chatApi.sendMessage(messageText, customerId);

        // Add bot response
        const botMessage = {
          type: "bot",
          content: response.response,
          timestamp: new Date(),
          confidence: response.confidence_score,
          actions: response.actions_taken || [],
          needsReview: response.requires_human_review,
        };
        addMessage(botMessage);
      } catch (err) {
        console.error("Chat error:", err);
        setError(err.message);

        // Add error message
        const errorMessage = {
          type: "bot",
          content:
            "I apologize, but I encountered an error processing your request. Please try again or contact support.",
          timestamp: new Date(),
          isError: true,
        };
        addMessage(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [customerId, isLoading, addMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([messages[0]]); // Keep welcome message
    messageIdRef.current = 2;
  }, [messages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
};
