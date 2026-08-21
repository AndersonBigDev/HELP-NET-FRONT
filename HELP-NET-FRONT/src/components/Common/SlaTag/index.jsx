import React from 'react';
import './style.css';

export default function SlaTag({ isDelayed }) {
  return (
    <span className={`sla-tag ${isDelayed ? 'delayed' : 'on-time'}`}>
      {isDelayed ? 'SLA Estourado' : 'No Prazo'}
    </span>
  );
}