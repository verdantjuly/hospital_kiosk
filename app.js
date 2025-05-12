const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 3000;
const path = require("path");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use((req, res, next) => {
  if (req.headers["x-http-method-override"]) {
    req.method = req.headers["x-http-method-override"].toUpperCase();
  }
  next();
});

const db = new sqlite3.Database("patients.db");

// 초기 DB 생성 및 초기 데이터 삽입
db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS patients`);
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

  db.run(`
    CREATE TABLE IF NOT EXISTS initials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT,
      color TEXT,
      category TEXT
    )
  `);

  db.get(`SELECT COUNT(*) AS count FROM initials`, (err, row) => {
    if (err) {
      console.error("초기 initials 테이블 카운트 실패:", err);
      return;
    }

    if (row.count === 0) {
      console.log("initials 테이블에 데이터가 없어 초기 데이터를 삽입합니다.");
      db.run(`INSERT INTO initials (symbol, color, category) VALUES 
          ('★', '#cd68ff', '원장님'),
          ('E', '#e43636', '상태'),
          ('D', '#2d4f94', '상태'),
          ('P', '#5fff3b', '상태'),
          ('R', '#ff6f00', '상태'),
          ('PID중', '#00f7ff', '기타'),
          ('약처방만', '#ffeb38', '기타'),
          ('외출', '#f8c0ff', '기타')
        `);
    } else {
      console.log(
        "initials 테이블에 이미 데이터가 있습니다. 초기 데이터 삽입 생략."
      );
    }
  });
});

// Helper: initials ID 배열을 객체 배열로 변환
function enrichPatientWithInitials(patient, initialsMap) {
  const ids = (patient.initial || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  patient.initial = ids.map((id) => {
    const item = initialsMap[id];
    return item
      ? { id, symbol: item.symbol, color: item.color }
      : { id, symbol: "", color: "#ccc" };
  });

  return patient;
}

// GET: 치료중 환자 목록
app.get("/api/patients", (req, res) => {
  db.all("SELECT * FROM initials", (err, initials) => {
    if (err) return res.status(500).send("초기 로딩 실패");

    const initialMap = {};
    initials.forEach((i) => (initialMap[i.id] = i));

    db.all(
      "SELECT * FROM patients WHERE waitlist IS FALSE ORDER BY orderIndex ASC NULLS LAST, id DESC",
      (err, rows) => {
        if (err) return res.status(500).send("DB 오류");

        const enriched = rows.map((row) =>
          enrichPatientWithInitials(row, initialMap)
        );

        res.json(enriched);
      }
    );
  });
});

// GET: 대기 환자 목록
app.get("/api/waitlist", (req, res) => {
  db.all("SELECT * FROM initials", (err, initials) => {
    if (err) return res.status(500).send("초기 로딩 실패");

    const initialMap = {};
    initials.forEach((i) => (initialMap[i.id] = i));

    db.all(
      "SELECT * FROM patients WHERE waitlist IS TRUE ORDER BY orderIndex ASC NULLS LAST, id DESC",
      (err, rows) => {
        if (err) return res.status(500).send("DB 오류");

        const enriched = rows.map((row) =>
          enrichPatientWithInitials(row, initialMap)
        );

        res.json(enriched);
      }
    );
  });
});

// POST: 환자 등록
app.post("/submit", (req, res) => {
  const { chartNumber, name, memo } = req.body;
  const initial = req.body.initial;

  const initialStr = Array.isArray(initial)
    ? initial.join(",")
    : typeof initial === "string"
    ? initial
    : "";

  db.get("SELECT MAX(orderIndex) as maxOrder FROM patients", (err, row) => {
    const nextOrder = (row?.maxOrder || 0) + 1;

    db.run(
      `INSERT INTO patients (chartNumber, name, initial, roomNumber, orderIndex, inTreatment, waitlist, memo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [chartNumber, name, initialStr, 0, nextOrder, false, false, memo],
      (err) => {
        if (err) return res.status(500).send("DB 저장 실패");
        res.redirect("/");
      }
    );
  });
});

// POST: 치료 완료
app.post("/complete", (req, res) => {
  const { id } = req.body;
  db.run(`DELETE FROM patients WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).send("삭제 실패");
    res.redirect("/");
  });
});

// POST: 순서 변경
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

// POST: 치료 시작
app.post("/treatment", (req, res) => {
  const { id, roomNumber } = req.body;
  db.run(
    `UPDATE patients SET inTreatment = TRUE, roomNumber = ? WHERE id = ?`,
    [roomNumber, id],
    (err) => {
      if (err) return res.status(500).send("DB 수정 실패");
      res.redirect("/");
    }
  );
});

// POST: 대기 상태로 이동
app.post("/waitlist", (req, res) => {
  const { id } = req.body;
  db.run(`UPDATE patients SET waitlist = TRUE WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).send("DB 수정 실패");
    res.redirect("/");
  });
});

// POST: 대기에서 치료 목록으로 복귀
app.post("/upload", (req, res) => {
  const { id } = req.body;
  db.run(`UPDATE patients SET waitlist = FALSE WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).send("DB 수정 실패");
    res.redirect("/");
  });
});

// POST: 치료 취소
app.post("/cancle", (req, res) => {
  const { id } = req.body;
  db.run(
    `UPDATE patients SET inTreatment = FALSE WHERE id = ?`,
    [id],
    (err) => {
      if (err) return res.status(500).send("DB 수정 실패");
      res.redirect("/");
    }
  );
});

// POST: 새로운 initial 추가
app.post("/api/initials", (req, res) => {
  const { symbol, color, category } = req.body;
  db.run(
    `INSERT INTO initials (symbol, color, category) VALUES (?, ?, ?)`,
    [symbol, color, category],
    function (err) {
      if (err) return res.status(500).send("DB 저장 실패");
      res.status(201).json({ id: this.lastID, symbol, color, category });
    }
  );
});

// GET: 모든 initials 조회
app.get("/api/initials", (req, res) => {
  db.all(`SELECT * FROM initials`, (err, rows) => {
    if (err) return res.status(500).send("DB 읽기 실패");
    res.json(rows);
  });
});

// DELETE: initial 삭제
app.delete("/api/initials/:id", (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM initials WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).send("DB 삭제 실패");
    if (this.changes === 0) return res.status(404).send("해당 ID 없음");
    res.sendStatus(204);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
