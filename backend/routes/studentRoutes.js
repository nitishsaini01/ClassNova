const express = require("express");
const router = express.Router();
const db = require("../config/db");
const ExcelJS = require("exceljs"); // For Excel export
const PDFDocument = require("pdfkit"); // For PDF export

/* ------------------------ */
/* GET STUDENTS WITH PAGINATION */
/* ------------------------ */
router.get("/students", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  const sql = "SELECT * FROM students ORDER BY id ASC LIMIT ? OFFSET ?";

  db.query(sql, [limit, offset], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

/* ------------------------ */
/* GET TOTAL STUDENTS COUNT */
/* ------------------------ */
router.get("/students/count", (req, res) => {
  db.query("SELECT COUNT(*) as total FROM students", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
});

/* ------------------------ */
/* ADD STUDENT */
/* ------------------------ */
router.post("/students", (req, res) => {
  const { name, roll, email, phone, course } = req.body;
  const sql =
    "INSERT INTO students (name, roll, email, phone, course) VALUES (?,?,?,?,?)";
  db.query(sql, [name, roll, email, phone, course], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Student added successfully" });
  });
});

/* ------------------------ */
/* DELETE SINGLE STUDENT */
/* ------------------------ */
router.delete("/students/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM students WHERE id=?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Student deleted" });
  });
});

/* ------------------------ */
/* UPDATE STUDENT */
/* ------------------------ */
router.put("/students/:id", (req, res) => {
  const { id } = req.params;
  const { name, roll, email, phone, course } = req.body;
  const sql = `
    UPDATE students
    SET name=?, roll=?, email=?, phone=?, course=?
    WHERE id=?
  `;
  db.query(sql, [name, roll, email, phone, course, id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Student updated" });
  });
});

/* ------------------------ */
/* DASHBOARD STATS */
/* ------------------------ */
router.get("/stats", (req, res) => {
  db.query("SELECT COUNT(*) as total FROM students", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ students: result[0].total });
  });
});

/* ------------------------ */
/* Export Students to Excel */
/* ------------------------ */
router.get("/students/export", (req, res) => {
  const sql = "SELECT * FROM students ORDER BY id ASC";
  db.query(sql, async (err, results) => {
    if (err) return res.status(500).json(err);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Students");

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Name", key: "name", width: 30 },
      { header: "Roll No", key: "roll", width: 15 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Course", key: "course", width: 20 },
    ];

    results.forEach((student) => {
      worksheet.addRow({
        id: student.id,
        name: student.name,
        roll: student.roll,
        email: student.email,
        phone: student.phone,
        course: student.course,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=students.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  });
});

/* ------------------------ */
/* Export Students to PDF */
/* ------------------------ */
router.get("/students/export-pdf", (req, res) => {
  const sql = "SELECT * FROM students ORDER BY id ASC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=students.pdf"
    );

    doc.pipe(res);

    doc.fontSize(18).text("Students List", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text("ID", 50, doc.y, { continued: true });
    doc.text("Name", 90, doc.y, { continued: true });
    doc.text("Roll", 230, doc.y, { continued: true });
    doc.text("Email", 290, doc.y, { continued: true });
    doc.text("Phone", 420, doc.y, { continued: true });
    doc.text("Course", 500, doc.y);
    doc.moveDown();

    results.forEach((student) => {
      doc.text(student.id.toString(), 50, doc.y, { continued: true });
      doc.text(student.name, 90, doc.y, { continued: true });
      doc.text(student.roll, 230, doc.y, { continued: true });
      doc.text(student.email, 290, doc.y, { continued: true });
      doc.text(student.phone, 420, doc.y, { continued: true });
      doc.text(student.course, 500, doc.y);
      doc.moveDown();
    });

    doc.end();
  });
});

/* ------------------------ */
/* BULK DELETE STUDENTS */
/* ------------------------ */
router.post("/students/bulk-delete", (req, res) => {
  const { ids } = req.body; // array of student ids
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "No student IDs provided" });
  }

  const placeholders = ids.map(() => "?").join(",");
  const sql = `DELETE FROM students WHERE id IN (${placeholders})`;

  db.query(sql, ids, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: `${result.affectedRows} students deleted` });
  });
});

module.exports = router;