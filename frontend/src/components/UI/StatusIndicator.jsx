import React from 'react';
import { useApiHealth } from '../../hooks/useApi';

const StatusIndicator = () => {
  const { isHealthy, isChecking } = useApiHealth();

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <span className="text-sm">Checking...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className={`text-sm ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
        {isHealthy ? 'Online' : 'Offline'}
      </span>
    </div>
  );
};

export default StatusIndicator;