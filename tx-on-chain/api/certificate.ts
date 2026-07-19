// Emite um "certificado": prova, com uma transacao real na Solana, que os dados finais
// da partida (gols, escanteios, cartoes) batem com o que esta ancorado nos Merkle roots
// diarios do programa on-chain. Cada transacao retorna um txHash real e verificavel.
//
// Limitacao conhecida: a versao do @coral-xyz/anchor usada aqui (0.32.1) serializa a
// instrucao validateStatV2 num buffer fixo de 1000 bytes (isso e um TODO no proprio
// codigo da lib, nao um limite do programa on-chain). Com as provas de Merkle inclusas,
// isso da espaco para no maximo ~4 estatisticas por chamada — por seguranca, usamos lotes
// de 3. Por isso as 8 estatisticas provaveis (gols/cartoes/escanteios dos 2 times) saem
// em 3 transacoes, cada uma com seu proprio txHash.

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import { Txoracle } from "../examples/devnet/types/txoracle";
import * as users from "../examples/devnet/common/users";

type ApiProofNode = { hash: number[] | Buffer | Uint8Array; isRightSibling: boolean };
const mapProof = (arr: ApiProofNode[]) =>
  arr.map((n) => ({ hash: Array.from(n.hash), isRightSibling: n.isRightSibling }));

// Unicas estatisticas com encoding on-chain documentado para futebol (ver doc do soccer
// feed: chaves 1-8, prefixo de periodo + chave base). Coisas como chutes ao gol, penaltis
// e impedimentos NAO tem statKey documentado hoje, entao nao podem ser provadas assim.
const PROVABLE_STAT_KEYS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const STAT_LABELS: Record<number, string> = {
  1: "Gols (Participante 1)",
  2: "Gols (Participante 2)",
  3: "Cartoes Amarelos (Participante 1)",
  4: "Cartoes Amarelos (Participante 2)",
  5: "Cartoes Vermelhos (Participante 1)",
  6: "Cartoes Vermelhos (Participante 2)",
  7: "Escanteios (Participante 1)",
  8: "Escanteios (Participante 2)",
};

const BATCH_SIZE = 3;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export type VerifiedBatch = {
  txHash: string;
  explorerUrl: string;
  stats: { key: number; label: string; value: number }[];
};

export type CertificateResult = {
  network: string;
  verifications: VerifiedBatch[];
};

export async function issueCertificate(
  userProgram: Program<Txoracle>,
  fixtureId: number,
  seq: number,
  network: "devnet" | "mainnet-beta"
): Promise<CertificateResult> {
  const clusterParam = network === "mainnet-beta" ? "" : `?cluster=${network}`;
  const verifications: VerifiedBatch[] = [];

  for (const batch of chunk(PROVABLE_STAT_KEYS, BATCH_SIZE)) {
    const url = `/scores/stat-validation?fixtureId=${fixtureId}&seq=${seq}&statKeys=${batch.join(",")}`;
    const { data: val } = await users.apiClient.get<any>(url);

    const targetTs = val.summary.updateStats.minTimestamp;
    const epochDay = Math.floor(targetTs / (24 * 60 * 60 * 1000));

    const [dailyScoresPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("daily_scores_roots"), new BN(epochDay).toBuffer("le", 2)],
      userProgram.programId
    );

    const payload = {
      ts: new BN(targetTs),
      fixtureSummary: {
        fixtureId: new BN(val.summary.fixtureId),
        updateStats: {
          updateCount: val.summary.updateStats.updateCount,
          minTimestamp: new BN(val.summary.updateStats.minTimestamp),
          maxTimestamp: new BN(val.summary.updateStats.maxTimestamp),
        },
        eventsSubTreeRoot: val.summary.eventStatsSubTreeRoot as number[],
      },
      fixtureProof: mapProof(val.subTreeProof),
      mainTreeProof: mapProof(val.mainTreeProof),
      eventStatRoot: val.eventStatRoot as number[],
      stats: val.statsToProve.map((statObj: any, index: number) => ({
        stat: statObj,
        statProof: mapProof(val.statProofs[index]),
      })),
    };

    const discretePredicates = val.statsToProve.map((statObj: any, index: number) => ({
      single: { index, predicate: { threshold: statObj.value, comparison: { equalTo: {} } } },
    }));

    const strategy = { geometricTargets: [], distancePredicate: null, discretePredicates };
    const computeBudgetIx = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 });

    const isValid = await userProgram.methods
      .validateStatV2(payload, strategy)
      .accounts({ dailyScoresMerkleRoots: dailyScoresPda })
      .preInstructions([computeBudgetIx])
      .view();

    if (!isValid) {
      throw new Error(`Validacao on-chain rejeitou o lote de stats [${batch.join(",")}] - dados inconsistentes com o Merkle root ancorado`);
    }

    const txHash = await userProgram.methods
      .validateStatV2(payload, strategy)
      .accounts({ dailyScoresMerkleRoots: dailyScoresPda })
      .preInstructions([computeBudgetIx])
      .rpc();

    verifications.push({
      txHash,
      explorerUrl: `https://explorer.solana.com/tx/${txHash}${clusterParam}`,
      stats: val.statsToProve.map((statObj: any, index: number) => ({
        key: batch[index],
        label: STAT_LABELS[batch[index]],
        value: statObj.value,
      })),
    });
  }

  return {
    network: network === "mainnet-beta" ? "Solana Mainnet" : "Solana Devnet",
    verifications,
  };
}
