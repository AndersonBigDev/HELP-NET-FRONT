# Mini chat e troca de senha — onde está no front

Documento para a **equipe de backend**. As duas funcionalidades estão prontas e
funcionando no front; falta o servidor expor as rotas. Este arquivo diz exatamente
onde olhar e o que precisa existir do outro lado.

> Nada foi alterado no repositório do backend. O que segue é especificação, não código
> aplicado.

---

## Por onde começar

Dois arquivos concentram todo o contrato. São a fonte da verdade — o resto é UI.

| Comece por | O que tem lá |
|---|---|
| **`helpnet/src/api/mensagensApi.js`** | contrato completo do chat: payloads, códigos de status por cenário, e a explicação do campo `autoria` |
| **`helpnet/src/api/usuariosApi.js`** | contrato das duas rotas de senha, no bloco marcado `TROCA DE SENHA (RF03)` |

Ambos têm um bloco de comentário no topo marcado com `>>> BACKEND:`. Procurar por essa
string no projeto acha todos os pontos relevantes.

### Mapa completo dos arquivos

**Mini chat**

| Arquivo | Papel |
|---|---|
| `helpnet/src/api/mensagensApi.js` | **contrato HTTP** — leia primeiro |
| `helpnet/src/pages/Chamados/ChamadoMensagens.jsx` | componente do chat (bolhas, envio, scroll) |
| `helpnet/src/pages/Chamados/MeusChamadosPage.jsx` | onde o **solicitante** usa o chat (card expandido) |
| `helpnet/src/pages/Atendimento/DetalheChamadoPage.jsx` | onde o **atendente** usa o chat |

**Troca de senha**

| Arquivo | Papel |
|---|---|
| `helpnet/src/api/usuariosApi.js` | **contrato HTTP** — bloco `TROCA DE SENHA (RF03)` |
| `helpnet/src/pages/Perfil/AlterarSenhaModal.jsx` | modal, serve aos dois modos (própria senha e reset por ADMIN) |
| `helpnet/src/components/layout/AppLayout.jsx` | botão "Alterar senha" no menu lateral |
| `helpnet/src/pages/Usuarios/UsuariosPage.jsx` | ícone de chave para o ADMIN redefinir senha de terceiro |

---

## 1. Mini chat do chamado (RF08)

Thread única e bidirecional: o atendente pergunta, o solicitante detalha, os dois
escrevem no mesmo fio. Não há notas internas — tudo que é escrito, os dois lados veem.

### Rotas

```
GET  /chamados/{chamadoId}/mensagens     -> 200, array ordenado por dataEnvio ASC
POST /chamados/{chamadoId}/mensagens     -> 201, o objeto criado
     corpo: { "conteudo": "texto" }      obrigatório, não-vazio, máx. 2000 chars
```

### Payload de resposta

```json
{
  "id": 1,
  "chamadoId": 1,
  "autorId": 2,
  "autorNome": "Joao Solicitante",
  "autorEmail": "joao@helpdesk.com",
  "autorPerfil": "USUARIO",
  "conteudo": "A internet caiu por volta das 8h.",
  "dataEnvio": "2026-09-01T08:40:01.96",
  "autoria": true
}
```

### O campo `autoria` — o único ponto não óbvio

É **relativo a quem está lendo**: `true` quando o leitor é o autor daquela mensagem. A
mesma mensagem volta com `autoria: true` para quem escreveu e `autoria: false` para o
outro lado.

É o que permite alinhar a bolha do chat (direita = "Você") sem o front comparar ids. No
serviço é uma linha, na hora de montar o DTO:

```java
autor.getId().equals(usuarioLogado.getId())
```

Se preferirem não devolver esse campo, **avisem**: o front passa a comparar `autorId`
com a claim `id` do token, o que muda o componente.

### Regras de acesso

| Situação | Esperado |
|---|---|
| Solicitante dono do chamado | lê e escreve |
| Atendente com nível ≥ `nivelExigido` do chamado | lê e escreve |
| ADMIN | sempre permitido |
| Qualquer outro usuário | **403** |
| Sem token / token expirado | **401** |
| `conteudo` vazio ou só espaços | **400** |
| Chamado `FECHADO` | **400** no POST; GET continua **200** |
| Chamado `RESOLVIDO` | **permite escrever** |

A última linha é intencional e diverge da regra dos anexos: `RESOLVIDO` é justamente
quando o solicitante precisa contestar a solução. Só `FECHADO` encerra a conversa.

A regra de "quem alcança o chamado" já existe em
`ChamadoService.validarPermissaoAcessoChamado`. Vale reaproveitar em vez de reescrever —
ela já está duplicada em `AnexoService.validarPermissaoFilaEEscalonamento`, e as
mensagens seriam a terceira cópia.

### Estrutura sugerida

Só como ponto de partida, seguindo o padrão das entidades existentes:

- `Mensagem` → tabela `tab_mensagens`, com `chamado` (ManyToOne), `autor` (ManyToOne),
  `conteudo` (TEXT, not null) e `dataEnvio` (not null).
- `MensagemRepository` com `findByChamadoIdOrderByDataEnvioAsc(Long chamadoId)`.
- Rotas liberadas no `SecurityConfig` como `authenticated()` — a permissão real
  (dono / nível / admin) é do serviço, não do matcher.

> **Nota:** existe uma tabela `tab_mensagens` no banco de desenvolvimento com 3 linhas de
> teste, sem entidade correspondente. Pode descartar ou reaproveitar.

---

## 2. Troca de senha (RF03)

### Rotas

| Método | Rota | Quem | Corpo | Resposta |
|---|---|---|---|---|
| `PATCH` | `/usuarios/me/senha` | qualquer autenticado | `{ senhaAtual, novaSenha }` | 204 |
| `PATCH` | `/usuarios/{id}/senha` | só ADMIN | `{ novaSenha }` | 204 |

### Validações

| Situação | Status |
|---|---|
| `senhaAtual` incorreta | 400 — "A senha atual informada está incorreta." |
| `novaSenha` com menos de 6 caracteres | 400 |
| `novaSenha` igual à atual | 400 |
| ATENDENTE ou USUARIO tentando redefinir senha de terceiro | 403 |
| ADMIN redefinindo a própria senha por `/{id}/senha` | 400 — deve usar `/me/senha` |

Exigir a senha atual em `/me/senha` não é formalidade: sem isso, um token vazado basta
para tomar a conta em definitivo.

### Armadilha na ordem dos matchers

No `SecurityConfig`, `/usuarios/me/senha` precisa vir **antes** de `/usuarios/*/senha`.
Caso contrário o literal `me` casa com o curinga e a troca da própria senha passa a
exigir perfil ADMIN.

---

## Comportamento do front enquanto as rotas não existem

As duas telas detectam o **404** e mostram um aviso explicando que o servidor ainda não
expõe o recurso, em vez de um erro genérico. Isso permite rodar o front e navegar pelas
telas mesmo sem o backend pronto.

Qualquer outro status (400, 401, 403) exibe a mensagem real vinda do
`StandardError.error`. Quando as rotas existirem, o caminho do 404 simplesmente deixa de
ser alcançado — não há nada a remover.

---

## Três premissas do front que dependem do backend

**1. A claim `id` no JWT.** `JwtService.gerarToken` inclui `.claim("id", usuario.getId())`.
O front usa isso para o usuário reconhecer os próprios chamados em "Meus Chamados". **Se
a claim sair do token, a listagem do perfil USUARIO fica vazia.** Alternativa, se
precisarem removê-la: o front passa a chamar `GET /usuarios/me`, que já existe.

**2. `PATCH /usuarios/complementar-perfil` não é mais chamado.** O front deixou de usar o
endpoint removido no commit `3be4e7f`; a tela de complemento de perfil foi apagada,
porque `cargo` e `setor` são obrigatórios no `UserCreateDTO`. Era um bloqueador: o front
redirecionava todo perfil USUARIO para uma tela que só sabia dar erro. Se pretendem
ressuscitar esse fluxo, avisem antes.

**3. `cadastroCompleto` não existe no `UsuarioResponseDTO`.** A coluna "Cadastro" da tela
de Usuários lia esse campo e mostrava todo mundo como "Pendente". Foi removida. Se o
campo voltar ao DTO, a coluna pode voltar.

---

Os demais defeitos do backend (o bloqueador de inicialização, as colunas órfãs do banco,
autorização e configuração de produção) estão no relatório separado enviado à equipe.
