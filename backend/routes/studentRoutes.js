const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* GET STUDENTS WITH PAGINATION */

router.get("/students", (req,res)=>{

const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 5;
const offset = (page - 1) * limit;

const sql = "SELECT * FROM students ORDER BY id ASC LIMIT ? OFFSET ?";

db.query(sql,[limit,offset],(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json(result);

});

});


/* GET TOTAL STUDENTS COUNT */

router.get("/students/count",(req,res)=>{

db.query("SELECT COUNT(*) as total FROM students",(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json(result[0]);

});

});


/* ADD STUDENT */

router.post("/students",(req,res)=>{

const {name,roll,email,phone,course} = req.body;

const sql = "INSERT INTO students (name,roll,email,phone,course) VALUES (?,?,?,?,?)";

db.query(sql,[name,roll,email,phone,course],(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json({message:"Student added successfully"});

});

});


/* DELETE STUDENT */

router.delete("/students/:id",(req,res)=>{

const {id} = req.params;

const sql = "DELETE FROM students WHERE id=?";

db.query(sql,[id],(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json({message:"Student deleted"});

});

});


/* UPDATE STUDENT */

router.put("/students/:id",(req,res)=>{

const {id} = req.params;
const {name,roll,email,phone,course} = req.body;

const sql = `
UPDATE students
SET name=?, roll=?, email=?, phone=?, course=?
WHERE id=?
`;

db.query(sql,[name,roll,email,phone,course,id],(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json({message:"Student updated"});

});

});


/* DASHBOARD STATS */

router.get("/stats",(req,res)=>{

db.query("SELECT COUNT(*) as total FROM students",(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json({
students: result[0].total
});

});

});

module.exports = router;