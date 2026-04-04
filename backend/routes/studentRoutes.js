const express = require("express");
const router = express.Router();
const db = require("../config/db");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const auth = require("../middleware/authMiddleware");

/* -------------------- MULTER SETUP -------------------- */
const uploadImage = multer({
  dest: "uploads/profile_pics/",
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) cb(new Error("Only images allowed"), false);
    else cb(null, true);
  },
});

const uploadExcel = multer({ dest: "uploads/" });

/* -------------------- GET STUDENTS -------------------- */
router.get("/students", auth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.toLowerCase() : "";
  const sortKey = req.query.sortKey || "id";
  const sortOrder = req.query.sortOrder === "desc" ? "DESC" : "ASC";

  let sql = "SELECT * FROM students";
  let params = [];

  if (search) {
    sql +=
      " WHERE LOWER(name) LIKE ? OR LOWER(roll) LIKE ? OR LOWER(email) LIKE ? OR LOWER(phone) LIKE ? OR LOWER(course) LIKE ?";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY ${sortKey} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    result.forEach(r => {
      if (!r.profile_pic) r.profile_pic = "uploads/default.png";
      else r.profile_pic = r.profile_pic.replace(/\\/g, "/");
    });
    res.json(result);
  });
});

/* -------------------- GET TOTAL COUNT -------------------- */
router.get("/students/count", auth, (req, res) => {
  const search = req.query.search ? req.query.search.toLowerCase() : "";
  let sql = "SELECT COUNT(*) as total FROM students";
  let params = [];

  if (search) {
    sql +=
      " WHERE LOWER(name) LIKE ? OR LOWER(roll) LIKE ? OR LOWER(email) LIKE ? OR LOWER(phone) LIKE ? OR LOWER(course) LIKE ?";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
});

/* -------------------- ADD STUDENT -------------------- */
router.post("/students", auth, (req, res) => {
  const { name, roll, email, phone, course } = req.body;
  const sql = "INSERT INTO students (name, roll, email, phone, course) VALUES (?,?,?,?,?)";
  db.query(sql, [name, roll, email, phone, course], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Student added successfully", id: result.insertId });
  });
});

/* -------------------- UPDATE STUDENT -------------------- */
router.put("/students/:id", auth, (req, res) => {
  const { id } = req.params;
  const { name, roll, email, phone, course } = req.body;
  const sql = "UPDATE students SET name=?, roll=?, email=?, phone=?, course=? WHERE id=?";
  db.query(sql, [name, roll, email, phone, course, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Student updated" });
  });
});

/* -------------------- DELETE SINGLE STUDENT -------------------- */
router.delete("/students/:id", auth, (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM students WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Student deleted" });
  });
});

/* -------------------- BULK DELETE -------------------- */
router.post("/students/bulk-delete", auth, (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "No student IDs provided" });

  const placeholders = ids.map(() => "?").join(",");
  const sql = `DELETE FROM students WHERE id IN (${placeholders})`;
  db.query(sql, ids, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: `${result.affectedRows} students deleted` });
  });
});

/* -------------------- DASHBOARD STATS -------------------- */
router.get("/stats", auth, (req, res) => {
  db.query("SELECT COUNT(*) as total FROM students", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ students: result[0].total });
  });
});

/* -------------------- IMPORT EXCEL -------------------- */
router.post("/students/import", auth, uploadExcel.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(req.file.path);
  const worksheet = workbook.getWorksheet(1);

  const studentsToInsert = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const [name, roll, email, phone, course] = row.values.slice(1);
    studentsToInsert.push([name, roll, email, phone, course]);
  });

  if (studentsToInsert.length === 0) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: "No student data found" });
  }

  const sql = "INSERT INTO students (name, roll, email, phone, course) VALUES ?";
  db.query(sql, [studentsToInsert], (err) => {
    fs.unlinkSync(req.file.path);
    if (err) return res.status(500).json(err);
    res.json({ message: "Students imported successfully" });
  });
});

/* -------------------- EXPORT EXCEL -------------------- */
router.get("/students/export", auth, (req, res) => {
  db.query("SELECT * FROM students ORDER BY id ASC", async (err, results) => {
    if (err) return res.status(500).json(err);

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

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=students.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  });
});

/* -------------------- EXPORT PDF -------------------- */
router.get("/students/export-pdf", auth, (req, res) => {
  db.query("SELECT * FROM students ORDER BY id ASC", (err, results) => {
    if (err) return res.status(500).json(err);

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=students.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Students List", { align: "center" });
    doc.moveDown();
    results.forEach(s => {
      doc.fontSize(12).text(`${s.id} | ${s.name} | ${s.roll} | ${s.email} | ${s.phone} | ${s.course}`);
    });

    doc.end();
  });
});

/* -------------------- UPLOAD PROFILE PICTURE -------------------- */
router.post("/students/:id/upload", auth, uploadImage.single("profile_pic"), (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const newPath = req.file.path;
  db.query("UPDATE students SET profile_pic=? WHERE id=?", [newPath, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Profile picture uploaded", path: newPath.replace(/\\/g, "/") });
  });
});

/* -------------------- COURSE STATS FOR CHART -------------------- */

router.get("/stats/courses", auth, (req,res)=>{

const sql = `
SELECT course, COUNT(*) as count
FROM students
GROUP BY course
`;

db.query(sql,(err,result)=>{

if(err) return res.status(500).json(err);

res.json(result);

});

});


/* -------------------- STUDENTS PER COURSE -------------------- */

router.get("/stats/courses", auth, (req,res)=>{

const sql = `
SELECT course, COUNT(*) as count
FROM students
GROUP BY course
`;

db.query(sql,(err,result)=>{

if(err) return res.status(500).json(err);

res.json(result);

});

});


/* -------------------- STUDENT GROWTH -------------------- */

router.get("/stats/growth", auth, (req,res)=>{

const sql = `
SELECT DATE_FORMAT(created_at,'%Y-%m') as month,
COUNT(*) as count
FROM students
GROUP BY month
ORDER BY month
`;

db.query(sql,(err,result)=>{

if(err) return res.status(500).json(err);

res.json(result);

});

});


module.exports = router;