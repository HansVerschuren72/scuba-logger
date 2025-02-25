const express = require('express');
const db = require('./database.js');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// Haal alle duiken op
app.get('/api/dives', (req, res) => {
  db.all('SELECT * FROM dives ORDER BY date DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});
 
// Voeg een nieuwe duik toe
app.post('/api/dives', (req, res) => {
  const { date, location, depth, duration, notes } = req.body;
  db.run(
    'INSERT INTO dives (date, location, depth, duration, notes) VALUES (?, ?, ?, ?, ?)',
    [date, location, depth, duration, notes],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});


// Duik bewerken
app.put('/api/dives/:id', (req, res) => {
  const { date, location, depth, duration, notes } = req.body;
  const { id } = req.params;
  db.run(
    'UPDATE dives SET date = ?, location = ?, depth = ?, duration = ?, notes = ? WHERE id = ?',
    [date, location, depth, duration, notes, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

// Duik verwijderen
app.delete('/api/dives/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM dives WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

app.get('/api/stats', (req, res) => {
  db.all('SELECT COUNT(*) as count, SUM(duration) as totalTime, MAX(depth) as maxDepth FROM dives', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows[0]);
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});

const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const fs = require('fs');

// CSV export
app.get('/api/dives/export/csv', (req, res) => {
  db.all('SELECT * FROM dives', [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    const fields = ['id', 'date', 'location', 'depth', 'duration', 'notes'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('dives.csv');
    res.send(csv);
  });
});

// PDF export
app.get('/api/dives/export/pdf', (req, res) => {
  db.all('SELECT * FROM dives', [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    const doc = new PDFDocument();
    res.header('Content-Type', 'application/pdf');
    res.attachment('dives.pdf');
    doc.pipe(res);
    doc.fontSize(16).text('Mijn Duiklogboek', { align: 'center' });
    rows.forEach(dive => {
      doc.fontSize(12).text(`\n${dive.date} - ${dive.location}\nDiepte: ${dive.depth}m, Duur: ${dive.duration}min\n${dive.notes || ''}`);
    });
    doc.end();
  });
});


const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });

// Foto toevoegen aan een duik
app.post('/api/dives/:id/photo', upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const photoPath = `/uploads/${req.file.filename}`;
  db.run('UPDATE dives SET photo = ? WHERE id = ?', [photoPath, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ photo: photoPath });
  });
});

// Voeg kolom toe aan database (éénmalig uit te voeren)
// db.run('ALTER TABLE dives ADD COLUMN photo TEXT');
