const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/templates', require('./routes/templates'));
app.use('/api/generate', require('./routes/generate'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Return 404 JSON for unknown /api routes instead of serving the SPA
app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint non trovato' }));

// SPA fallback for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`DocxFlow running on port ${PORT}`);
  console.log(`API_KEY configurata: ${process.env.API_KEY ? 'SI' : 'NO - imposta la variabile API_KEY'}`);
});
