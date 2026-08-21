import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { FiUser, FiTag, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import './style.css';

// Mock dos dados do chamado (Simulando um retorno da API)
const chamadoAtual = {
  protocolo: 'CH-2049',
  solicitante: 'Maria Oliveira (RH)',
  responsavel: 'Carlos Atendente',
  tipo: 'Incidente',
  prioridade: 'Alta',
  status: 'Em Andamento',
  nivelId: 2, // 1: N1, 2: N2, 3: N3
  nivelDescricao: 'N2 - Field Service',
};

// RN07: Schema de validação com Yup
const validationSchema = yup.object({
  nivel: yup.number().required('O nível é obrigatório'),
  justificativa: yup.string().when('nivel', ([nivel], schema) => {
    // Se o nível selecionado for MAIOR que o atual (Escalonamento/Up-tier)
    return nivel > chamadoAtual.nivelId
      ? schema.required('A justificativa é obrigatória ao escalar o chamado para um nível superior.')
      : schema.optional();
  }),
});

const DetalheChamado = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      nivel: chamadoAtual.nivelId,
      justificativa: '',
    }
  });

  // Observa o valor do select em tempo real para mostrar/esconder o campo de justificativa
  const nivelSelecionado = watch('nivel');
  const isEscalonamento = nivelSelecionado > chamadoAtual.nivelId;

  const onSubmit = (data) => {
    // Aqui entraria a chamada Axios (PUT/PATCH) para atualizar o chamado
    console.log('Dados enviados:', data);
    toast.success(`Chamado ${chamadoAtual.protocolo} atualizado com sucesso!`);
  };

  return (
    <div className="detalhe-container">
      <header className="detalhe-header">
        <h2>Protocolo: {chamadoAtual.protocolo}</h2>
        <span className="badge status-andamento">{chamadoAtual.status}</span>
      </header>

      {/* RN05: Exibição clara dos dados */}
      <section className="info-grid">
        <div className="info-card">
          <FiUser className="info-icon" />
          <div>
            <small>Solicitante</small>
            <p>{chamadoAtual.solicitante}</p>
          </div>
        </div>
        <div className="info-card">
          <FiTag className="info-icon" />
          <div>
            <small>Tipo / Prioridade</small>
            <p>{chamadoAtual.tipo} - <strong className="text-danger">{chamadoAtual.prioridade}</strong></p>
          </div>
        </div>
        <div className="info-card">
          <FiAlertTriangle className="info-icon" />
          <div>
            <small>Nível Atual</small>
            <p>{chamadoAtual.nivelDescricao}</p>
          </div>
        </div>
        <div className="info-card">
          <FiCheckCircle className="info-icon" />
          <div>
            <small>Responsável</small>
            <p>{chamadoAtual.responsavel}</p>
          </div>
        </div>
      </section>

      <section className="action-section">
        <h3>Atualizar Chamado</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="action-form">
          <div className="form-group">
            <label>Alterar Nível de Atendimento</label>
            <select {...register('nivel')} className={errors.nivel ? 'input-error' : ''}>
              {/* RN06: Trava de Downgrade (disabled se a option for menor que o nível atual) */}
              <option value={1} disabled={chamadoAtual.nivelId > 1}>Nível 1 - Help Desk (Bloqueado)</option>
              <option value={2} disabled={chamadoAtual.nivelId > 2}>Nível 2 - Field Service</option>
              <option value={3} disabled={chamadoAtual.nivelId > 3}>Nível 3 - Especialista</option>
            </select>
            {errors.nivel && <span className="error-message">{errors.nivel.message}</span>}
          </div>

          {/* RN07: Exibição condicional da justificativa */}
          {isEscalonamento && (
            <div className="form-group slide-in">
              <label>Justificativa de Escalonamento <span className="required">*</span></label>
              <textarea 
                {...register('justificativa')} 
                rows="4" 
                placeholder="Descreva o motivo técnico para acionar o próximo nível..."
                className={errors.justificativa ? 'input-error' : ''}
              />
              {errors.justificativa && <span className="error-message">{errors.justificativa.message}</span>}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-salvar">Salvar Alterações</button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default DetalheChamado;