import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import createUserHandler from './create-user.js';
import extractApp from './extract.js';
import extractStatementApp from './extract-statement.js';

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 1. Mount create-user (Vercel function)
app.post('/api/create-user', createUserHandler);

// 2. Mount extract apps (Internal Express apps)
// Note: These internal apps already have '/api/extract' etc. defined in their routes
app.use(extractApp);
app.use(extractStatementApp);

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`\x1b[32m%s\x1b[0m`, `🚀 Local API Server running on http://localhost:${PORT}`);
    console.log(`- POST /api/create-user`);
    console.log(`- POST /api/extract`);
    console.log(`- POST /api/extract-statement`);
});
