import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import './style.css';

// Esquema de validação dos campos
const loginSchema = yup.object({
  email: yup.string()
    .email('Formato de e-mail inválido')
    .required('O e-mail é obrigatório'),
  senha: yup.string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .required('A senha é obrigatória'),
});

const Login = () => {
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema)
  });

  const onSubmit = (data) => {
    console.log('Enviando dados para autenticação:', data);
    
    // TODO: No futuro, aqui entrará a chamada da API (ex: axios.post('/api/login', data))
    // Por enquanto, se passar na validação, vamos forçar a entrada no Dashboard:
    navigate('/suporte/dashboard');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>Help Net</h2>
          <p>Insira suas credenciais para acessar</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label>E-mail / Usuário</label>
            <input 
              type="text" 
              placeholder="exemplo@empresa.com.br"
              {...register('email')}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input 
              type="password" 
              placeholder="••••••••"
              {...register('senha')}
              className={errors.senha ? 'input-error' : ''}
            />
            {errors.senha && <span className="error-text">{errors.senha.message}</span>}
          </div>

          <button type="submit" className="btn-login">Entrar</button>
        </form>
      </div>
    </div>
  );
};

export default Login;