import React from 'react';
import { AlertCircle } from 'lucide-react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="error-container">
      <div className="error-content">
        <AlertCircle className="error-icon" />
        <div className="error-details">
          <h3 className="error-title">Error</h3>
          <p className="error-message">{message}</p>
          {onRetry && (
            <button onClick={onRetry} className="error-retry">
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;