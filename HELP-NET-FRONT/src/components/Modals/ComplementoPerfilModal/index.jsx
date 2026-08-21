import React from 'react';
import { useForm } from 'react-hook-form';
import './style.css';

export default function ComplementoPerfilModal({ isOpen, onSubmit }) {
  const { register, handleSubmit } = useForm();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Completar Cadastro (RN03)</h3>
        <p>Este é seu primeiro acesso. Por favor, informe seu cargo.</p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input {...register("cargo", { required: true })} placeholder="Seu Cargo (Ex: Analista)" />
          <button type="submit" className="btn-modal">Salvar e Entrar</button>
        </form>
      </div>
    </div>
  );
}