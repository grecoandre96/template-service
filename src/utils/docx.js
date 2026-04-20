const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const InspectModule = require('docxtemplater/js/inspect-module.js');

function loadDocxZip(filePath) {
  const content = fs.readFileSync(filePath, 'binary');
  return new PizZip(content);
}

function detectFields(filePath) {
  const zip = loadDocxZip(filePath);
  const iModule = InspectModule();
  new Docxtemplater(zip, { modules: [iModule], paragraphLoop: true, linebreaks: true });
  return Object.keys(iModule.getAllTags());
}

module.exports = { loadDocxZip, detectFields };
