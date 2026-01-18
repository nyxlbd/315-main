import React from 'react';
import { AlertCircle } from 'lucide-react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="error-message-container">
      <div className="error-message">
        <AlertCircle className="error-icon" />
        <div>
          <h3 className="error-title">Error</h3>
          <p className="error-text">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="error-retry-btn">
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
