# HELP-NET

Sistema de atendimento de chamados (helpdesk) para uso interno. Um colaborador abre um
chamado descrevendo o problema; o sistema roteia automaticamente para o setor
responsável, define a prioridade e o prazo, e a equipe de suporte atende, escalona
quando necessário e encerra.

O projeto vive em **dois repositórios**:

| Repositório | O que é | Stack |
|---|---|---|
| `HELP-NET-BackEnd` | API REST | Java 21 · Spring Boot 4.1 · Spring Security + JWT · JPA/Hibernate |
| `HELP-NET-FRONT` | Interface web (este repo, pasta `helpnet/`) | React 19 · Vite 8 · Tailwind 4 · React Router 7 · axios |

---

## Estado atual

Backend e front sobem e conversam entre si. As pendências que esta seção listava — o
backend não iniciar por causa do `ObjectMapper`, as colunas órfãs no banco, e as telas de
conversa e de troca de senha sem endpoint — foram todas resolvidas.

Uma premissa segue valendo, e vale conhecer antes de mexer na autenticação: **o JWT
carrega a claim `id`** (`JwtService.gerarToken`). O front usa esse id para o usuário
reconhecer os próprios chamados em "Meus Chamados" e para saber se já é o responsável de
um chamado. Se a claim sair do token, a listagem do perfil USUARIO fica vazia — a
alternativa, nesse caso, seria o front passar a chamar `GET /usuarios/me`.

---

## Como rodar

### Pré-requisitos

- Java 21 e Maven (o repositório do backend traz o wrapper `mvnw`)
- Node 20+
- MySQL 8 — local na porta 3306, ou via Docker na 3308

### 1. Banco

O backend traz um `docker-compose.yml` com MySQL e PostgreSQL:

```bash
docker compose up -d
```

Isso sobe MySQL na porta **3308** (banco `helpdesk_db`, usuário `helpdesk_user`, senha
`helpdesk_pass`) e PostgreSQL na **5432**. Quem já tem MySQL instalado na máquina pode
usar a porta 3306 direto, sem Docker — é o que o profile `local` espera.

### 2. Backend

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

Sobe em `http://localhost:8080`. Os profiles disponíveis:

| Profile | Banco | Observação |
|---|---|---|
| `local` (padrão) | MySQL em `localhost:3306` | usuário `root`; ajuste a senha em `application-local.properties` |
| `dev` | MySQL em `localhost:3308` | casa com o `docker-compose` |
| `prod` | PostgreSQL | espera `DATABASE_URL`, `DB_USER`, `DB_PASS` |

Na primeira execução o `DataInitializer` cria a conta de administrador:

```
admin@helpdesk.com  /  123
```

Documentação interativa da API em `http://localhost:8080/swagger-ui.html`.

### 3. Front

```bash
cd helpnet
npm install
cp .env.example .env
npm run dev
```

Sobe em `http://localhost:5173`. O `.env` tem uma única variável:

```
VITE_API_URL=http://localhost:8080
```

Outros comandos: `npm run build` (produção), `npm run lint` (oxlint).

---

## Perfis de acesso

Todo usuário tem um dos três perfis. O perfil vem no JWT e define o que a pessoa vê.

**USUARIO** — colaborador comum. Abre chamados, acompanha os próprios, conversa com o
atendente, avalia depois de resolvido. Enxerga apenas os chamados em que é solicitante e
os equipamentos do próprio setor.

**ATENDENTE** — equipe de suporte, subdividida em três níveis:

| Nível | Alcança | Equipamentos |
|---|---|---|
| `NIVEL_I` | chamados de nível I | só consulta; não cadastra nem inativa |
| `NIVEL_II` | chamados de nível I e II | gerencia urgência NORMAL e MÉDIA |
| `NIVEL_III` | todos os chamados | gerencia qualquer urgência |

A regra é cumulativa: um atendente alcança todo chamado cujo `nivelExigido` seja **menor
ou igual** ao seu nível. Um chamado escalonado para nível III desaparece da visão de quem
é nível I.

**ADMIN** — enxerga tudo, sem restrição de nível ou setor, e gerencia usuários.

Cadastro só é aceito com e-mail no domínio `@helpdesk.com`.

---

## Como um chamado funciona

### Abertura e roteamento automático

Ao abrir um chamado o solicitante escolhe uma **categoria**. A categoria já carrega a
urgência e o setor responsável — o solicitante não escolhe prioridade, o que evita que
todo mundo marque tudo como urgente:

| Categoria | Urgência | Setor responsável |
|---|---|---|
| Falha de Servidor | CRÍTICA | Infraestrutura |
| Falha de Rede | ALTA | Infraestrutura |
| Sistema Inoperante | ALTA | Desenvolvimento |
| Erro de Sistema | MÉDIA | Desenvolvimento |
| Manutenção de Hardware | MÉDIA | Infraestrutura |
| Dúvida sobre Folha de Pagamento | NORMAL | Recursos Humanos |
| **Outros** | escolhida pelo solicitante | sem setor fixo |

`OUTROS` é a única categoria em que a urgência é informada manualmente — e nesse caso ela
passa a ser obrigatória.

Todo chamado nasce com status `ABERTO`, nível exigido `NIVEL_I` e um **protocolo** no
formato `AAAAMMDD-XXXX`. Opcionalmente pode ser vinculado a um equipamento do patrimônio.

### Prazo (SLA)

O prazo é calculado na abertura, a partir da urgência:

| Urgência | Prazo |
|---|---|
| CRÍTICA | 4 horas |
| ALTA | 8 horas |
| MÉDIA | 24 horas |
| NORMAL | 72 horas |

O backend grava o resultado em `prazoLimite` e o front usa esse valor como fonte da
verdade. Na tela, o chamado fica em estado de atenção (âmbar) quando resta menos de 25%
do prazo, e em vermelho quando estoura. Chamado resolvido ou fechado para de contar.

### Ciclo de vida

```
ABERTO ──► EM_ANDAMENTO ──► RESOLVIDO ──► FECHADO
                ▲ │              │            │
                │ ▼              │            │
              PAUSADO            │            │
                ▲                │            │
                └── reabertura ──┴────────────┘

ESCALONADO parte de qualquer estado ativo: sobe o nível exigido e o chamado
continua em atendimento.
```

- `ABERTO` — na fila, sem responsável
- `EM_ANDAMENTO` — algum atendente assumiu
- `PAUSADO` — atendimento parado por dependência externa; exige responsável e motivo
  escrito, e o relógio do SLA para enquanto dura
- `ESCALONADO` — passou para um nível superior
- `RESOLVIDO` — solução aplicada, aguardando avaliação do solicitante
- `FECHADO` — encerrado

Reabrir um chamado `RESOLVIDO` ou `FECHADO` exige justificativa e devolve ele ao
atendimento. Toda mudança de estado grava um evento na trilha do chamado.

### Trilha do atendimento

Cada ação sobre o chamado — abertura, atribuição, pausa, retomada, escalonamento,
resolução, reabertura e avaliação — grava um evento em `tab_chamado_historico`, dentro da
mesma transação da ação. O atendente também pode registrar uma anotação avulsa, que entra
na trilha sem mexer no status.

A trilha é append-only: não existe rota de edição nem de exclusão. Cada evento guarda quem
era o responsável **naquele instante**, e não o responsável atual — é o que permite ler a
história de um chamado que trocou de atendente sem atribuir tudo ao último deles. O
solicitante acompanha a mesma trilha em modo leitura.

### Escalonamento

Quando um atendente não consegue resolver, escalona para um nível acima. O escalonamento
**só sobe** — o backend rejeita qualquer tentativa de baixar o nível. Uma justificativa é
obrigatória, e cada movimento gera um registro em `EscalonamentoLog` com nível anterior,
nível novo, autor, justificativa e data.

---

## Regras de negócio

- **Limite de 3 chamados ativos** por usuário comum (contando `ABERTO` e `EM_ANDAMENTO`).
  Atendentes e admins não têm esse limite.
- **Domínio restrito**: só e-mails `@helpdesk.com` são aceitos no cadastro.
- **Chamado em nome de terceiro**: apenas atendentes e admins podem abrir um chamado
  informando outro solicitante.
- **Avaliação**: só o solicitante original avalia, e só depois de `RESOLVIDO` ou
  `FECHADO`. Nota de 1 a 5 mais comentário opcional.
- **Exclusão de usuário**: bloqueada se a pessoa tem chamados vinculados, como solicitante
  ou responsável.
- **Anexos**: máximo 10 MB por arquivo, gravados como BLOB no próprio banco. O front
  restringe as extensões a `.pdf`, `.png`, `.jpg`, `.jpeg` e `.svg`. Não é possível
  anexar em chamado encerrado.
- **Equipamentos**: a exclusão é lógica (`ativo = false`), nunca remoção física. Não se
  abre chamado para equipamento inativo.

---

## Mapa da API

Toda rota exige `Authorization: Bearer <token>`, exceto o login. O token é HS256 e vale
24 horas; carrega `sub` (e-mail), `id`, `nome` e `perfil`.

### Autenticação

| Método | Rota | Quem |
|---|---|---|
| `POST` | `/auth/login` | público |

### Usuários

| Método | Rota | Quem |
|---|---|---|
| `GET` | `/usuarios/me` | qualquer autenticado |
| `GET` | `/usuarios` | ADMIN · ATENDENTE |
| `POST` | `/usuarios` | ADMIN · ATENDENTE |
| `PUT` | `/usuarios/{id}` | ADMIN · ATENDENTE |
| `DELETE` | `/usuarios/{id}` | ADMIN · ATENDENTE |
| `PATCH` | `/usuarios/me/senha` | qualquer autenticado · exige a senha atual |
| `PATCH` | `/usuarios/{id}/senha` | ADMIN · reset de terceiro |

### Chamados

| Método | Rota | Quem |
|---|---|---|
| `POST` | `/chamados` | qualquer autenticado |
| `GET` | `/chamados` | qualquer autenticado · paginado, recortado por perfil |
| `GET` | `/chamados/{id}` | qualquer autenticado · sujeito à regra de nível |
| `GET` | `/chamados/fila` | ADMIN · ATENDENTE |
| `POST` | `/chamados/{id}/escalonar` | ADMIN · ATENDENTE |
| `PATCH` | `/chamados/{id}/assumir` | ADMIN · ATENDENTE |
| `PATCH` | `/chamados/{id}/status` | ADMIN · ATENDENTE · corpo JSON |
| `PATCH` | `/chamados/{id}/avaliar` | solicitante original |
| `GET` | `/chamados/{id}/historico` | autenticado · sujeito à regra de nível |
| `POST` | `/chamados/{id}/historico` | ADMIN · ATENDENTE · anotação avulsa |
| `GET` | `/chamados/{id}/mensagens` | autenticado · sujeito à regra de nível |
| `POST` | `/chamados/{id}/mensagens` | autenticado · bloqueado em chamado FECHADO |

`GET /chamados` aceita os filtros `status`, `urgencia`, `setor`, `nivelExigido`,
`solicitanteId` e `responsavelId`, além de `page`, `size` e `sort`.

`PATCH /chamados/{id}/status` recebe `{ status, observacao?, descricaoResolucao?,
justificativaReabertura? }`. A `observacao` é o relato do atendente e vira a descrição do
evento na trilha; ela é **obrigatória ao pausar**, porque uma pausa sem motivo não conta
nada a quem ler o histórico depois. Resolver ou fechar pela primeira vez exige
`descricaoResolucao`; reabrir exige `justificativaReabertura`.

### Anexos, equipamentos e logs

| Método | Rota | Quem |
|---|---|---|
| `POST` | `/chamados/{id}/anexos` | multipart, campo `file` |
| `GET` | `/chamados/{id}/anexos` | autenticado |
| `GET` | `/anexos/{id}/download` | autenticado |
| `DELETE` | `/chamados/{id}/anexos/{anexoId}` | autor do anexo · ATENDENTE · ADMIN |
| `GET` | `/equipamentos` | autenticado · recortado por setor para USUARIO |
| `POST` `PUT` `DELETE` | `/equipamentos[/{id}]` | ADMIN · ATENDENTE, com trava por nível |
| `GET` | `/escalonamentos` | ADMIN · ATENDENTE |
| `GET` | `/escalonamentos/chamado/{id}` | ADMIN · ATENDENTE |

### Formato de erro

Toda falha responde no mesmo envelope:

```json
{
  "timestamp": "2026-09-01T08:40:02.46",
  "status": 400,
  "error": "Mensagem legível para o usuário final",
  "path": "/chamados/1/mensagens"
}
```

`401` significa sessão inválida ou expirada. `400` cobre tanto erro de preenchimento
quanto negativa de permissão — o backend ainda não separa os dois casos.

---

## Estrutura do front

```
helpnet/src/
├── api/            uma função por endpoint, sobre o axios de client.js
├── auth/           AuthContext (sessão), ProtectedRoute, RoleRoute, leitura do JWT
├── components/
│   ├── layout/     AppLayout — menu lateral fixo presente em toda tela pós-login
│   └── ui/         Button, Card, Badge, Modal, Field, Feedback, SlaTag, SeletorTema
├── domain/         enums.js, sla.js, equipamentos.js — regras espelhadas do backend
├── hooks/          useChamados, useUsuarios, useEquipamentos
├── pages/
│   ├── Login/
│   ├── Chamados/       Meus Chamados, Novo Chamado, Anexos, Conversa
│   ├── Atendimento/    Filas, Detalhe, Dashboard, Escalonar
│   ├── Equipamentos/
│   ├── Usuarios/
│   └── Perfil/         Alterar senha
├── theme/          modo claro/escuro e paletas de acento
└── routes.jsx
```

### Rotas da interface

| Rota | Quem | Tela |
|---|---|---|
| `/login` | público | autenticação |
| `/` | autenticado | redireciona conforme o perfil |
| `/meus-chamados` | todos | chamados do próprio usuário, com anexos e conversa |
| `/equipamentos` | todos | patrimônio; USUARIO só consulta o próprio setor |
| `/atendimento` | ATENDENTE · ADMIN | fila geral e "minha fila", com filtros |
| `/atendimento/chamados/:id` | ATENDENTE · ADMIN | tratamento do chamado |
| `/atendimento/dashboard` | ATENDENTE · ADMIN | indicadores e gráficos |
| `/usuarios` | ATENDENTE · ADMIN | gestão de contas |

### Convenções

Vale seguir estas quatro ao mexer no código:

1. **`src/domain/enums.js` é o dicionário único.** Todo rótulo em português e toda cor
   semântica de `Categoria`, `Urgencia`, `StatusChamado`, `NivelAtendente`, `Setor` e
   `Perfil` sai dali. Faltou um campo? Edite esse arquivo, não crie um paralelo.
2. **Uma função por endpoint em `src/api/`**, sempre sobre o `apiClient`. Ele já injeta o
   token, trata sessão expirada e normaliza a mensagem de erro.
3. **Cores só por token.** `src/index.css` define `canvas`, `surface`, `border`, `text`,
   `accent` e as semânticas `success`/`warning`/`danger`/`info`. Nada de hex solto — o
   tema claro/escuro e as cinco paletas de acento dependem disso.
4. **Quem valida de verdade é o backend.** As regras espelhadas em `src/domain/` existem
   para a tela não oferecer um botão que voltaria erro, não para substituir a validação.

---

## Limitações conhecidas

- **Telefone do solicitante** (RN05) não existe no model `Usuario`; a interface mostra
  "—" nesses campos em vez de inventar dado.
- **Filtros no cliente.** O `GET /chamados` já aceita filtros no servidor, mas o front
  ainda busca uma página de 200 registros e recorta no navegador. Migrar isso é a próxima
  melhoria óbvia de performance.
- **Sem "esqueci minha senha".** A recuperação depende de envio de e-mail, que não está
  configurado. Hoje a saída é um ADMIN redefinir a senha da pessoa.
- **Sem busca por protocolo** na lista de chamados.
