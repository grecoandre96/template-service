const crypto = require('crypto');

function requireApiKey(req, res, next) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API_KEY not configured on server' });
  }

  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  // Constant-time comparison to prevent timing attacks
  const valid = token.length === apiKey.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(apiKey));

  if (!token || !valid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

function validateId(req, res, next) {
  if (!/^[0-9a-f-]{36}$/.test(req.params.id)) {
    return res.status(400).json({ error: 'ID non valido' });
  }
  next();
}

module.exports = { requireApiKey, validateId };
