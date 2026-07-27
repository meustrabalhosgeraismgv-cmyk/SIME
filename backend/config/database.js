const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || './database/sime.db');

let _db = null;
let _dirty = false;
let _saveTimer = null;

function scheduleSave() {
  if (_saveTimer) return;
  _dirty = true;
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    if (_dirty && _db) {
      const data = _db.export();
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dbPath, Buffer.from(data));
      _dirty = false;
    }
  }, 100);
}

function saveSync() {
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  if (_db) {
    const data = _db.export();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbPath, Buffer.from(data));
    _dirty = false;
  }
}

function createStatement(sql) {
  return {
    run(...bindParams) {
      let params = bindParams;
      if (params.length === 1 && Array.isArray(params[0])) params = params[0];
      const stmt = _db.prepare(sql);
      try {
        if (params.length > 0) stmt.bind(params);
        stmt.step();
        scheduleSave();
        return { changes: _db.getRowsModified(), lastInsertRowid: _db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] || 0 };
      } finally { stmt.free(); }
    },
    get(...bindParams) {
      let params = bindParams;
      if (params.length === 1 && Array.isArray(params[0])) params = params[0];
      const stmt = _db.prepare(sql);
      try {
        if (params.length > 0) stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => { row[c] = vals[i]; });
          return row;
        }
        return undefined;
      } finally { stmt.free(); }
    },
    all(...bindParams) {
      let params = bindParams;
      if (params.length === 1 && Array.isArray(params[0])) params = params[0];
      const stmt = _db.prepare(sql);
      const rows = [];
      try {
        if (params.length > 0) stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => { row[c] = vals[i]; });
          rows.push(row);
        }
        return rows;
      } finally { stmt.free(); }
    }
  };
}

const db = {
  prepare: createStatement,
  exec(sql) {
    _db.exec(sql);
    scheduleSave();
  },
  pragma(pragmaStr) {
    try { _db.run(`PRAGMA ${pragmaStr}`); } catch (e) {}
  },
  close() {
    saveSync();
    if (_db) { _db.close(); _db = null; }
  }
};

process.on('exit', () => saveSync());
process.on('SIGINT', () => { saveSync(); process.exit(); });
process.on('SIGTERM', () => { saveSync(); process.exit(); });

async function initDatabase() {
  const SQL = await initSqlJs();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }
  _db.run("PRAGMA journal_mode = WAL");
  _db.run("PRAGMA foreign_keys = ON");
  return db;
}

db.ready = initDatabase();

module.exports = db;
