import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';

import { getWalletStats, getSmartDiscovery, getSolanaDiscovery, toggleAutoCopy, triggerTest, getPortfolio, toggleAutonomousMode, toggleScalper, toggleSolanaScalper } from './controllers/WalletController';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.get('/', (req, res) => {
    res.send('Smart Money Wallet Tracker API is running');
});

// Import the engine later to ensure IO is initialized if needed
import { initializeTradingEngine } from './services/EngineInstance';

initializeTradingEngine(process.env.ALCHEMY_BASE_WS_URL || '', io);

// Wallet Routes
app.get('/api/portfolio', getPortfolio);
app.get('/api/wallet/:address', getWalletStats);
app.get('/api/discovery', getSmartDiscovery);
app.get('/api/solana-discovery', getSolanaDiscovery);
app.post('/api/autocopy', toggleAutoCopy);
app.post('/api/test-move', triggerTest);
app.post('/api/autonomous-mode', toggleAutonomousMode);
app.post('/api/scalper', toggleScalper);
app.post('/api/solana-scalper', toggleSolanaScalper);

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
