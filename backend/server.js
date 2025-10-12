// server.js (improved)
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// Config (use env vars in k8s Deployment)
const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || "db";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "password";
const DB_NAME = process.env.DB_NAME || "taskdb";
const BASE_PATH = process.env.BASE_PATH || ""; // set to "/api" if your Ingress does not strip /api
const CORS_ORIGIN = process.env.CORS_ORIGIN || true; // set to e.g. "https://app1.example.com" in production

app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN }));

// Create pool
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Wait for DB to become available (with retry)
async function waitForDb(attemptsLeft = 10, delayMs = 3000) {
  try {
    const promisePool = pool.promise();
    await promisePool.query("SELECT 1");
    console.log("✅ Connected to MySQL DB (pool ready)");
  } catch (err) {
    console.error(`DB connect failed (attempts left: ${attemptsLeft}):`, err.message);
    if (attemptsLeft <= 1) {
      console.error("No more attempts left. Exiting.");
      process.exit(1);
    }
    await new Promise(r => setTimeout(r, delayMs));
    return waitForDb(attemptsLeft - 1, delayMs);
  }
}

// Standardized error responder
function handleError(res, err, code = 500) {
  console.error("Internal error:", err);
  return res.status(code).json({ error: code === 500 ? "Internal server error" : err.message || "Error" });
}

// Router so we can mount at BASE_PATH easily
const router = express.Router();

// Basic health/readiness
router.get("/healthz", (req, res) => res.status(200).json({ status: "ok" }));
router.get("/", (req, res) => res.json({ message: "Task Manager API is running 🚀" }));

// Get all tasks
router.get("/tasks", async (req, res) => {
  try {
    const [rows] = await pool.promise().query("SELECT * FROM tasks");
    res.json(rows);
  } catch (err) {
    return handleError(res, err);
  }
});

// Add a task
router.post("/tasks", async (req, res) => {
  try {
    const title = (req.body && req.body.title) ? String(req.body.title).trim() : "";
    if (!title) return res.status(400).json({ error: "Title is required" });

    const [result] = await pool.promise().query("INSERT INTO tasks (title) VALUES (?)", [title]);
    res.status(201).json({ id: result.insertId, title });
  } catch (err) {
    return handleError(res, err);
  }
});

// Get specific task
router.get("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid task id" });

    const [rows] = await pool.promise().query("SELECT * FROM tasks WHERE id = ?", [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Task not found" });
    res.json(rows[0]);
  } catch (err) {
    return handleError(res, err);
  }
});

// Delete specific task
router.delete("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid task id" });

    const [result] = await pool.promise().query("DELETE FROM tasks WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted successfully", deletedId: id });
  } catch (err) {
    return handleError(res, err);
  }
});

// Mount router at BASE_PATH ('' or '/api' etc.)
if (BASE_PATH && BASE_PATH !== "") {
  app.use(BASE_PATH, router);
  console.log(`API mounted at base path: ${BASE_PATH}`);
} else {
  app.use("/", router);
  console.log("API mounted at root '/'");
}

// Global 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Start only after DB ready
waitForDb().then(() => {
  app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
});

