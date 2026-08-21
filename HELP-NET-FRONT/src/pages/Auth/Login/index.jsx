import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import './style.css';

const schema = yup.object({
  email: yup.string()
    .email('Digite um formato de e-mail válido')
    .matches(/@helpdesk\.com$/, 'Acesso negado: Utilize seu e-mail corporativo @helpdesk.com (RN02)')
    .required('O e-mail é obrigatório'),
}).required();

export default function Login() {
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = (data) => {
    // Simulação: Se for o primeiro acesso, exibimos o campo de cargo
    if (!isFirstAccess && data.email === 'novo@helpdesk.com') {
      setIsFirstAccess(true);
      toast.info('Primeiro acesso detectado. Por favor, preencha seu cargo (RN03).');
      return;
    }

    if (isFirstAccess && !data.cargo) {
      toast.error('O preenchimento do cargo é obrigatório no primeiro acesso.');
      return;
    }

    toast.success('Autenticação realizada com sucesso!');
    // O Dev 2 gerenciará o redirecionamento global pós-login
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Help Desk - Login</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>E-mail corporativo</label>
            <input {...register("email")} placeholder="usuario@helpdesk.com" />
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          {isFirstAccess && (
            <div className="form-group">
              <label>Cargo (Primeiro Acesso)</label>
              <input {...register("cargo")} placeholder="Ex: Analista de Marketing" />
            </div>
          )}

          <button type="submit" className="btn-primary">Entrar no Sistema</button>
        </form>
      </div>
    </div>
  );
}