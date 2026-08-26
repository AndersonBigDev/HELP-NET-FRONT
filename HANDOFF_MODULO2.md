# Handoff — Módulo 2 (Atendimento, Filas, Escalonamento, Dashboard)

Esse commit trocou a estrutura antiga (mockada, em `HELP-NET-FRONT/src/...`) por uma
base nova em [`helpnet/`](helpnet), já com autenticação real, cliente de API e as
telas do Módulo 1 prontas. Este arquivo é o ponto de partida pra você continuar o
Módulo 2 em cima dela.

## Rodando o projeto

```bash
cd helpnet
npm install
cp .env.example .env   # aponta pra http://localhost:8080
npm run dev
```

Backend precisa estar de pé (`docker compose up -d` na pasta do backend + `./mvnw spring-boot:run`).
Login de teste: `admin@helpdesk.com` / `123` (perfil ADMIN).

## O que já existe pra você reaproveitar

- **`src/components/layout/AppLayout.jsx`** — o `<aside>` já é o menu lateral fixo
  (RNF01). Hoje ele só tem os links básicos (Atendimento, Usuários, Sair) — troque o
  conteúdo do `<nav>` pelas suas seções de Fila/Dashboard mantendo a mesma casca
  (largura `w-64`, cabeçalho com logo, bloco de usuário/logout no rodapé).
- **`src/domain/enums.js`** — dicionário único de `Categoria`, `Urgencia`,
  `StatusChamado`, `NivelAtendente`, `Setor`, `Perfil`, cada um com `label` em PT-BR e
  `color` semântica (`success`/`warning`/`danger`/`info`/`neutral`) pra usar no
  componente `Badge`. Use isso pros badges da Fila/Dashboard em vez de duplicar
  strings — se faltar algum campo, edita esse arquivo (não cria um paralelo).
- **`src/components/ui/`** — `Button`, `Input`/`Select`/`TextArea` (em `Field.jsx`),
  `Card`, `Badge`, `Modal`, `Spinner`/`ErrorBanner`/`EmptyState` (em `Feedback.jsx`).
  São os primitivos do tema dark — reaproveite em vez de estilizar do zero.
- **`src/index.css`** — os tokens de cor (`@theme` do Tailwind v4): `canvas`,
  `surface`/`surface-2`/`surface-3`, `border`/`border-soft`, `text`/`text-muted`/`text-faint`,
  `accent`/`accent-hover`/`accent-soft`, `focus`, e as semânticas
  `success`/`warning`/`danger`/`info` (cada uma com variante `-soft` pra fundo de badge).
- **`src/auth/AuthContext.jsx`** — hook `useAuth()` retorna `{ user, logout }`, onde
  `user = { email, nome, perfil, cadastroCompleto }`. `perfil` é `"ATENDENTE"` ou
  `"ADMIN"` pra quem acessa sua área.
- **`src/api/chamadosApi.js`** — `chamadosApi.listar(params)` (GET /chamados,
  paginado) e `chamadosApi.escalonar(id, { novoNivel, justificativa })` (POST
  /chamados/:id/escalonar) já existem. Siga esse padrão (uma função por endpoint,
  usando `apiClient` de `src/api/client.js`) se precisar adicionar chamadas novas.
- **`src/pages/Chamados/ChamadoAnexos.jsx`** — componente pronto de
  upload/lista/download/delete de anexos (RF07/RNF04). Reaproveite dentro do seu
  `DetalheChamado`, é só passar `chamadoId`.
- **Rota placeholder:** `/atendimento` (`src/pages/Atendimento/AtendimentoPlaceholderPage.jsx`)
  é onde sua Fila de Atendimento entra — troque o conteúdo dessa página e registre as
  rotas filhas (`/atendimento/chamados/:id`, `/atendimento/dashboard` etc.) em
  `src/routes.jsx`.

## Gaps do backend que afetam direto o seu módulo

O backend (Spring Boot) não tem hoje:

1. **Filtros em `GET /chamados`** — só pagina (`page`, `size`, `sort`), não tem
   parâmetro de status/tag/nível/prioridade nem separa "fila geral" de "minha fila"
   (RF10/RF11). Você vai precisar filtrar no client (como fiz em `MeusChamadosPage.jsx`,
   que filtra por `emailSolicitante` depois de buscar tudo) ou pedir esse endpoint no
   backend.
2. **Endpoint de métricas/dashboard** (RF14/RN08) — não existe. `EscalonamentoLogRepository`
   existe no backend mas nenhum controller expõe os logs.
3. **Exportação CSV do escalonamento** (RF13/RNF05) — mesma coisa, sem endpoint pra
   buscar os logs. A geração do CSV em si você pode fazer 100% no client (gerar Blob
   a partir do array de logs, como fiz no download de anexo em `ChamadoAnexos.jsx`)
   assim que tiver de onde puxar os dados.
4. **Telefone do solicitante/responsável** (RN05) — não existe no model `Usuario`.
   Hoje eu exibo "—" nesses campos em `MeusChamadosPage.jsx`; siga o mesmo padrão em
   vez de inventar dado.

Nenhum desses foi implementado no backend por decisão do time (evitar mexer no
backend por enquanto) — se decidirem que precisa, é conversa pro dev do backend.

## Convenção de commit

Trabalhe dentro de `helpnet/` só. A pasta antiga `HELP-NET-FRONT/src/...` foi
removida deste commit — não recrie nada lá.
