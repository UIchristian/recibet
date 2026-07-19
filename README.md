# recibet

Frontend (`app/`) integrado com a API real em `../tx-on-chain/api` (não usa mais dados
fictícios nem o proxy mock em `proxy/`).

## Como rodar

**1) Backend** (API real, na porta 3001) — a partir de `tx-on-chain/`:

```powershell
$env:TOKEN_MINT_ADDRESS = "4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG"
$env:ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com"
$env:ANCHOR_WALLET = "./_keys/testuser-wallet-1.json"
npx ts-node api/server.ts
```

**2) Frontend** — a partir de `recibet/app/`:

```powershell
npm run dev
```

Abre em `http://localhost:5173`. O cliente da API fica em
[app/src/api/txline.ts](app/src/api/txline.ts) — usa `http://localhost:3001` por padrão
(ajustável via `VITE_API_URL` num `.env` em `app/`).

## O que mudou em relação ao protótipo original

- `proxy/` (mock com 7 partidas fixas de 2024) **não é mais usado** — foi substituído
  pela API real, que busca dados da Copa do Mundo 2026 no feed da TxODDS/TxLINE.
- `MatchList` e `MatchDetail` mostram fixtures e placares reais (`GET /api/fixtures`,
  `GET /api/games/:fixtureId`).
- `SealingFlow` ("Selar Recibo") agora chama `POST /api/games/:fixtureId/certificate` de
  verdade antes de cunhar o SBT — o commitment do recibo é o hash de uma transação real
  de verificação on-chain (`validateStatV2`), não mais um SHA256 calculado em cima de
  dados mockados. Só fica disponível depois que a partida termina.
- `PublicVerification` agora confirma a assinatura da transação direto na rede Solana
  (devnet) em vez de sempre aprovar qualquer hash colado.
- Estatísticas mostradas: Gols, Cartões (amarelo+vermelho) e Escanteios — são as únicas
  com prova on-chain documentada hoje. Chutes ao gol, faltas, pênaltis e impedimentos
  não aparecem mais (o mock antigo mostrava esses campos, mas o feed real não expõe
  `statKey` para eles ainda). Mais detalhes em
  [../tx-on-chain/api/README.md](../tx-on-chain/api/README.md).
