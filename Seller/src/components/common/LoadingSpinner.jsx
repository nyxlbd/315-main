import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClass = `spinner-${size}`;

  return (
    <div className="spinner-container">
      <div className={`spinner ${sizeClass} spinner-green`}></div>
    </div>
  );
};

export default LoadingSpinner;