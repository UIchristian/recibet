import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// Mock TxLINE Feed Data (Euro 2024 & Copa America 2024 Knockouts)
const mockMatches = [
    {
        id: '1',
        homeTeam: 'Espanha',
        awayTeam: 'Inglaterra',
        homeFlag: 'es',
        awayFlag: 'gb-eng',
        date: '14 de Julho, 2024',
        time: '16:00',
        status: 'encerrado',
        score: { home: 2, away: 1 },
        stats: {
            goals: { p1: 2, p2: 1 },
            cards: { p1: 1, p2: 3 },
            corners: { p1: 3, p2: 2 },
            shotsOnTarget: { p1: 5, p2: 3 },
            penalties: { p1: 0, p2: 0 },
            fouls: { p1: 11, p2: 5 },
            offsides: { p1: 2, p2: 0 }
        },
        events: [
            { id: 'e1', time: '47\'', type: 'goal', team: 'home', player: 'Nico Williams', period: 2 },
            { id: 'e2', time: '73\'', type: 'goal', team: 'away', player: 'Cole Palmer', period: 2 },
            { id: 'e3', time: '86\'', type: 'goal', team: 'home', player: 'Mikel Oyarzabal', period: 2 }
        ]
    },
    {
        id: '2',
        homeTeam: 'Argentina',
        awayTeam: 'Colômbia',
        homeFlag: 'ar',
        awayFlag: 'co',
        date: '14 de Julho, 2024',
        time: '21:00',
        status: 'encerrado',
        score: { home: 1, away: 0 },
        stats: {
            goals: { p1: 1, p2: 0 },
            cards: { p1: 2, p2: 2 },
            corners: { p1: 4, p2: 4 },
            shotsOnTarget: { p1: 6, p2: 4 },
            penalties: { p1: 0, p2: 0 },
            fouls: { p1: 8, p2: 18 },
            offsides: { p1: 2, p2: 1 }
        },
        events: [
            { id: 'e4', time: '112\'', type: 'goal', team: 'home', player: 'Lautaro Martínez', period: 3 }
        ]
    },
    {
        id: '3',
        homeTeam: 'Uruguai',
        awayTeam: 'Brasil',
        homeFlag: 'uy',
        awayFlag: 'br',
        date: '6 de Julho, 2024',
        time: '22:00',
        status: 'encerrado',
        score: { home: 0, away: 0 },
        stats: {
            goals: { p1: 0, p2: 0 },
            cards: { p1: 2, p2: 2 },
            corners: { p1: 3, p2: 5 },
            shotsOnTarget: { p1: 1, p2: 3 },
            penalties: { p1: 4, p2: 2 },
            fouls: { p1: 26, p2: 15 },
            offsides: { p1: 2, p2: 1 }
        },
        events: [
            { id: 'e5', time: '74\'', type: 'yellow-card', team: 'home', player: 'Nahitan Nández', period: 2 },
            { id: 'e6', time: '90\'', type: 'var', team: 'home', player: 'VAR: Cartão Vermelho para Nández', period: 2 }
        ]
    },
    {
        id: '4',
        homeTeam: 'Espanha',
        awayTeam: 'Alemanha',
        homeFlag: 'es',
        awayFlag: 'de',
        date: '5 de Julho, 2024',
        time: '13:00',
        status: 'encerrado',
        score: { home: 2, away: 1 },
        stats: {
            goals: { p1: 2, p2: 1 },
            cards: { p1: 6, p2: 5 },
            corners: { p1: 1, p2: 5 },
            shotsOnTarget: { p1: 6, p2: 5 },
            penalties: { p1: 0, p2: 0 },
            fouls: { p1: 17, p2: 22 },
            offsides: { p1: 3, p2: 2 }
        },
        events: [
            { id: 'e7', time: '51\'', type: 'goal', team: 'home', player: 'Dani Olmo', period: 2 },
            { id: 'e8', time: '89\'', type: 'goal', team: 'away', player: 'Florian Wirtz', period: 2 },
            { id: 'e9', time: '119\'', type: 'goal', team: 'home', player: 'Mikel Merino', period: 3 }
        ]
    },
    {
        id: '5',
        homeTeam: 'Portugal',
        awayTeam: 'França',
        homeFlag: 'pt',
        awayFlag: 'fr',
        date: '5 de Julho, 2024',
        time: '16:00',
        status: 'encerrado',
        score: { home: 0, away: 0 },
        stats: {
            goals: { p1: 0, p2: 0 },
            cards: { p1: 1, p2: 1 },
            corners: { p1: 11, p2: 4 },
            shotsOnTarget: { p1: 4, p2: 5 },
            penalties: { p1: 3, p2: 5 },
            fouls: { p1: 8, p2: 13 },
            offsides: { p1: 1, p2: 2 }
        },
        events: [
            { id: 'e10', time: '79\'', type: 'yellow-card', team: 'home', player: 'Palhinha', period: 2 }
        ]
    },
    {
        id: '6',
        homeTeam: 'Holanda',
        awayTeam: 'Inglaterra',
        homeFlag: 'nl',
        awayFlag: 'gb-eng',
        date: '10 de Julho, 2024',
        time: '16:00',
        status: 'encerrado',
        score: { home: 1, away: 2 },
        stats: {
            goals: { p1: 1, p2: 2 },
            cards: { p1: 3, p2: 3 },
            corners: { p1: 3, p2: 0 },
            shotsOnTarget: { p1: 2, p2: 4 },
            penalties: { p1: 0, p2: 1 },
            fouls: { p1: 11, p2: 6 },
            offsides: { p1: 1, p2: 4 }
        },
        events: [
            { id: 'e11', time: '7\'', type: 'goal', team: 'home', player: 'Xavi Simons', period: 1 },
            { id: 'e12', time: '18\'', type: 'goal', team: 'away', player: 'Harry Kane (P)', period: 1 },
            { id: 'e13', time: '90\'', type: 'goal', team: 'away', player: 'Ollie Watkins', period: 2 }
        ]
    },
    {
        id: '7',
        homeTeam: 'Brasil',
        awayTeam: 'Sérvia',
        homeFlag: 'br',
        awayFlag: 'rs',
        date: 'Hoje',
        time: '19:30',
        status: 'encerrado',
        score: { home: 3, away: 1 },
        stats: {
            goals: { p1: 3, p2: 1 },
            cards: { p1: 1, p2: 2 },
            corners: { p1: 6, p2: 3 },
            shotsOnTarget: { p1: 8, p2: 2 },
            penalties: { p1: 0, p2: 0 },
            fouls: { p1: 10, p2: 14 },
            offsides: { p1: 2, p2: 1 }
        },
        events: [
            { id: 'e14', time: '14\'', type: 'goal', team: 'home', player: 'Rodrygo', period: 1 },
            { id: 'e15', time: '41\'', type: 'goal', team: 'away', player: 'Mitrović', period: 1 },
            { id: 'e16', time: '65\'', type: 'goal', team: 'home', player: 'Vinícius Jr.', period: 2 },
            { id: 'e17', time: '88\'', type: 'goal', team: 'home', player: 'Endrick', period: 2 }
        ]
    }
];

function generateMerkleProof(matchId) {
    const dataString = JSON.stringify(mockMatches.find(m => m.id === matchId) || {});
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');
    return {
        commitment: hash,
        proof: ['mock_proof_node_1', 'mock_proof_node_2']
    };
}

app.get('/api/matches', (req, res) => {
    res.json(mockMatches);
});

app.get('/api/matches/:id', (req, res) => {
    const match = mockMatches.find(m => m.id === req.params.id);
    if (!match) return res.status(404).json({ error: 'Not found' });
    
    res.json({
        data: match,
        ...generateMerkleProof(match.id)
    });
});

app.post('/api/verify', (req, res) => {
    const { commitment, data } = req.body;
    const computedHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    const isValid = computedHash === commitment;
    res.json({ valid: isValid });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
