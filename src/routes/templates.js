const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db, TEMPLATES_DIR, parseTemplate, getTemplateById } = require('../db');
const { detectFields } = require('../utils/docx');
const { requireApiKey, validateId } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: TEMPLATES_DIR,
  filename: (req, file, cb) => cb(null, `${uuidv4()}.docx`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const isDocx = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      || file.originalname.toLowerCase().endsWith('.docx');
    isDocx ? cb(null, true) : cb(new Error('Solo file .docx sono accettati'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/', requireApiKey, (req, res) => {
  const templates = db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all();
  res.json(templates.map(parseTemplate));
});

router.post('/', requireApiKey, upload.single('template'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });

  const id = path.basename(req.file.filename, '.docx');
  const name = (req.body.name || path.basename(req.file.originalname, '.docx')).trim();

  let fields;
  try {
    fields = detectFields(req.file.path);
  } catch (err) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'File non valido o corrotto' });
  }

  try {
    db.prepare(`
      INSERT INTO templates (id, name, original_filename, stored_filename, fields)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, req.file.originalname, req.file.filename, JSON.stringify(fields));
  } catch (err) {
    console.error('DB insert failed:', err);
    fs.unlinkSync(req.file.path);
    return res.status(500).json({ error: 'Errore interno nel salvare il template' });
  }

  const created_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
  res.status(201).json({ id, name, original_filename: req.file.originalname, stored_filename: req.file.filename, fields, created_at });
});

router.patch('/:id', requireApiKey, validateId, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Campo "name" obbligatorio' });

  const result = db.prepare('UPDATE templates SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Template non trovato' });

  res.json(getTemplateById(req.params.id));
});

router.delete('/:id', requireApiKey, validateId, (req, res) => {
  const template = getTemplateById(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template non trovato' });

  try {
    fs.unlinkSync(path.join(TEMPLATES_DIR, template.stored_filename));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('File delete error:', err);
  }

  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
