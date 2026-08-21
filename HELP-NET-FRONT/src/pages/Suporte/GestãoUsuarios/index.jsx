import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { FiUserPlus, FiUsers, FiEdit2, FiTrash2 } from 'react-icons/fi';
import './style.css';

// Esquema de validação do formulário
const schema = yup.object({
  nome: yup.string().required('O nome é obrigatório'),
  email: yup.string().email('E-mail inválido').required('O e-mail é obrigatório'),
  setor: yup.string().required('Selecione um setor'),
  cargo: yup.string().required('Selecione um cargo'),
});

const GestaoUsuarios = () => {
  // Lista inicial mockada de usuários
  const [usuarios, setUsuarios] = useState([
    { id: 1, nome: 'Carlos Atendente', email: 'carlos@empresa.com', setor: 'TI', cargo: 'N2 - Field Service' },
    { id: 2, nome: 'Maria Oliveira', email: 'maria@empresa.com', setor: 'RH', cargo: 'Usuário Comum' },
  ]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = (data) => {
    // Simulando a criação de um novo usuário via API
    const novoUsuario = {
      id: Date.now(),
      ...data
    };
    
    setUsuarios([...usuarios, novoUsuario]);
    toast.success('Usuário cadastrado com sucesso!');
    reset(); // Limpa o formulário
  };

  return (
    <div className="gestao-container">
      <header className="gestao-header">
        <h2>Gestão de Usuários</h2>
        <p>Cadastre e administre acessos, setores e cargos.</p>
      </header>

      <div className="gestao-content">
        {/* Formulário de Criação/Edição */}
        <aside className="gestao-form-panel">
          <div className="panel-header">
            <FiUserPlus /> <h3>Novo Usuário</h3>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="form-usuarios">
            <div className="form-group">
              <label>Nome Completo</label>
              <input 
                type="text" 
                placeholder="Ex: João da Silva" 
                {...register('nome')} 
                className={errors.nome ? 'input-error' : ''}
              />
              {errors.nome && <span className="error-text">{errors.nome.message}</span>}
            </div>

            <div className="form-group">
              <label>E-mail Corporativo</label>
              <input 
                type="email" 
                placeholder="joao@empresa.com" 
                {...register('email')} 
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label>Setor</label>
              <select {...register('setor')} className={errors.setor ? 'input-error' : ''}>
                <option value="">Selecione o setor...</option>
                <option value="TI">TI (Tecnologia)</option>
                <option value="RH">Recursos Humanos</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Diretoria">Diretoria</option>
              </select>
              {errors.setor && <span className="error-text">{errors.setor.message}</span>}
            </div>

            <div className="form-group">
              <label>Cargo / Nível de Acesso</label>
              <select {...register('cargo')} className={errors.cargo ? 'input-error' : ''}>
                <option value="">Selecione o cargo...</option>
                <option value="Usuário Comum">Usuário Comum (Abre chamados)</option>
                <option value="N1 - Help Desk">Suporte: N1 - Help Desk</option>
                <option value="N2 - Field Service">Suporte: N2 - Field Service</option>
                <option value="N3 - Especialista">Suporte: N3 - Especialista</option>
                <option value="Admin">Administrador Geral</option>
              </select>
              {errors.cargo && <span className="error-text">{errors.cargo.message}</span>}
            </div>

            <button type="submit" className="btn-salvar">Cadastrar Usuário</button>
          </form>
        </aside>

        {/* Lista de Usuários Ativos */}
        <main className="usuarios-list-panel">
          <div className="panel-header">
            <FiUsers /> <h3>Usuários Cadastrados</h3>
          </div>
          
          <div className="table-responsive">
            <table className="table-usuarios">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Setor</th>
                  <th>Cargo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(user => (
                  <tr key={user.id}>
                    <td><strong>{user.nome}</strong></td>
                    <td>{user.email}</td>
                    <td><span className="badge-setor">{user.setor}</span></td>
                    <td>{user.cargo}</td>
                    <td className="actions-cell">
                      <button className="btn-icon edit" title="Editar"><FiEdit2 /></button>
                      <button className="btn-icon delete" title="Excluir"><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-state">Nenhum usuário cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GestaoUsuarios;