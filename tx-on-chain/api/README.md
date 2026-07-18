# API de Dados de Partida (TxLINE + Solana)

API HTTP local que expõe dados de partidas de futebol (gols, escanteios, cartões) vindos
do feed da TxODDS/TxLINE, e emite um certificado com prova criptográfica on-chain (Solana)
de que os dados finais realmente aconteceram. Serve como comprovante para outras casas de
apostas / parceiros de que o resultado é verídico e não foi inventado depois do fato.

## Stack

| Camada                | Ferramenta                          | Papel                                                                 |
| ---------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| Servidor HTTP           | [Express](https://expressjs.com/)    | Framework web, expõe as rotas REST                                    |
| CORS                    | `cors`                               | Libera o frontend (outra origem) a chamar essa API do navegador       |
| Documentação            | `swagger-ui-express`                 | Serve a spec OpenAPI 3.0 como UI interativa em `/api-docs`             |
| Chamadas HTTP           | `axios`                              | Cliente HTTP para a API da TxLINE (com renovação automática de JWT)   |
| Blockchain              | `@coral-xyz/anchor` + `@solana/web3.js` | Client Anchor para o programa on-chain (ativação, prova de dados)  |
| Token do jogo           | `@solana/spl-token`                  | Conta de token (Token-2022) usada na assinatura/ativação              |
| Linguagem               | TypeScript + `ts-node`               | Roda os `.ts` direto, sem build separado                              |

Tudo isso já está instalado dentro de [tx-on-chain/package.json](../package.json).

## Como o servidor funciona por baixo dos panos

1. **Na inicialização** (`api/server.ts`, função `activateAccess`): carrega a wallet de
   devnet (`ANCHOR_WALLET`), assina uma transação `subscribe` on-chain e ativa um token de
   API junto à TxLINE (mesmo fluxo dos scripts em `examples/devnet/scripts/`). Isso roda
   **uma única vez**, não a cada request — o JWT/token ficam em memória e se renovam
   sozinhos quando expiram (`examples/devnet/common/users.ts`).
2. **Nas rotas de consulta** (`/api/fixtures`, `/api/games/:fixtureId`): a API só repassa
   a chamada para a TxLINE (`users.apiClient`) e formata a resposta.
3. **Na rota de certificado** (`/api/games/:fixtureId/certificate`): além de consultar,
   ela **envia transações reais** na Solana para provar os dados on-chain.

Arquivos principais:

| Arquivo                                              | Responsabilidade                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| [server.ts](server.ts)                                 | Rotas Express, inicialização/ativação on-chain                        |
| [matchEvents.ts](matchEvents.ts)                        | Interpreta o feed bruto de histórico (formato SSE em texto) e extrai gols/escanteios/cartões por time e período |
| [certificate.ts](certificate.ts)                        | Constrói as provas de Merkle e envia as transações `validateStatV2`   |
| [openapi.ts](openapi.ts)                                | Spec OpenAPI 3.0 servida pelo Swagger UI                               |

## Como rodar

Da pasta `tx-on-chain/`:

```powershell
$env:TOKEN_MINT_ADDRESS = "4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG"
$env:ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com"
$env:ANCHOR_WALLET = "./_keys/testuser-wallet-1.json"
npx ts-node api/server.ts
```

Servidor sobe em `http://localhost:3001` (mude com a env var `PORT`). Documentação
interativa em **http://localhost:3001/api-docs**.

Variáveis de ambiente:

| Variável                | Obrigatória | Descrição                                                        |
| ------------------------ | ----------- | -------------------------------------------------------------- |
| `TOKEN_MINT_ADDRESS`     | sim         | Mint do token TXL da rede usada (devnet/mainnet)                |
| `ANCHOR_PROVIDER_URL`    | sim         | RPC da Solana (`https://api.devnet.solana.com` em teste)        |
| `ANCHOR_WALLET`          | sim         | Caminho do keypair JSON que paga as transações                  |
| `PORT`                   | não (3001)  | Porta HTTP do servidor                                          |
| `SOLANA_NETWORK`         | não (devnet)| `devnet` ou `mainnet-beta` — só afeta o rótulo/link no certificado |

## As 3 rotas

### 1. `GET /api/fixtures` — seleção de jogo

Lista as partidas de uma competição. É o que alimenta a tela inicial de "escolher o jogo".

**Query params:**

| Parâmetro         | Default | Descrição                                  |
| ------------------ | ------- | -------------------------------------------- |
| `competitionId`     | `72`    | 72 = Copa do Mundo                            |
| `startEpochDay`     | —       | Janela de dias (epoch day) para filtrar        |

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/fixtures?competitionId=72"
```

Retorna a lista crua de fixtures da TxLINE (`FixtureId`, `Participant1`, `Participant2`,
`StartTime`, `GameState`, etc — sem transformação).

### 2. `GET /api/games/:fixtureId` — linha do tempo

Devolve gols, escanteios e cartões de uma partida específica, já organizados por time e
por período (1º tempo, intervalo, 2º tempo, prorrogação, pênaltis). Funciona tanto para
partidas já encerradas quanto **em andamento** — cada chamada busca o estado mais atual
disponível, sem cache.

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/games/18241006"
```

**Dados ao vivo**: essa rota busca `/scores/historical/{fixtureId}` (registro completo
oficial) **e** `/scores/snapshot/{fixtureId}` (estado mais recente) em paralelo, e junta
os dois. Isso é necessário porque `/scores/historical` só é preenchido depois que os
eventos são agrupados em lotes de ~5 minutos — para uma partida em andamento ele pode
estar vazio ou atrasado, enquanto `/scores/snapshot` já reflete o que acabou de acontecer.
Pra acompanhar uma partida ao vivo pelo terminal, é só chamar essa rota de novo em loop
(ver exemplo de polling no [COMO_CONSULTAR.md](../../COMO_CONSULTAR.md)).

> Nota sobre o ambiente de teste: no devnet, essa "Copa do Mundo 2026" é um feed de
> demonstração da TxODDS, não uma transmissão real sincronizada com o mundo real — os
> placares avançam numa simulação própria deles. Não estranhe se o placar aqui não bater
> com o que você está vendo em outro lugar.

Resposta (resumida):

```jsonc
{
  "fixtureId": 18241006,
  "teams": { "participant1": { "id": 1888, "name": "England" }, "participant2": { "id": 1489, "name": "Argentina" } },
  "finalScore": { "participant1": 1, "participant2": 2 },
  "goals": [
    { "team": 1, "teamName": "England", "period": "H2", "clockSeconds": 3264, "playerId": 911404, "playerName": "Gordon, Anthony", "detail": "Shot" }
  ],
  "corners": [
    { "team": 1, "teamName": "England", "period": "H1", "clockSeconds": 394 }
  ],
  "cards": [
    { "team": 1, "teamName": "England", "period": "H1", "clockSeconds": 2174, "playerId": 10015384, "playerName": "Anderson, Elliot", "cardType": "yellow" }
  ],
  "statsByPeriod": {
    "H1": { "participant1": { "goals": 0, "yellowCards": 1, "redCards": 0, "corners": 1 }, "participant2": { "...": "..." } }
  }
}
```

**Limitações do feed de origem** (não são bugs da API, são do que a TxLINE expõe):
- Só **gols** e **cartões** trazem `playerId`/`playerName`. Escanteios e faltas vêm só no
  nível de time — o feed não diz quem cobrou o escanteio ou cometeu a falta.
- Faltas ainda não estão nessa resposta (existem no feed como ação `free_kick`, mas não
  foram incluídas nessa primeira versão).

### 3. `POST /api/games/:fixtureId/certificate` — certificado on-chain

Emite um comprovante provando, com transações **reais** na Solana, que o placar final
(gols, cartões, escanteios) bate com o que está ancorado no Merkle root diário do
programa on-chain. Só funciona **depois que a partida termina** (precisa do evento
`game_finalised` do feed) — antes disso retorna `409`.

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/games/18241006/certificate" -Method Post
```

Resposta (real, testada contra England x Argentina):

```jsonc
{
  "receiptId": "RECIBO-504789",
  "match": { "fixtureId": 18241006, "participant1": "England", "participant2": "Argentina", "startTime": 1784142000000 },
  "finalScore": { "participant1": 1, "participant2": 2 },
  "dataAnchored": ["Gols (Participante 1)", "Gols (Participante 2)", "Cartoes Amarelos (Participante 1)", "..."],
  "network": "Solana Devnet",
  "issuedAt": 1784405117685,
  "txHash": "4riaoZbUr8MzKkgrrhdWmU2aNkLRa1wF7hoPutUc77ESequXtJyj83iD5p1mRRnHzevYHmQZykJfoT58gNwvVkbH",
  "verifications": [
    { "txHash": "...", "explorerUrl": "https://explorer.solana.com/tx/...?cluster=devnet", "stats": [ /* gols, cartões, escanteios provados nessa transação */ ] }
  ],
  "note": "Faltas, chutes ao gol, penaltis e impedimentos nao tem statKey documentado..."
}
```

**Por que 3 transações e não 1**: a versão do Anchor usada no projeto (`0.32.1`)
serializa a instrução `validateStatV2` num buffer fixo de **1000 bytes** — é um
`// TODO: use a tighter buffer` não resolvido na própria lib, não uma trava do programa
on-chain. Com as provas de Merkle incluídas, cabem no máximo ~4 estatísticas por chamada;
uso lotes de 3 para ter margem de segurança. As 8 estatísticas (gols/cartões
amarelos/cartões vermelhos/escanteios × 2 times) saem em 3 transações, cada uma com seu
próprio hash — todas ficam listadas em `verifications`, e `txHash` no topo é a da última.

**O que NÃO é provado on-chain**: chutes ao gol, pênaltis e impedimentos não têm
`statKey` documentado no encoding do soccer feed hoje (só gols, cartões e escanteios
têm — chaves 1 a 8). Por isso o certificado não inclui prova criptográfica desses itens,
mesmo que apareçam como "dados ancorados" num mockup de design. Se a TxODDS documentar
esses `statKey`s no futuro, é só estender `PROVABLE_STAT_KEYS` em
[certificate.ts](certificate.ts).

**Custo**: cada chamada gasta uma taxa de rede pequena (lamports de devnet) e demora
alguns segundos, porque manda transações reais e espera confirmação. Não é uma operação
"grátis" como as outras duas rotas — por isso é `POST`, não `GET`.

## Limitações conhecidas / próximos passos

- Rede fixa em devnet para teste (`ANCHOR_PROVIDER_URL`, `programId`, wallet de teste).
  Para produção, trocar essas variáveis para os valores de mainnet com uma wallet
  financiada de verdade.
- A wallet do servidor paga todas as transações de certificado — em produção, considerar
  um mecanismo de rate-limit ou cobrança para evitar abuso, já que cada emissão custa SOL
  de verdade.
- Faltas (fouls) podem ser adicionadas em `/api/games/:fixtureId` seguindo o mesmo padrão
  de `goals`/`corners`/`cards` em [matchEvents.ts](matchEvents.ts) (ação `free_kick` no
  feed, com `Data.FreeKickType !== "Offside"`).
