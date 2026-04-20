const express = require('express');
const Docxtemplater = require('docxtemplater');
const { getTemplateById, getTemplatePath } = require('../db');
const { loadDocxZip } = require('../utils/docx');
const { requireApiKey, validateId } = require('../middleware/auth');

const router = express.Router();

router.post('/:id', requireApiKey, validateId, (req, res) => {
  const template = getTemplateById(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template non trovato' });

  const data = req.body;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ error: 'Body deve essere un oggetto JSON con i campi da riempire' });
  }

  let buffer;
  try {
    const zip = loadDocxZip(getTemplatePath(template.stored_filename));
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '', // campi non passati restano vuoti senza errore
    });
    doc.render(data);
    buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(500).json({ error: 'File template non trovato sul server' });
    console.error('Template render error:', err);
    return res.status(500).json({ error: 'Errore nella generazione del documento' });
  }

  const outputName = `${template.name.replace(/[^a-z0-9_\-]/gi, '_')}_compilato.docx`;
  res.attachment(outputName);
  res.send(buffer);
});

module.exports = router;
