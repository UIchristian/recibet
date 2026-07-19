// Consultas basicas de teste: ativa o acesso (se necessario) e faz 3 chamadas simples a API.
// Ajuste FIXTURE_ID / COMPETITION_ID abaixo para testar outras partidas.
//
// Rodar a partir da pasta tx-on-chain:
// TOKEN_MINT_ADDRESS=4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG ANCHOR_PROVIDER_URL="https://api.devnet.solana.com" ANCHOR_WALLET="./_keys/testuser-wallet-1.json" npx ts-node examples/devnet/scripts/basic_queries.ts

import { Program } from "@coral-xyz/anchor";
import { Txoracle } from "../types/txoracle";
import TxoracleJson from "../idl/txoracle.json";
import * as anchor from "@coral-xyz/anchor";
import * as users from "../common/users";
import { PublicKey } from "@solana/web3.js";
import axios from "axios";

// --- Ajuste aqui para testar outras consultas ---
const COMPETITION_ID = 72; // 72 = Copa do Mundo
const START_EPOCH_DAY = 20624;
const FIXTURE_ID = 18175981; // France v Sweden (tem GameState: 3, ou seja, ja tem dados)

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program<Txoracle>(TxoracleJson as unknown as Txoracle, provider);
  const connection = provider.connection;

  const mintAddress = process.env.TOKEN_MINT_ADDRESS;
  if (!mintAddress) throw new Error("TOKEN_MINT_ADDRESS is not set!");
  const tokenMint = new PublicKey(mintAddress);

  const walletPath = process.env.ANCHOR_WALLET;
  if (!walletPath) throw new Error("ANCHOR_WALLET is not set!");

  // Assina/ativa o acesso (necessario antes de qualquer consulta)
  await users.setupUser("Trader A", walletPath, tokenMint, connection, program, 1, 4, []);

  // 1) Lista de partidas (fixtures) da competicao
  const fixtures = await users.apiClient.get(
    `/fixtures/snapshot?competitionId=${COMPETITION_ID}&startEpochDay=${START_EPOCH_DAY}`
  );
  console.log("\n--- Fixtures ---");
  console.log(fixtures.data);

  // 2) Odds da partida escolhida
  const odds = await users.apiClient.get(`/odds/snapshot/${FIXTURE_ID}`);
  console.log("\n--- Odds ---");
  console.log(odds.data);

  // 3) Placar da partida escolhida
  const scores = await users.apiClient.get(`/scores/snapshot/${FIXTURE_ID}`);
  console.log("\n--- Scores ---");
  console.log(scores.data);
}

main().then(
  () => process.exit(0),
  (err) => {
    if (axios.isAxiosError(err)) {
      console.error("Request Failed:", err.response?.data || err.message);
    } else {
      console.error("Error:", err);
    }
    process.exit(1);
  }
);
