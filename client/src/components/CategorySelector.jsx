import React from 'react';
import './CategorySelector.css';

const categories = [
  { key: '', label: 'All', icon: '🌐' },
  { key: 'delicacies', label: 'Delicacies', icon: '🍯' },
  { key: 'souvenirs', label: 'Souvenirs', icon: '🛍️' },
  { key: 'clothes', label: 'Clothes', icon: '👕' },
  { key: 'art and culture', label: 'Art and Culture', icon: '🎨' },
  { key: 'health', label: 'Health', icon: '➕' },
  { key: 'beverages', label: 'Beverages', icon: '🥤' },
];

function CategorySelector({ selected, onSelect }) {
  return (
    <div className="category-selector">
      <h2>Browse By Category</h2>
      <div className="category-list">
        {categories.map((cat) => (
          <div
            key={cat.key}
            className={`category-item${selected === cat.key ? ' selected' : ''}`}
            onClick={() => onSelect(cat.key)}
          >
            <div className="category-icon">{cat.icon}</div>
            <div>{cat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategorySelector;
