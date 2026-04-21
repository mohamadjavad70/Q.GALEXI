const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

app.get('/api/memory/stats', (req, res) => {
  res.json({ total: 0, byType: {}, status: 'running' });
});

app.get('/api/economy/stats', (req, res) => {
  res.json({ totalQTokens: 1000000, circulatingSupply: 500000 });
});

app.get('/api/governance/status', (req, res) => {
  res.json({ mode: 'auto', rewardMultiplier: 1.0 });
});

app.get('/api/market/stats', (req, res) => {
  res.json({ totalOffers: 0, totalTransactions: 0 });
});

app.get('/api/q/rates', (req, res) => {
  res.json({ USD: 0.05, EUR: 0.046, IRR: 2100 });
});

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
  console.log(`   GET /api/health`);
  console.log(`   GET /api/memory/stats`);
  console.log(`   GET /api/economy/stats`);
  console.log(`   GET /api/governance/status`);
  console.log(`   GET /api/market/stats`);
  console.log(`   GET /api/q/rates`);
});
