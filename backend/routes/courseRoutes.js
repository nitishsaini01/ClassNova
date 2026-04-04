const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* GET COURSES */

router.get("/",(req,res)=>{

db.query("SELECT * FROM courses",(err,result)=>{

if(err) return res.status(500).json(err);

res.json(result);

});

});

/* ADD COURSE */

router.post("/",(req,res)=>{

const {name} = req.body;

db.query(
"INSERT INTO courses (name) VALUES (?)",
[name],
(err,result)=>{

if(err) return res.status(500).json(err);

res.json({message:"Course added"});

});

});

/* DELETE COURSE */

router.delete("/:id",(req,res)=>{

db.query(
"DELETE FROM courses WHERE id=?",
[req.params.id],
(err)=>{

if(err) return res.status(500).json(err);

res.json({message:"Course deleted"});

});

});

module.exports = router;