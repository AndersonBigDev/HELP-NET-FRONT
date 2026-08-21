import React from 'react';
import './style.css';

export default function PriorityBadge({ priority }) {
  const normalizedPriority = priority?.toLowerCase() || 'normal';
  return <span className={`priority-badge badge-${normalizedPriority}`}>{priority}</span>;
}