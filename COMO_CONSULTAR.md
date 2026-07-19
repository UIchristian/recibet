# Como fazer consultas de teste

O projeto funcional está em `tx-on-chain/` (baixado do repositório oficial). O `app.ts`
original na raiz não tinha as peças necessárias (idl, types, wallet) — por isso não rodava.

## 1. Rodar a consulta básica

Da pasta `tx-on-chain/`, execute:

```powershell
$env:TOKEN_MINT_ADDRESS = "4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG"
$env:ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com"
$env:ANCHOR_WALLET = "./_keys/testuser-wallet-1.json"
npx ts-node examples/devnet/scripts/basic_queries.ts
```

Isso faz 3 chamadas simples: lista de partidas (fixtures), odds de uma partida e placar
de uma partida. O script está em
[tx-on-chain/examples/devnet/scripts/basic_queries.ts](tx-on-chain/examples/devnet/scripts/basic_queries.ts).

## 2. Para testar outra partida

No topo do arquivo `basic_queries.ts`, mude:

```typescript
const COMPETITION_ID = 72;        // id da competição
const START_EPOCH_DAY = 20624;    // janela de dias para listar fixtures
const FIXTURE_ID = 18175981;      // id da partida específica (odds/scores)
```

Você pega `FIXTURE_ID` a partir do resultado da consulta de fixtures (passo 1) — cada
partida no retorno tem um campo `FixtureId`.

## 3. Endpoints já usados nos exemplos (para consultas manuais)

Todos combinados com `users.apiClient.get(...)`, que já injeta o token de autenticação:

| Endpoint                                                    | O que retorna                          |
| ------------------------------------------------------------ | --------------------------------------- |
| `/fixtures/snapshot?competitionId=..&startEpochDay=..`      | Lista de partidas                       |
| `/odds/snapshot/{fixtureId}`                                 | Odds atuais da partida                  |
| `/scores/snapshot/{fixtureId}`                                | Placar atual da partida                 |
| `/scores/historical/{fixtureId}`                              | Histórico completo de placares          |

## 4. Wallet de teste

Já existe uma wallet de devnet gerada e financiada em
`tx-on-chain/_keys/testuser-wallet-1.json` (endereço
`FGbdE2dPixSv9Tk8nQir7jaJAHCkNFm5bjmSSGCxyQm`, saldo 2.5 SOL de devnet). Não precisa
criar outra para os testes — é só reaproveitar o `ANCHOR_WALLET` acima.

Atenção: cada execução de um script chama `subscribe` on-chain de novo (gasta um pouco
de SOL de devnet). Se o saldo acabar, peça mais em https://faucet.solana.com.

## 5. Outros scripts prontos no repositório

Em `tx-on-chain/examples/devnet/scripts/` também há exemplos mais completos (streaming
de odds/placares em tempo real, validação on-chain de estatísticas, etc.) — todos rodam
com as mesmas 3 variáveis de ambiente do passo 1, só trocando o nome do arquivo.

## 6. API HTTP para o frontend

Em [tx-on-chain/api/](tx-on-chain/api/) tem uma API HTTP (Express) que o frontend pode
consultar direto, sem precisar lidar com Anchor/Solana. Ela ativa o acesso on-chain uma
única vez na inicialização e depois só repassa as consultas HTTP.

Rodar da pasta `tx-on-chain/`:

```powershell
$env:TOKEN_MINT_ADDRESS = "4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG"
$env:ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com"
$env:ANCHOR_WALLET = "./_keys/testuser-wallet-1.json"
npx ts-node api/server.ts
```

Isso sobe um servidor em `http://localhost:3001`. Documentação interativa (Swagger UI)
em **http://localhost:3001/api-docs** — dá pra ver as rotas e testar direto no navegador
("Try it out"). O JSON puro da spec OpenAPI fica em `http://localhost:3001/openapi.json`.

Rotas:

| Rota                                              | Tela do app        | O que retorna                                                        |
| -------------------------------------------------- | ------------------ | ---------------------------------------------------------------------- |
| `GET /api/fixtures?competitionId=72`               | Seleção de jogo    | Lista de partidas (mesmo formato do `/fixtures/snapshot`)             |
| `GET /api/games/:fixtureId`                        | Linha do tempo      | Gols, escanteios e cartões, por time e por tempo (ver formato abaixo) |
| `POST /api/games/:fixtureId/certificate`           | Certificado         | Emite o comprovante on-chain (ver seção 7 abaixo)                     |

Exemplo de resposta de `GET /api/games/18241006`:

```jsonc
{
  "fixtureId": 18241006,
  "teams": { "participant1": { "id": 1888, "name": "England" }, "participant2": { "id": 1489, "name": "Argentina" } },
  "finalScore": { "participant1": 1, "participant2": 2 },
  "goals": [
    { "team": 1, "teamName": "England", "period": "H2", "clockSeconds": 3264, "playerId": 911404, "playerName": "Gordon, Anthony", "detail": "Shot" }
    // ...
  ],
  "corners": [
    { "team": 1, "teamName": "England", "period": "H1", "clockSeconds": 394 }
    // escanteios não têm jogador individual — a API do feed só dá o time (assim como faltas)
  ],
  "cards": [
    { "team": 1, "teamName": "England", "period": "H1", "clockSeconds": 2174, "playerId": 10015384, "playerName": "Anderson, Elliot", "cardType": "yellow" }
    // ...
  ],
  "statsByPeriod": {
    "H1": { "participant1": { "goals": 0, "yellowCards": 1, "redCards": 0, "corners": 1 }, "participant2": { /* ... */ } },
    "H2": { /* ... */ },
    "Total": { /* ... */ }
    // H1, HT, H2, ET1, ET2, PE, ETTotal — contagens agregadas por time e por tempo,
    // batendo com o encoding usado na validação on-chain (statKey 1-8 + prefixo de período)
  }
}
```

`period` pode ser: `H1` (1º tempo), `HT` (intervalo), `H2` (2º tempo), `ET1`/`ET2` (prorrogação),
`PE` (pênaltis).

Nota: o feed de placares só dá o jogador (`playerId`/`playerName`) em **gols** e
**cartões**. Escanteios e faltas só vêm no nível de time — não tem como saber qual
jogador cobrou o escanteio ou cometeu a falta, então isso não está no `tasks.txrt` por
acaso (você já tinha anotado "faltas nível de time").

Faltas (fouls) ainda não estão incluídas nessa primeira versão — no feed elas vêm dentro
da ação `free_kick` (campo `Data.FreeKickType`, tudo que não for `"Offside"` conta como
falta). Se quiser, adiciono no mesmo formato dos gols/cartões/escanteios.

## 7. Certificado (comprovante on-chain)

`POST /api/games/:fixtureId/certificate` — só funciona **depois que a partida termina**
(precisa do evento `game_finalised` do feed). Ele pega o placar final e manda transações
**reais** na Solana (`validateStatV2`) provando que os números batem com o Merkle root
já ancorado on-chain. Cada chamada gasta uma taxinha de rede e demora alguns segundos.

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/games/18241006/certificate" -Method Post | ConvertTo-Json -Depth 6
```

Resposta (testado de verdade contra England x Argentina, `18241006`):

```jsonc
{
  "receiptId": "RECIBO-504789",
  "match": { "fixtureId": 18241006, "participant1": "England", "participant2": "Argentina", "startTime": 1784142000000 },
  "finalScore": { "participant1": 1, "participant2": 2 },
  "dataAnchored": ["Gols (Participante 1)", "Gols (Participante 2)", "Cartoes Amarelos (Participante 1)", /* ... */],
  "network": "Solana Devnet",
  "issuedAt": 1784405117685,
  "txHash": "4riaoZbUr8MzKkgrrhdWmU2aNkLRa1wF7hoPutUc77ESequXtJyj83iD5p1mRRnHzevYHmQZykJfoT58gNwvVkbH",
  "verifications": [
    { "txHash": "...", "explorerUrl": "https://explorer.solana.com/tx/...?cluster=devnet", "stats": [ /* gols, cartões, escanteios provados nessa transação */ ] }
    // 3 transações no total
  ],
  "note": "Faltas, chutes ao gol, penaltis e impedimentos nao tem statKey documentado..."
}
```

Duas coisas importantes que valem saber antes de ligar isso no design:

1. **Por que 3 transações e não 1**: a versão do Anchor usada no repositório (`0.32.1`)
   serializa a instrução `validateStatV2` num buffer fixo de 1000 bytes — isso é um
   `// TODO: use a tighter buffer` no próprio código da lib, não uma trava do programa
   on-chain. Com as provas de Merkle incluídas, só cabem ~4 estatísticas por chamada; uso
   lotes de 3 pra ter margem. Por isso as 8 estatísticas (gols/cartões/escanteios dos 2
   times) saem como 3 transações, cada uma com seu próprio hash — todas estão listadas em
   `verifications`, e `txHash` no topo é a da última.
2. **"Chutes ao Gol, Pênaltis e Impedimentos" do mockup não têm prova on-chain hoje**: a
   documentação do soccer feed só define `statKey` (1-8) para gols, cartões amarelos,
   cartões vermelhos e escanteios. Não existe encoding documentado pra chutes/pênaltis/
   impedimentos, então não dá pra provar isso criptograficamente do mesmo jeito — só
   incluí no certificado o que realmente está ancorado. Se a TxODDS documentar esses
   `statKey`s no futuro, é só estender a lista `PROVABLE_STAT_KEYS` em
   [tx-on-chain/api/certificate.ts](tx-on-chain/api/certificate.ts).

O campo `network` hoje sempre mostra "Solana Devnet" porque é o que está configurado
(`ANCHOR_PROVIDER_URL`/wallet/programId de teste). Pra virar "Solana Mainnet" de verdade
é só trocar essas variáveis de ambiente para os valores de mainnet e usar uma wallet
financiada de verdade — o código já lê a rede pela env var `SOLANA_NETWORK`.
