export const formatTimestamp = (timestamp) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export const generateMessageId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9);
};

export const isValidApiResponse = (response) => {
  return (
    response &&
    typeof response.response === "string" &&
    Array.isArray(response.actions_taken) &&
    typeof response.confidence_score === "number"
  );
};
