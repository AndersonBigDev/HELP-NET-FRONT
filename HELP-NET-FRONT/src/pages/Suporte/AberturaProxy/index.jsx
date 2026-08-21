import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { FiGlobe, FiShield, FiSend, FiClock } from 'react-icons/fi';
import './style.css';

// Schema de validação com foco em regras de rede/segurança
const proxySchema = yup.object({
  url: yup.string()
    .url('Formato inválido. Use http:// ou https://')
    .required('A URL ou IP de destino é obrigatória'),
  motivo: yup.string()
    .min(15, 'Justifique detalhadamente (mín. 15 caracteres)')
    .required('A justificativa de negócio é obrigatória para auditoria'),
  tipoAcesso: yup.string()
    .required('Defina a duração do acesso'),
});

const AberturaProxy = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(proxySchema),
    defaultValues: {
      tipoAcesso: 'temporario'
    }
  });

  const onSubmit = (data) => {
    console.log('Enviando solicitação de proxy...', data);
    toast.success('Solicitação de liberação de proxy enviada para a fila de Segurança (N2)!');
    reset();
  };

  return (
    <div className="proxy-container">
      <header className="proxy-header">
        <div className="header-title">
          <FiShield className="icon-shield" />
          <h2>Solicitação de Acesso (Proxy / Firewall)</h2>
        </div>
        <p>Preencha os dados abaixo para solicitar a liberação de sites ou IPs bloqueados pela rede corporativa.</p>
      </header>

      <section className="proxy-form-section">
        <form onSubmit={handleSubmit(onSubmit)} className="proxy-form">
          
          <div className="form-group">
            <label><FiGlobe /> URL ou Endereço IP Destino</label>
            <input 
              type="text" 
              placeholder="Ex: https://api.fornecedor.com.br" 
              {...register('url')} 
              className={errors.url ? 'input-error' : ''}
            />
            {errors.url && <span className="error-message">{errors.url.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label><FiClock /> Tipo de Liberação</label>
              <select {...register('tipoAcesso')} className={errors.tipoAcesso ? 'input-error' : ''}>
                <option value="temporario">Temporário (24 Horas)</option>
                <option value="permanente">Permanente (Requer aprovação da gerência)</option>
              </select>
              {errors.tipoAcesso && <span className="error-message">{errors.tipoAcesso.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Justificativa de Negócio <span className="required">*</span></label>
            <textarea 
              rows="4" 
              placeholder="Descreva o motivo pelo qual este acesso é necessário para suas atividades..."
              {...register('motivo')}
              className={errors.motivo ? 'input-error' : ''}
            />
            <small className="help-text">Auditoria: Esta justificativa será avaliada pela equipe de Segurança da Informação.</small>
            {errors.motivo && <span className="error-message">{errors.motivo.message}</span>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-enviar">
              <FiSend /> Enviar Solicitação
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default AberturaProxy;