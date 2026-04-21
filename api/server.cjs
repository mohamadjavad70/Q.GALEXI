const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

// Minimal API endpoints
app.get('/api/memory/stats', (req, res) => {
  res.json({ total: 0, byType: {}, status: 'running', timestamp: Date.now() });
});

app.get('/api/economy/stats', (req, res) => {
  res.json({ totalQTokens: 1000000, circulatingSupply: 500000, emissionRate: 0.05 });
});

app.get('/api/governance/status', (req, res) => {
  res.json({ mode: 'auto', rewardMultiplier: 1.0, lastDecision: Date.now() });
});

app.get('/api/market/offers', (req, res) => {
  res.json({ offers: [], count: 0 });
});

app.listen(PORT, () => {
  console.log(`✅ Q.GALEXI API running on http://localhost:${PORT}`);
  console.log(`   GET /api/memory/stats`);
  console.log(`   GET /api/economy/stats`);
  console.log(`   GET /api/governance/status`);
});
