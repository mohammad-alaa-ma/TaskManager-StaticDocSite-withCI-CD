// server.js
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MySQL connection (with retry)
const dbConfig = {
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "taskdb",
};

let db;
function connectWithRetry(attemptsLeft = 10, delayMs = 3000) {
  db = mysql.createConnection(dbConfig);
  db.connect(err => {
    if (err) {
      console.error(`DB connect failed (attempts left: ${attemptsLeft}):`, err.message);
      if (attemptsLeft <= 1) {
        console.error("No more attempts left. Exiting.");
        process.exit(1);
      }
      setTimeout(() => connectWithRetry(attemptsLeft - 1, delayMs), delayMs);
      return;
    }
    console.log("✅ Connected to MySQL DB");
  });
}

connectWithRetry();

// Routes
app.get("/", (req, res) => {
  res.send("Task Manager API is running 🚀");
});

// Get all tasks
app.get("/tasks", (req, res) => {
  db.query("SELECT * FROM tasks", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Add a task
app.post("/tasks", (req, res) => {
  const { title } = req.body;
  db.query("INSERT INTO tasks (title) VALUES (?)", [title], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ id: result.insertId, title });
  });
});

// Get a specific task by id
app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid task id" });
  }
  db.query("SELECT * FROM tasks WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).send(err);
    if (!results || results.length === 0) return res.status(404).json({ error: "Task not found" });
    res.json(results[0]);
  });
});

// Delete a specific task by id
app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid task id" });
  }
  db.query("DELETE FROM tasks WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ message: "Task deleted successfully", deletedId: id });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));

