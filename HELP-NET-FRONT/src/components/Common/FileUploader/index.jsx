import React from 'react';
import './style.css';

export default function FileUploader({ register, name }) {
  return (
    <div className="file-uploader">
      <label>Anexos Permitidos (.pdf, .svg, .png, .jpg) - RNF04</label>
      <input 
        type="file" 
        {...register(name)} 
        accept=".pdf, .svg, .png, .jpg" 
      />
    </div>
  );
}