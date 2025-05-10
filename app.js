const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
const path = require("path");

const db = new sqlite3.Database("patients.db");

db.serialize(() => {
  db.run(`
    DROP TABLE IF EXISTS patients;
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chartNumber TEXT,
      name TEXT,
      initial TEXT,
      roomNumber TEXT,
      orderIndex INTEGER,
      inTreatment BOOLEAN,
      waitlist BOOLEAN,
      memo TEXT
    )
  `);
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/patients", (req, res) => {
  db.all(
    "SELECT * FROM patients WHERE waitlist IS FALSE ORDER BY orderIndex ASC NULLS LAST, id DESC",
    (err, rows) => {
      if (err) return res.status(500).send("DB 오류");
      res.json(rows);
    }
  );
});

app.get("/api/waitlist", (req, res) => {
  db.all(
    "SELECT * FROM patients WHERE waitlist IS TRUE ORDER BY orderIndex ASC NULLS LAST, id DESC",
    (err, rows) => {
      if (err) return res.status(500).send("DB 오류");
      res.json(rows);
    }
  );
});

app.post("/submit", (req, res) => {
  const { chartNumber, name, memo } = req.body;

  let initial = req.body.initial;
  const initialStr = Array.isArray(initial)
    ? initial.join(", ")
    : initial || "";

  db.get("SELECT MAX(orderIndex) as maxOrder FROM patients", (err, row) => {
    const nextOrder = (row?.maxOrder || 0) + 1;

    db.run(
      `INSERT INTO patients (chartNumber, name, initial, roomNumber, orderIndex, inTreatment, waitlist, memo)
       VALUES (?, ?, ?, ?, ?, ?, ?,?)`,
      [chartNumber, name, initialStr, 0, nextOrder, false, false, memo],
      (err) => {
        if (err) return res.status(500).send("DB 저장 실패");
        res.redirect("/");
      }
    );
  });
});

app.post("/complete", (req, res) => {
  const { id } = req.body;
  db.run(`DELETE FROM patients WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).send("삭제 실패");
    res.redirect("/");
  });
});

app.post("/reorder", (req, res) => {
  const updates = req.body;
  const stmt = db.prepare(`UPDATE patients SET orderIndex = ? WHERE id = ?`);
  db.serialize(() => {
    updates.forEach(({ id, orderIndex }) => {
      stmt.run([orderIndex, id]);
    });
    stmt.finalize();
  });
  res.sendStatus(200);
});

app.post("/treatment", (req, res) => {
  const { id, roomNumber } = req.body;
  db.run(
    `UPDATE patients
        SET inTreatment = TRUE, roomNumber = ?
        WHERE id = ?;`,
    [roomNumber, id],
    (err) => {
      if (err) return res.status(500).send("DB 수정 실패");
      res.redirect("/");
    }
  );
});

app.post("/waitlist", (req, res) => {
  const { id } = req.body;
  db.run(
    `UPDATE patients
          SET waitlist = TRUE
          WHERE id = ?;`,
    [id],
    (err) => {
      if (err) return res.status(500).send("DB 수정 실패");
      res.redirect("/");
    }
  );
});

app.post("/upload", (req, res) => {
  const { id } = req.body;
  db.run(
    `UPDATE patients
          SET waitlist = FALSE
          WHERE id = ?;`,
    [id],
    (err) => {
      if (err) return res.status(500).send("DB 수정 실패");
      res.redirect("/");
    }
  );
});

app.post("/cancle", (req, res) => {
  const { id } = req.body;
  db.run(
    `UPDATE patients
          SET inTreatment = FALSE
          WHERE id = ?;`,
    [id],
    (err) => {
      if (err) return res.status(500).send("DB 수정 실패");
      res.redirect("/");
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
