const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const TEMPLATES_DIR = path.join(DATA_DIR, 'templates');
const DB_PATH = path.join(DATA_DIR, 'db.sqlite');

fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    fields TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

function parseTemplate(t) {
  return { ...t, fields: JSON.parse(t.fields) };
}

function getTemplateById(id) {
  const t = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
  return t ? parseTemplate(t) : null;
}

function getTemplatePath(storedFilename) {
  const resolved = path.resolve(TEMPLATES_DIR, storedFilename);
  if (!resolved.startsWith(TEMPLATES_DIR + path.sep)) {
    throw new Error('Invalid stored filename');
  }
  return resolved;
}

module.exports = { db, DATA_DIR, TEMPLATES_DIR, parseTemplate, getTemplateById, getTemplatePath };
