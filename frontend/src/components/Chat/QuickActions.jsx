import React from 'react';
import { Calendar, Package, Shield, HelpCircle } from 'lucide-react';
import Button from '../UI/Button';

const QuickActions = ({ onQuickAction, isLoading }) => {
  const quickActions = [
    {
      icon: Calendar,
      label: 'Available Equipment',
      message: 'Show me available equipment for booking'
    },
    {
      icon: Package,
      label: 'Order Status',
      message: 'Check the status of my recent orders'
    },
    {
      icon: Shield,
      label: 'Safety Protocols',
      message: 'What are the safety protocols for sample preparation?'
    },
    {
      icon: HelpCircle,
      label: 'Help',
      message: 'What can you help me with?'
    }
  ];

  return (
    <div className="bg-gray-50 border-t border-gray-200 p-4">
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onQuickAction(action.message)}
              disabled={isLoading}
              className="flex items-center gap-2 text-xs"
            >
              <IconComponent size={14} />
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;