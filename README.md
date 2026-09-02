# HELP-NET — Front

Interface web do HELP-NET, um sistema interno de atendimento de chamados. Um colaborador
abre um chamado descrevendo o problema; o sistema roteia para o setor responsável, define
prioridade e prazo, e a equipe de suporte atende, escalona quando precisa e encerra.

Este repositório tem **só a interface**. A API fica em `HELP-NET-BackEnd`, e é lá que
estão o contrato dos endpoints e as regras de negócio.

**React 19 · Vite 8 · Tailwind 4 · React Router 7 · axios · Recharts**

---

## Como rodar

Precisa de **Node 20+** e da API do backend no ar.

```bash
cd helpnet
npm install
cp .env.example .env
npm run dev
```

Sobe em `http://localhost:5173`.

### Configuração

Uma variável só, em `helpnet/.env`:

```
VITE_API_URL=http://localhost:8080
```

É a origem da API. Sem `.env`, o código cai nesse mesmo valor como padrão.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento com HMR |
| `npm run build` | build de produção em `dist/` |
| `npm run preview` | serve o build local, para conferir antes de publicar |
| `npm run lint` | oxlint |

---

## O que cada perfil vê

O perfil vem no JWT e decide as rotas que a pessoa alcança. Quem tenta uma rota fora do
seu perfil é redirecionado — a trava está em `RoleRoute`.

**USUARIO** — cai em *Meus Chamados*. Abre chamados (no máximo 3 ativos), acompanha o
andamento pela linha do tempo, conversa com o atendente, anexa arquivos e avalia depois
de resolvido. Consulta equipamentos do próprio setor, sem editar.

**ATENDENTE** e **ADMIN** — caem no *Dashboard*. Alcançam a fila, o tratamento do
chamado, a gestão de usuários e de equipamentos.

A hierarquia de nível do atendente é aplicada **no servidor**: a listagem já chega
recortada, então um chamado escalonado para nível III simplesmente não aparece para quem
é nível I. O front não filtra isso.

---

## As telas

**Login** — e-mail e senha. O seletor de tema já aparece aqui.

**Meus Chamados** — a visão do solicitante. Cada chamado abre num card com os dados, os
anexos, o histórico do atendimento em modo leitura, a conversa com o atendente e, quando
encerrado, a avaliação.

**Filas de Atendimento** — a lista de trabalho. Alterna entre *Fila Geral* e *Minha Fila*
(por afinidade de nível e setor), filtra por status, prioridade, nível, setor e
categoria, e exporta o recorte atual em CSV. Cada item mostra quem está atendendo, para
duas pessoas não pegarem o mesmo chamado.

**Tratamento do chamado** — a tela do atendente. Gira em torno de **Nova Interação**: uma
lista única com registrar, assumir, pausar, retomar, escalonar, resolver, fechar e
reabrir. Ao lado, o painel de quem está atendendo e em que pé está, os cards de
solicitante, equipamento, SLA e datas, o histórico em linha do tempo, a conversa e os
anexos.

**Dashboard** — seis indicadores e três gráficos. Tudo é clicável: número, barra de
gráfico e linha de tabela levam à fila já recortada naquele critério.

**Usuários** e **Equipamentos** — cadastro e edição, restritos a ATENDENTE e ADMIN.

**Alterar senha** — modal acessível pelo menu lateral, para qualquer perfil.

---

## Decisões do front que valem conhecer

**O filtro da fila mora na URL, não no `useState`.** É o que permite o dashboard abrir a
fila recortada com um link simples, deixa o recorte compartilhável e faz o botão voltar
do navegador desfazer o filtro em vez de sair da tela.

**Toda mudança no chamado sai de um lugar só.** Não existe botão que altere o chamado
fora da lista de interações. A ação e o registro no histórico são a mesma operação, então
não há caminho que mexa no chamado sem deixar trilha.

**A lista de opções espelha as travas do servidor.** Chamado sem responsável não oferece
pausar; chamado fechado só oferece reabrir; escalonar some no nível máximo. A opção não
aparece, em vez de o atendente tentar e tomar 400.

**`src/domain/` espelha o backend, não o substitui.** As regras ali existem para a tela
não oferecer o que voltaria erro. Quem valida de verdade é sempre o servidor.

**Cor só por token.** `src/index.css` define `canvas`, `surface`, `border`, `text`,
`accent` e as semânticas `success`/`warning`/`danger`/`info`. Nada de hex solto — o modo
claro/escuro e as cinco paletas de acento dependem disso.

**404 vira aviso, não erro.** Rotas que o servidor pode não expor ainda mostram um aviso
explicando a situação, em vez de um banner vermelho. É a rede de segurança para quem
estiver rodando um build antigo do backend.

---

## Estrutura

```
helpnet/src/
├── api/            uma função por endpoint, sobre o axios de client.js
├── auth/           AuthContext (sessão), ProtectedRoute, RoleRoute, leitura do JWT
├── components/
│   ├── layout/     AppLayout — menu lateral fixo presente em toda tela pós-login
│   └── ui/         Badge, Button, Card, DataField, Feedback, Field, Modal,
│                   SeletorTema, SlaTag
├── domain/         regras espelhadas do backend: enums, sla, avaliacao,
│                   interacoes, equipamentos
├── hooks/          useChamado, useChamados, useHistoricoChamado, useUsuarios,
│                   useEquipamentos
├── pages/
│   ├── Login/
│   ├── Chamados/       Meus Chamados, Novo Chamado, Anexos, Conversa,
│   │                   Histórico, Avaliação
│   ├── Atendimento/    Filas, Detalhe, Dashboard, Ações e Nova Interação,
│   │                   Painel de atendimento
│   ├── Equipamentos/
│   ├── Usuarios/
│   └── Perfil/         Alterar senha
├── theme/          modo claro/escuro e paletas de acento
└── routes.jsx
```

### Rotas

| Rota | Quem | Tela |
|---|---|---|
| `/login` | público | autenticação |
| `/` | autenticado | redireciona conforme o perfil |
| `/meus-chamados` | todos | chamados do próprio usuário |
| `/equipamentos` | todos | patrimônio; USUARIO só consulta o próprio setor |
| `/atendimento` | ATENDENTE · ADMIN | fila geral e minha fila, com filtros |
| `/atendimento/chamados/:id` | ATENDENTE · ADMIN | tratamento do chamado |
| `/atendimento/dashboard` | ATENDENTE · ADMIN | indicadores e gráficos |
| `/usuarios` | ATENDENTE · ADMIN | gestão de contas |

### Convenções ao mexer no código

1. **`src/domain/enums.js` é o dicionário único.** Todo rótulo em português e toda cor
   semântica sai dali. Faltou um campo? Edite esse arquivo, não crie um paralelo.
2. **Uma função por endpoint em `src/api/`**, sempre sobre o `apiClient`. Ele injeta o
   token, derruba a sessão quando o servidor recusa e normaliza a mensagem de erro.
3. **Cor só por token**, como descrito acima.

---

## O que o front espera da API

O contrato completo está no repositório do backend. Do lado de cá, três premissas:

**O JWT precisa da claim `id`.** O front a usa para o usuário reconhecer os próprios
chamados em *Meus Chamados* e para saber se já é o responsável de um chamado. Se ela sair
do token, a listagem do perfil USUARIO fica vazia, sem erro nenhum na tela.

**O erro vem sempre no mesmo envelope.** `{ timestamp, status, error, path }`, com o
campo `error` legível para o usuário final — é ele que o `apiClient` mostra na interface.

**`401` significa sessão inválida ou expirada.** O interceptor derruba a sessão e manda
para o login. Como o servidor também responde `403` quando o token é recusado, o cliente
confere a validade do token antes de decidir entre "sua sessão caiu" e "seu perfil não
pode isso".

---

## Publicar na Vercel

A aplicação vive em `helpnet/`, então configure **Root Directory: `helpnet`** no projeto
da Vercel. O resto — detectar o Vite, rodar `npm run build`, servir o `dist/` — ela faz
sozinha.

Uma variável de ambiente: **`VITE_API_URL`**, apontando para a API publicada. Ela é lida
no momento do build, não em tempo de execução — mudar o valor exige um novo deploy.

O `vercel.json` deste diretório reescreve toda rota para o `index.html`. Sem isso, abrir
`/atendimento/dashboard` direto ou dar F5 nessa rota retorna 404: não existe arquivo com
esse nome, quem resolve as rotas é o React Router, dentro do navegador.

Do lado da API, o backend precisa liberar o domínio da Vercel em `CORS_ALLOWED_ORIGINS`.
Sem isso o navegador bloqueia toda requisição, inclusive o login — e o erro aparece no
console, não na tela.

---

## Limitações conhecidas

- **Filtros no cliente.** O `GET /chamados` aceita filtros no servidor, mas o front ainda
  busca uma página de 200 registros e recorta no navegador. Acima disso, a fila e o
  dashboard passam a contar errado sem avisar. É a próxima melhoria óbvia.
- **Telefone do solicitante** não existe no model de usuário do backend; a interface
  mostra "—" em vez de inventar dado.
- **Sem "esqueci minha senha".** Depende de envio de e-mail, que não está configurado.
  Hoje a saída é um ADMIN redefinir a senha da pessoa.
- **Sem busca por protocolo** na lista de chamados.
