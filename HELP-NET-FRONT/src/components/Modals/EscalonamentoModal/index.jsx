import React from 'react';
import { useForm } from 'react-hook-form';
import './style.css';

export default function EscalonamentoModal({ isOpen, onClose, onConfirm }) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Relatório de Escalonamento (RN07)</h3>
        <form onSubmit={handleSubmit(onConfirm)}>
          <textarea 
            {...register("justificativa", { required: "A justificativa é obrigatória para subir de nível." })}
            rows="5" placeholder="Descreva por que o chamado precisa ser escalonado..."
          ></textarea>
          {errors.justificativa && <span className="error">{errors.justificativa.message}</span>}
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
            <button type="submit" className="btn-confirm">Escalonar Chamado</button>
          </div>
        </form>
      </div>
    </div>
  );
}