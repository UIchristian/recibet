// Cliente da API real (tx-on-chain/api). Substitui o proxy mockado que existia antes.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export type FixtureStatus = "agendado" | "ao_vivo" | "encerrado" | "cancelado";

export interface Fixture {
  FixtureId: number;
  Participant1: string;
  Participant2: string;
  Participant1IsHome: boolean;
  StartTime: number;
  CompetitionId: number;
  GameState: number;
  status: FixtureStatus;
}

export interface MatchEvent {
  team: 1 | 2;
  teamId?: number;
  teamName: string;
  period: string;
  clockSeconds?: number;
  playerId?: number;
  playerName?: string;
  detail?: string;
}

export interface CardEvent extends MatchEvent {
  cardType: "yellow" | "red";
}

export interface TeamPeriodStats {
  goals: number;
  yellowCards: number;
  redCards: number;
  corners: number;
}

export interface MatchSummary {
  fixtureId: number;
  teams: {
    participant1: { id?: number; name: string };
    participant2: { id?: number; name: string };
  };
  finalScore: { participant1: number; participant2: number } | null;
  startTime?: number;
  finalisedSeq?: number;
  goals: MatchEvent[];
  corners: MatchEvent[];
  cards: CardEvent[];
  statsByPeriod: Record<string, { participant1: TeamPeriodStats; participant2: TeamPeriodStats }>;
}

export interface CertificateVerificationBatch {
  txHash: string;
  explorerUrl: string;
  stats: { key: number; label: string; value: number }[];
}

export interface Certificate {
  receiptId: string;
  match: { fixtureId: number; participant1: string; participant2: string; startTime?: number };
  finalScore: { participant1: number; participant2: number };
  dataAnchored: string[];
  network: string;
  issuedAt: number;
  txHash: string;
  verifications: CertificateVerificationBatch[];
  note: string;
}

// Traduz o corpo de erro da API para uma frase legivel, nunca expondo JSON cru pro
// usuario final. `error` pode ser uma string (mensagens proprias da nossa API, ja em
// portugues) ou um objeto repassado de um erro upstream (ex: Axios) - nesses casos
// tentamos achar um campo de mensagem antes de cair num texto generico.
function friendlyErrorMessage(body: any, status: number): string {
  const err = body?.error;
  if (typeof err === "string" && err) return err;
  if (err && typeof err === "object") {
    if (typeof err.message === "string" && err.message) return err.message;
    if (typeof err.error === "string" && err.error) return err.error;
  }
  return `A API respondeu com erro (${status}). Tente novamente em instantes.`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(friendlyErrorMessage(body, res.status));
  }
  return res.json();
}

export function getFixtures(options?: { competitionId?: string; startEpochDay?: number }): Promise<Fixture[]> {
  const params = new URLSearchParams({ competitionId: options?.competitionId ?? "72" });
  if (options?.startEpochDay) params.set("startEpochDay", String(options.startEpochDay));
  return request(`/api/fixtures?${params.toString()}`);
}

// epochDay de ~20 dias atras: janela estreita o suficiente para carregar rapido, mas larga
// o bastante para garantir pelo menos as ultimas ~10 partidas encerradas do calendario atual.
export function recentFallbackEpochDay(): number {
  return Math.floor(Date.now() / 86400000) - 20;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout apos ${ms}ms`)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

// Busca o calendario completo do torneio; se demorar demais (rede lenta/instavel), cai para
// uma janela recente em vez de deixar a tela travada carregando indefinidamente.
export async function getFixturesResilient(
  timeoutMs = 8000
): Promise<{ fixtures: Fixture[]; partial: boolean }> {
  try {
    const fixtures = await withTimeout(getFixtures(), timeoutMs);
    return { fixtures, partial: false };
  } catch {
    const fixtures = await getFixtures({ startEpochDay: recentFallbackEpochDay() });
    return { fixtures, partial: true };
  }
}

export function getGameSummary(fixtureId: string | number): Promise<MatchSummary> {
  return request(`/api/games/${fixtureId}`);
}

export function issueCertificate(fixtureId: string | number): Promise<Certificate> {
  return request(`/api/games/${fixtureId}/certificate`, { method: "POST" });
}

// --- Helpers de apresentacao (a API devolve dados crus, a formatacao fica no front) ---

export function formatMatchDate(startTime?: number): { date: string; time: string } {
  if (!startTime) return { date: "-", time: "-" };
  const d = new Date(startTime);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();

  const date = isToday
    ? "Hoje"
    : d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });

  return { date, time };
}

export function formatClock(clockSeconds?: number): string {
  if (clockSeconds === undefined) return "-";
  return `${Math.floor(clockSeconds / 60)}'`;
}

export const STATUS_LABELS: Record<FixtureStatus, string> = {
  agendado: "Agendado",
  ao_vivo: "Ao Vivo",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

// Mapa best-effort de selecao -> codigo de bandeira (flagcdn.com). Times fora da lista
// simplesmente nao mostram bandeira (o layout ja trata esse caso).
const FLAG_CODES: Record<string, string> = {
  England: "gb-eng", Scotland: "gb-sct", Wales: "gb-wls",
  Argentina: "ar", Brazil: "br", France: "fr", Germany: "de", Spain: "es",
  Portugal: "pt", Netherlands: "nl", Belgium: "be", Italy: "it", Croatia: "hr",
  Uruguay: "uy", Colombia: "co", Mexico: "mx", USA: "us", Canada: "ca",
  Japan: "jp", "South Korea": "kr", Australia: "au", Morocco: "ma", Senegal: "sn",
  Ghana: "gh", Nigeria: "ng", Egypt: "eg", "Ivory Coast": "ci", Cameroon: "cm",
  Switzerland: "ch", Poland: "pl", Denmark: "dk", Sweden: "se", Norway: "no",
  Serbia: "rs", Austria: "at", "Czech Republic": "cz", Ukraine: "ua", Turkey: "tr",
  Ecuador: "ec", Chile: "cl", Peru: "pe", Paraguay: "py", "Costa Rica": "cr",
  Panama: "pa", Qatar: "qa", "Saudi Arabia": "sa", Iran: "ir", Iraq: "iq",
  "New Zealand": "nz", "South Africa": "za", Tunisia: "tn", Algeria: "dz",
  Jordan: "jo", India: "in", China: "cn", Curacao: "cw", Haiti: "ht",
  Bolivia: "bo", Venezuela: "ve", "Bosnia & Herzegovina": "ba",
};

export function flagCode(teamName: string): string | undefined {
  return FLAG_CODES[teamName];
}
