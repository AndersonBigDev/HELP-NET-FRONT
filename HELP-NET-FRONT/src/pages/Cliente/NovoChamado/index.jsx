import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import './style.css';

export default function NovoChamado() {
  const { register, handleSubmit, reset } = useForm();
  const [chamadosAbertos, setChamadosAbertos] = useState(0);

  useEffect(() => {
    // Simulação de chamada à API para checar chamados abertos
    setChamadosAbertos(2); // Altere para 3 para testar o bloqueio da RN04
  }, []);

  const onSubmit = (data) => {
    if (chamadosAbertos >= 3) {
      return toast.error('Limite excedido: Você possui 3 chamados em andamento (RN04).');
    }

    const file = data.anexo[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      const allowed = ['pdf', 'svg', 'png', 'jpg'];
      if (!allowed.includes(ext)) {
        return toast.error('Formato de anexo inválido. Use .PDF, .SVG, .PNG ou .JPG (RNF04).');
      }
    }

    toast.success('Chamado registrado com sucesso!');
    reset();
  };

  return (
    <div className="page-container">
      <h2>Abertura de Chamado</h2>
      
      {chamadosAbertos >= 3 ? (
        <div className="alert-box error">
          Você atingiu o limite de 3 chamados abertos simultaneamente (RN04). Aguarde a resolução para abrir um novo.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="form-card">
          <div className="form-row">
            <div className="form-group">
              <label>Categoria do Incidente (RF05)</label>
              <select {...register("categoria")} required>
                <option value="">Selecione...</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Urgência (RF05)</label>
              <select {...register("urgencia")} required>
                <option value="">Selecione...</option>
                <option value="Normal">Normal</option>
                <option value="Medio">Médio</option>
                <option value="Critico">Crítico</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descrição do Problema</label>
            <textarea {...register("descricao")} rows="4" required></textarea>
          </div>

          <div className="form-group">
            <label>Anexos Permitidos (.pdf, .svg, .png, .jpg) - RNF04</label>
            <input type="file" {...register("anexo")} accept=".pdf, .svg, .png, .jpg" />
          </div>

          <button type="submit" className="btn-primary">Registrar Chamado</button>
        </form>
      )}
    </div>
  );
}