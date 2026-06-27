import fs from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";

const defaultPath = path.join(process.cwd(), "work", "reviewlens.sqlite");
const dbPath = process.env.SQLITE_PATH || defaultPath;

let dbPromise;

function ensureFolder() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

async function openDb() {
  ensureFolder();

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), "node_modules", "sql.js", "dist", file)
  });

  const bytes = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : undefined;
  const db = new SQL.Database(bytes);

  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      input_type TEXT NOT NULL,
      input_preview TEXT NOT NULL,
      analysis_json TEXT NOT NULL
    );
  `);

  persist(db);
  return db;
}

function getDb() {
  if (!dbPromise) {
    dbPromise = openDb();
  }

  return dbPromise;
}

function persist(db) {
  ensureFolder();
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

export async function saveReport({ id, inputType, inputPreview, analysis }) {
  const db = await getDb();

  db.run(
    `INSERT INTO reports (id, created_at, input_type, input_preview, analysis_json)
     VALUES (?, ?, ?, ?, ?)`,
    [id, new Date().toISOString(), inputType, inputPreview, JSON.stringify(analysis)]
  );

  persist(db);
}

export async function getReport(id) {
  const db = await getDb();
  const statement = db.prepare(`
    SELECT id, created_at, input_type, input_preview, analysis_json
    FROM reports
    WHERE id = ?
    LIMIT 1
  `);

  try {
    statement.bind([id]);

    if (!statement.step()) {
      return null;
    }

    const [reportId, createdAt, inputType, inputPreview, analysisJson] = statement.get();

    return {
      id: reportId,
      createdAt,
      inputType,
      inputPreview,
      analysis: JSON.parse(analysisJson)
    };
  } finally {
    statement.free();
  }
}
