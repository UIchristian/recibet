// Especificacao OpenAPI 3.0 servida pelo Swagger UI em /api-docs.

const teamStatsSchema = {
  type: "object",
  properties: {
    goals: { type: "integer" },
    yellowCards: { type: "integer" },
    redCards: { type: "integer" },
    corners: { type: "integer" },
  },
};

const matchEventSchema = {
  type: "object",
  properties: {
    team: { type: "integer", enum: [1, 2], description: "1 = Participant1, 2 = Participant2" },
    teamId: { type: "integer" },
    teamName: { type: "string" },
    period: {
      type: "string",
      enum: ["NS", "H1", "HT", "H2", "ET1", "HTET", "ET2", "PE", "F", "unknown"],
    },
    clockSeconds: { type: "integer", nullable: true },
    playerId: { type: "integer", nullable: true, description: "So presente em gols e cartoes" },
    playerName: { type: "string", nullable: true },
    detail: { type: "string", nullable: true, description: "Ex: tipo de gol (Shot, Head, ...)" },
  },
};

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "TxLINE Match Data API",
    version: "1.0.0",
    description:
      "API local que expoe fixtures e o resumo de gols, escanteios e cartoes de uma partida, " +
      "usando os dados do feed TxLINE (txodds) ja autenticados on-chain no boot do servidor.",
  },
  servers: [{ url: "http://localhost:3001" }],
  paths: {
    "/api/fixtures": {
      get: {
        summary: "Lista de partidas de uma competicao",
        description: "Tela de selecao de jogo.",
        parameters: [
          {
            name: "competitionId",
            in: "query",
            schema: { type: "string", default: "72" },
            description: "72 = Copa do Mundo",
          },
          {
            name: "startEpochDay",
            in: "query",
            schema: { type: "string", default: "20605" },
            description:
              "Janela de dias (epoch day) a partir de quando listar partidas. Default cobre o " +
              "torneio inteiro (comeca antes de 11/06/2026). Sem esse parametro, o feed da TxLINE " +
              "devolveria so uma janela estreita perto de agora.",
          },
        ],
        responses: {
          "200": {
            description: "Lista de fixtures",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      FixtureId: { type: "integer" },
                      Participant1: { type: "string" },
                      Participant2: { type: "string" },
                      Participant1IsHome: { type: "boolean" },
                      StartTime: { type: "integer", description: "epoch millis" },
                      CompetitionId: { type: "integer" },
                      GameState: { type: "integer", nullable: true },
                      status: {
                        type: "string",
                        enum: ["agendado", "ao_vivo", "encerrado", "cancelado"],
                        description:
                          "Campo derivado pela API (nao vem da TxLINE) a partir de GameState + StartTime. " +
                          "'ao_vivo'/'encerrado' sao estimados por janela de tempo, ja que o fixtures/snapshot " +
                          "nao expoe status ao vivo explicito. Para o estado definitivo, use GET /api/games/{fixtureId}.",
                      },
                    },
                  },
                },
              },
            },
          },
          "500": { description: "Erro ao consultar o feed" },
        },
      },
    },
    "/api/games/{fixtureId}": {
      get: {
        summary: "Gols, escanteios e cartoes de uma partida, por time e por tempo",
        description: "Tela de linha do tempo.",
        parameters: [
          {
            name: "fixtureId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Resumo da partida",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    fixtureId: { type: "integer" },
                    teams: {
                      type: "object",
                      properties: {
                        participant1: {
                          type: "object",
                          properties: { id: { type: "integer" }, name: { type: "string" } },
                        },
                        participant2: {
                          type: "object",
                          properties: { id: { type: "integer" }, name: { type: "string" } },
                        },
                      },
                    },
                    finalScore: {
                      type: "object",
                      nullable: true,
                      properties: {
                        participant1: { type: "integer" },
                        participant2: { type: "integer" },
                      },
                    },
                    goals: { type: "array", items: matchEventSchema },
                    corners: { type: "array", items: matchEventSchema },
                    cards: {
                      type: "array",
                      items: {
                        allOf: [
                          matchEventSchema,
                          { type: "object", properties: { cardType: { type: "string", enum: ["yellow", "red"] } } },
                        ],
                      },
                    },
                    statsByPeriod: {
                      type: "object",
                      description: "Contagens agregadas por periodo (H1, HT, H2, ET1, ET2, PE, Total, ETTotal)",
                      additionalProperties: {
                        type: "object",
                        properties: {
                          participant1: teamStatsSchema,
                          participant2: teamStatsSchema,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "fixtureId invalido" },
          "500": { description: "Erro ao consultar ou interpretar o feed" },
        },
      },
    },
    "/api/games/{fixtureId}/certificate": {
      post: {
        summary: "Emite certificado on-chain (transacao real) da partida",
        description:
          "Tela de certificado. So funciona apos o jogo terminar (action=game_finalised). " +
          "Envia transacoes reais na rede configurada (validateStatV2) provando que gols, " +
          "cartoes e escanteios finais batem com o Merkle root ancorado na Solana. Cada " +
          "chamada gasta uma pequena taxa de rede e demora alguns segundos (varias transacoes).",
        parameters: [
          {
            name: "fixtureId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Certificado emitido",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    receiptId: { type: "string", example: "RECIBO-693552" },
                    match: {
                      type: "object",
                      properties: {
                        fixtureId: { type: "integer" },
                        participant1: { type: "string" },
                        participant2: { type: "string" },
                        startTime: { type: "integer", description: "epoch millis" },
                      },
                    },
                    finalScore: {
                      type: "object",
                      properties: { participant1: { type: "integer" }, participant2: { type: "integer" } },
                    },
                    dataAnchored: { type: "array", items: { type: "string" } },
                    network: { type: "string", example: "Solana Devnet" },
                    issuedAt: { type: "integer", description: "epoch millis" },
                    txHash: { type: "string", description: "Hash da ultima transacao de verificacao" },
                    verifications: {
                      type: "array",
                      description: "Uma entrada por transacao enviada (o payload de prova nao cabe todo numa so)",
                      items: {
                        type: "object",
                        properties: {
                          txHash: { type: "string" },
                          explorerUrl: { type: "string" },
                          stats: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                key: { type: "integer" },
                                label: { type: "string" },
                                value: { type: "integer" },
                              },
                            },
                          },
                        },
                      },
                    },
                    note: { type: "string" },
                  },
                },
              },
            },
          },
          "400": { description: "fixtureId invalido" },
          "409": { description: "Partida ainda nao finalizada" },
          "500": { description: "Erro ao consultar o feed ou enviar a transacao on-chain" },
        },
      },
    },
  },
};
