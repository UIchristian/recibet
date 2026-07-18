// API HTTP simples para o frontend consultar: lista de jogos e resumo de gols/escanteios/cartoes.
//
// Rodar a partir da pasta tx-on-chain:
// TOKEN_MINT_ADDRESS=4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG ANCHOR_PROVIDER_URL="https://api.devnet.solana.com" ANCHOR_WALLET="./_keys/testuser-wallet-1.json" npx ts-node api/server.ts

import { Program } from "@coral-xyz/anchor";
import { Txoracle } from "../examples/devnet/types/txoracle";
import TxoracleJson from "../examples/devnet/idl/txoracle.json";
import * as anchor from "@coral-xyz/anchor";
import * as users from "../examples/devnet/common/users";
import { PublicKey } from "@solana/web3.js";
import express from "express";
import cors from "cors";
import axios from "axios";
import swaggerUi from "swagger-ui-express";
import { buildMatchSummary } from "./matchEvents";
import { openApiSpec } from "./openapi";
import { issueCertificate } from "./certificate";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const NETWORK: "devnet" | "mainnet-beta" = process.env.SOLANA_NETWORK === "mainnet-beta" ? "mainnet-beta" : "devnet";

// A duracao normal de uma partida de futebol (90min + intervalo + acrescimos), com folga.
// Usado so para estimar se uma partida agendada provavelmente esta rolando agora - o feed
// nao expoe um status "ao vivo" explicito no fixtures/snapshot, so GameState 1 (agendado)
// ou 6 (cancelado). Para o status real e definitivo, use GET /api/games/:fixtureId.
const TYPICAL_MATCH_DURATION_MS = 3 * 60 * 60 * 1000;

type FixtureStatus = "agendado" | "ao_vivo" | "encerrado" | "cancelado";

// epochDay = floor(epochMillis / 86400000). O torneio de 2026 (competitionId=72) comeca
// em 11/06/2026 (epochDay 20615); usamos uma folga de alguns dias antes disso como default
// para GET /api/fixtures quando o chamador nao informa startEpochDay - sem isso, o feed da
// TxLINE devolve so uma janela estreita perto de "agora" (2 fixtures), escondendo as
// partidas ja encerradas do torneio.
const WORLD_CUP_START_EPOCH_DAY = 20605;

function deriveFixtureStatus(gameState: number, startTime: number, now: number): FixtureStatus {
  if (gameState === 6) return "cancelado";
  if (now < startTime) return "agendado";
  if (now <= startTime + TYPICAL_MATCH_DURATION_MS) return "ao_vivo";
  return "encerrado";
}

async function activateAccess() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program<Txoracle>(TxoracleJson as unknown as Txoracle, provider);
  const connection = provider.connection;

  const mintAddress = process.env.TOKEN_MINT_ADDRESS;
  if (!mintAddress) throw new Error("TOKEN_MINT_ADDRESS is not set!");
  const tokenMint = new PublicKey(mintAddress);

  const walletPath = process.env.ANCHOR_WALLET;
  if (!walletPath) throw new Error("ANCHOR_WALLET is not set!");

  console.log("Ativando acesso on-chain (isso roda uma vez, na inicializacao)...");
  const user = await users.setupUser("API Server", walletPath, tokenMint, connection, program, 1, 4, []);
  console.log("Acesso ativado. Token de API pronto.");

  // Programa vinculado a wallet real (paga as taxas das transacoes de certificado).
  const userWallet = new anchor.Wallet(user.user);
  const userProvider = new anchor.AnchorProvider(connection, userWallet, anchor.AnchorProvider.defaultOptions());
  const userProgram = new Program<Txoracle>(TxoracleJson as unknown as Txoracle, userProvider);

  return { userProgram };
}

async function main() {
  const { userProgram } = await activateAccess();

  const app = express();
  app.use(cors());

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get("/openapi.json", (_req, res) => res.json(openApiSpec));

  // Tela 1 - selecao de jogo: lista de partidas de uma competicao.
  app.get("/api/fixtures", async (req, res) => {
    try {
      const competitionId = req.query.competitionId ?? "72"; // 72 = Copa do Mundo
      const startEpochDay = req.query.startEpochDay ?? String(WORLD_CUP_START_EPOCH_DAY);

      const params: Record<string, string> = {
        competitionId: String(competitionId),
        startEpochDay: String(startEpochDay),
      };

      const response = await users.apiClient.get("/fixtures/snapshot", { params });
      const now = Date.now();
      const fixtures = (response.data as any[]).map((f) => ({
        ...f,
        status: deriveFixtureStatus(f.GameState, f.StartTime, now),
      }));
      res.json(fixtures);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status ?? 500).json({ error: error.response?.data ?? error.message });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  });

  // Tela 2 - linha do tempo: gols, escanteios e cartoes de uma partida, por time e por tempo.
  //
  // Junta /scores/historical (registro completo, mas so fica pronto depois que os eventos
  // sao agrupados em lotes de ~5min) com /scores/snapshot (estado mais recente, inclusive
  // para partidas ainda em andamento) para nunca devolver dado atrasado numa partida ao vivo.
  app.get("/api/games/:fixtureId", async (req, res) => {
    try {
      const fixtureId = Number(req.params.fixtureId);
      if (!Number.isFinite(fixtureId)) {
        return res.status(400).json({ error: "fixtureId invalido" });
      }

      const [historical, snapshot] = await Promise.allSettled([
        users.apiClient.get(`/scores/historical/${fixtureId}`),
        users.apiClient.get(`/scores/snapshot/${fixtureId}`),
      ]);

      const historicalData = historical.status === "fulfilled" ? historical.value.data : undefined;
      const snapshotData = snapshot.status === "fulfilled" ? snapshot.value.data : undefined;

      if (historicalData === undefined && snapshotData === undefined) {
        throw historical.status === "rejected" ? historical.reason : snapshot.status === "rejected" ? snapshot.reason : new Error("Sem dados");
      }

      const summary = buildMatchSummary(fixtureId, historicalData, snapshotData);
      res.json(summary);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status ?? 500).json({ error: error.response?.data ?? error.message });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  });

  // Tela 3 - certificado: emite prova on-chain (transacao real) de que os dados finais
  // da partida batem com o Merkle root ancorado na Solana. So funciona apos o jogo acabar.
  app.post("/api/games/:fixtureId/certificate", async (req, res) => {
    try {
      const fixtureId = Number(req.params.fixtureId);
      if (!Number.isFinite(fixtureId)) {
        return res.status(400).json({ error: "fixtureId invalido" });
      }

      const response = await users.apiClient.get(`/scores/historical/${fixtureId}`);
      const summary = buildMatchSummary(fixtureId, response.data);

      if (!summary.finalScore || summary.finalisedSeq === undefined) {
        return res.status(409).json({
          error: "Partida ainda nao finalizada - certificado so pode ser emitido apos o jogo terminar (action=game_finalised)",
        });
      }

      const { network, verifications } = await issueCertificate(
        userProgram,
        fixtureId,
        summary.finalisedSeq,
        NETWORK
      );

      const receiptId = `RECIBO-${Math.floor(100000 + Math.random() * 900000)}`;

      res.json({
        receiptId,
        match: {
          fixtureId,
          participant1: summary.teams.participant1.name,
          participant2: summary.teams.participant2.name,
          startTime: summary.startTime,
        },
        finalScore: summary.finalScore,
        dataAnchored: verifications.flatMap((v) => v.stats.map((s) => s.label)),
        network,
        issuedAt: Date.now(),
        txHash: verifications[verifications.length - 1].txHash,
        verifications,
        note:
          "Faltas, chutes ao gol, penaltis e impedimentos nao tem statKey documentado no " +
          "encoding on-chain do soccer feed hoje, entao nao entram nessa prova criptografica.",
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status ?? 500).json({ error: error.response?.data ?? error.message });
      } else {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
    console.log(`  GET  /api/fixtures?competitionId=72`);
    console.log(`  GET  /api/games/:fixtureId`);
    console.log(`  POST /api/games/:fixtureId/certificate`);
    console.log(`  Swagger UI em http://localhost:${PORT}/api-docs`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
