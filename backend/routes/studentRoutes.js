const express = require("express");
const router = express.Router();
const db = require("../config/db");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const multer = require("multer");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

/* ------------------------ */
/* GET STUDENTS WITH PAGINATION */
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
router.get("/students/count", (req, res) => {
  db.query("SELECT COUNT(*) as total FROM students", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
});

/* ------------------------ */
/* ADD STUDENT */
router.post("/students", (req, res) => {
  const { name, roll, email, phone, course } = req.body;
  const sql = "INSERT INTO students (name, roll, email, phone, course) VALUES (?,?,?,?,?)";
  db.query(sql, [name, roll, email, phone, course], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Student added successfully" });
  });
});

/* ------------------------ */
/* UPDATE STUDENT */
router.put("/students/:id", (req, res) => {
  const { id } = req.params;
  const { name, roll, email, phone, course } = req.body;
  const sql = "UPDATE students SET name=?, roll=?, email=?, phone=?, course=? WHERE id=?";
  db.query(sql, [name, roll, email, phone, course, id], (err, result) => {
    if(err) return res.status(500).json(err);
    res.json({ message: "Student updated" });
  });
});

/* ------------------------ */
/* DELETE SINGLE STUDENT */
router.delete("/students/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM students WHERE id=?", [id], (err, result) => {
    if(err) return res.status(500).json(err);
    res.json({ message: "Student deleted" });
  });
});

/* ------------------------ */
/* BULK DELETE */
router.post("/students/bulk-delete", (req, res) => {
  const { ids } = req.body;
  if(!ids || !Array.isArray(ids) || ids.length === 0){
    return res.status(400).json({ message: "No student IDs provided" });
  }
  const placeholders = ids.map(() => "?").join(",");
  const sql = `DELETE FROM students WHERE id IN (${placeholders})`;
  db.query(sql, ids, (err, result) => {
    if(err) return res.status(500).json(err);
    res.json({ message: `${result.affectedRows} students deleted` });
  });
});

/* ------------------------ */
/* DASHBOARD STATS */
router.get("/stats", (req, res) => {
  db.query("SELECT COUNT(*) as total FROM students", (err, result) => {
    if(err) return res.status(500).json(err);
    res.json({ students: result[0].total });
  });
});

/* ------------------------ */
/* IMPORT FROM EXCEL */
router.post("/students/import", upload.single("file"), async (req, res) => {
  if(!req.file) return res.status(400).json({ message: "No file uploaded" });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(req.file.path);
  const worksheet = workbook.getWorksheet(1);

  const studentsToInsert = [];
  worksheet.eachRow((row, rowNumber) => {
    if(rowNumber === 1) return; // skip header
    const [name, roll, email, phone, course] = row.values.slice(1);
    studentsToInsert.push([name, roll, email, phone, course]);
  });

  if(studentsToInsert.length === 0){
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: "No student data found in file" });
  }

  const sql = "INSERT INTO students (name, roll, email, phone, course) VALUES ?";
  db.query(sql, [studentsToInsert], (err, result) => {
    fs.unlinkSync(req.file.path);
    if(err) return res.status(500).json(err);
    res.json({ message: "Students imported successfully" });
  });
});

/* ------------------------ */
/* EXPORT EXCEL */
router.get("/students/export", (req, res) => {
  db.query("SELECT * FROM students ORDER BY id ASC", async (err, results) => {
    if(err) return res.status(500).json(err);

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Students");
    ws.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Name", key: "name", width: 30 },
      { header: "Roll", key: "roll", width: 15 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Course", key: "course", width: 20 },
    ];
    results.forEach(r => ws.addRow(r));

    res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition","attachment; filename=students.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  });
});

/* ------------------------ */
/* EXPORT PDF */
router.get("/students/export-pdf", (req, res) => {
  db.query("SELECT * FROM students ORDER BY id ASC", (err, results) => {
    if(err) return res.status(500).json(err);

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition","attachment; filename=students.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Students List", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text("ID",50,doc.y,{continued:true});
    doc.text("Name",90,doc.y,{continued:true});
    doc.text("Roll",230,doc.y,{continued:true});
    doc.text("Email",290,doc.y,{continued:true});
    doc.text("Phone",420,doc.y,{continued:true});
    doc.text("Course",500,doc.y);
    doc.moveDown();

    results.forEach(s=>{
      doc.text(s.id.toString(),50,doc.y,{continued:true});
      doc.text(s.name,90,doc.y,{continued:true});
      doc.text(s.roll,230,doc.y,{continued:true});
      doc.text(s.email,290,doc.y,{continued:true});
      doc.text(s.phone,420,doc.y,{continued:true});
      doc.text(s.course,500,doc.y);
      doc.moveDown();
    });

    doc.end();
  });
});

module.exports = router;