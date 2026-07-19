// Interpreta o feed de historico de placares (SSE em texto) e extrai gols, escanteios
// e cartoes por time e por tempo de jogo.

// Mapa de StatusId -> periodo, conforme a tabela "Game Phase Encoding" da doc do soccer feed.
const PERIOD_BY_STATUS_ID: Record<number, string> = {
  1: "NS", // Not started
  2: "H1", // First half
  3: "HT", // Halftime
  4: "H2", // Second half
  5: "F", // Ended
  6: "WET", // Waiting for extra time
  7: "ET1",
  8: "HTET",
  9: "ET2",
  10: "FET",
  11: "WPE",
  12: "PE", // Penalty shootout
  13: "FPE",
  100: "F", // game_finalised
};

function periodFromStatusId(statusId: number | undefined): string {
  if (statusId === undefined) return "unknown";
  return PERIOD_BY_STATUS_ID[statusId] ?? "unknown";
}

export type RawScoreEvent = {
  Id: number;
  Seq: number;
  Action: string;
  Ts: number;
  StatusId?: number;
  Confirmed?: boolean;
  Participant?: 1 | 2;
  Participant1Id?: number;
  Participant2Id?: number;
  Clock?: { Running: boolean; Seconds: number };
  Data?: Record<string, any>;
  Stats?: Record<string, number>;
  Lineups?: any[];
  [key: string]: any;
};

// A resposta do endpoint /scores/historical vem no formato de texto de um SSE:
// "data: {...}\nid: N\n\ndata: {...}\nid: N\n\n..."
export function parseHistoricalFeed(raw: string): RawScoreEvent[] {
  const events: RawScoreEvent[] = [];
  for (const block of raw.split("\n\n")) {
    const line = block.split("\n").find((l) => l.startsWith("data: "));
    if (!line) continue;
    try {
      events.push(JSON.parse(line.slice(6)));
    } catch {
      // ignora blocos que nao sao JSON valido (comentarios de keep-alive, etc)
    }
  }
  return events;
}

// /scores/historical devolve texto SSE, /scores/snapshot devolve um array JSON normal.
// Para partidas em andamento, o historical costuma estar atrasado (so e populado apos os
// eventos serem agrupados em lotes de ~5 minutos) enquanto o snapshot reflete o estado
// mais recente. Por isso juntamos as duas fontes e deixa o dedupeById (maior Seq por Id)
// decidir qual versao de cada evento e a mais atual.
function normalizeFeed(raw: string | RawScoreEvent[] | undefined): RawScoreEvent[] {
  if (!raw) return [];
  if (typeof raw === "string") return parseHistoricalFeed(raw);
  return raw;
}

// Cada evento pode chegar mais de uma vez (nao confirmado -> confirmado -> alterado com
// mais detalhe, ou descartado pelo VAR). Mantem so a ultima versao (maior Seq) de cada Id,
// e descarta eventos cuja ultima versao e "action_discarded".
function dedupeById(events: RawScoreEvent[]): RawScoreEvent[] {
  const latestById = new Map<number, RawScoreEvent>();
  for (const ev of events) {
    const current = latestById.get(ev.Id);
    if (!current || ev.Seq > current.Seq) {
      latestById.set(ev.Id, ev);
    }
  }
  return [...latestById.values()].filter((ev) => ev.Action !== "action_discarded");
}

function buildPlayerNameMap(events: RawScoreEvent[]): Map<number, string> {
  const names = new Map<number, string>();
  const lineupsEvent = events.find((ev) => ev.Action === "lineups" && ev.Lineups);
  if (!lineupsEvent) return names;

  for (const team of lineupsEvent.Lineups ?? []) {
    for (const entry of team.lineups ?? []) {
      const player = entry.player;
      if (player?.normativeId && player?.preferredName) {
        names.set(player.normativeId, player.preferredName);
      }
    }
  }
  return names;
}

function buildTeamNameMap(events: RawScoreEvent[]): Map<number, string> {
  const names = new Map<number, string>();
  const lineupsEvent = events.find((ev) => ev.Action === "lineups" && ev.Lineups);
  if (!lineupsEvent) return names;

  for (const team of lineupsEvent.Lineups ?? []) {
    if (team.normativeId && team.preferredName) {
      names.set(team.normativeId, team.preferredName);
    }
  }
  return names;
}

export type MatchEvent = {
  team: 1 | 2;
  teamId: number | undefined;
  teamName: string;
  period: string;
  clockSeconds: number | undefined;
  playerId: number | undefined;
  playerName: string | undefined;
  detail?: string;
};

export type MatchSummary = {
  fixtureId: number;
  teams: {
    participant1: { id: number | undefined; name: string };
    participant2: { id: number | undefined; name: string };
  };
  finalScore: { participant1: number; participant2: number } | null;
  startTime: number | undefined;
  finalisedSeq: number | undefined;
  goals: MatchEvent[];
  corners: MatchEvent[];
  cards: (MatchEvent & { cardType: "yellow" | "red" })[];
  statsByPeriod: Record<string, { participant1: TeamPeriodStats; participant2: TeamPeriodStats }>;
};

type TeamPeriodStats = { goals: number; yellowCards: number; redCards: number; corners: number };

// Prefixos de periodo usados no encoding de Stats (ver documentacao do soccer feed).
const STAT_PERIOD_PREFIX: Record<string, number> = {
  Total: 0,
  H1: 1000,
  HT: 2000,
  H2: 3000,
  ET1: 4000,
  ET2: 5000,
  PE: 6000,
  ETTotal: 7000,
};

function readTeamPeriodStats(stats: Record<string, number>, prefix: number): {
  participant1: TeamPeriodStats;
  participant2: TeamPeriodStats;
} {
  const get = (offset: number) => stats[String(prefix + offset)] ?? 0;
  return {
    participant1: { goals: get(1), yellowCards: get(3), redCards: get(5), corners: get(7) },
    participant2: { goals: get(2), yellowCards: get(4), redCards: get(6), corners: get(8) },
  };
}

export function buildMatchSummary(
  fixtureId: number,
  ...sources: (string | RawScoreEvent[] | undefined)[]
): MatchSummary {
  const allEvents = sources.flatMap(normalizeFeed);
  const deduped = dedupeById(allEvents);

  const playerNames = buildPlayerNameMap(allEvents);
  const teamNames = buildTeamNameMap(allEvents);

  const anyEvent = allEvents[0];
  const participant1Id = anyEvent?.Participant1Id;
  const participant2Id = anyEvent?.Participant2Id;

  const toMatchEvent = (ev: RawScoreEvent): MatchEvent => {
    const teamId = ev.Participant === 1 ? participant1Id : participant2Id;
    return {
      team: ev.Participant ?? 1,
      teamId,
      teamName: (teamId && teamNames.get(teamId)) || `Participant ${ev.Participant}`,
      period: periodFromStatusId(ev.StatusId),
      clockSeconds: ev.Clock?.Seconds,
      playerId: ev.Data?.PlayerId,
      playerName: ev.Data?.PlayerId ? playerNames.get(ev.Data.PlayerId) : undefined,
      detail: ev.Data?.GoalType,
    };
  };

  const goals = deduped.filter((ev) => ev.Action === "goal").map(toMatchEvent);
  const corners = deduped.filter((ev) => ev.Action === "corner").map(toMatchEvent);
  const cards = [
    ...deduped.filter((ev) => ev.Action === "yellow_card").map((ev) => ({ ...toMatchEvent(ev), cardType: "yellow" as const })),
    ...deduped.filter((ev) => ev.Action === "red_card").map((ev) => ({ ...toMatchEvent(ev), cardType: "red" as const })),
  ];

  const finalisedEvent = deduped.find((ev) => ev.Action === "game_finalised");
  const finalScore = finalisedEvent?.Stats
    ? { participant1: finalisedEvent.Stats["1"] ?? 0, participant2: finalisedEvent.Stats["2"] ?? 0 }
    : null;

  const statsSource = finalisedEvent?.Stats;
  const statsByPeriod: MatchSummary["statsByPeriod"] = {};
  if (statsSource) {
    for (const [period, prefix] of Object.entries(STAT_PERIOD_PREFIX)) {
      statsByPeriod[period] = readTeamPeriodStats(statsSource, prefix);
    }
  }

  return {
    fixtureId,
    teams: {
      participant1: { id: participant1Id, name: (participant1Id && teamNames.get(participant1Id)) || "Participant 1" },
      participant2: { id: participant2Id, name: (participant2Id && teamNames.get(participant2Id)) || "Participant 2" },
    },
    finalScore,
    startTime: anyEvent?.StartTime,
    finalisedSeq: finalisedEvent?.Seq,
    goals,
    corners,
    cards,
    statsByPeriod,
  };
}
