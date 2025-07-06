
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, actions }) => {
  return (
    <div className={`bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {title && (
        <div className="p-4 sm:p-6 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;