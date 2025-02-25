const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./scuba_logs.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the scuba_logs database.');
});

// Maak de tabel als die nog niet bestaat
db.run(`
  CREATE TABLE IF NOT EXISTS dives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    depth INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    notes TEXT
  )
`);

module.exports = db;