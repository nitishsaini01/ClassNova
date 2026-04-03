console.log("JS Loaded");

const form = document.getElementById("studentForm");
const table = document.getElementById("studentTable");
const searchInput = document.getElementById("search");
const pagination = document.getElementById("pagination");

let students = [];
let currentPage = 1;
const rowsPerPage = 5;

/* LOAD STUDENTS */

async function loadStudents(page = 1){

currentPage = page;

const res = await fetch(`/api/students?page=${page}&limit=${rowsPerPage}`);
students = await res.json();

displayStudents();
loadPagination();

}

/* DISPLAY STUDENTS */

function displayStudents(){

table.innerHTML = "";

students.forEach(student => {

table.innerHTML += `
<tr>
<td>${student.id}</td>
<td>${student.name}</td>
<td>${student.roll}</td>
<td>${student.email}</td>
<td>${student.phone}</td>
<td>${student.course}</td>
<td>
<button onclick="editStudent(${student.id},'${student.name}','${student.roll}','${student.email}','${student.phone}','${student.course}')">Edit</button>
<button class="delete" onclick="deleteStudent(${student.id})">Delete</button>
</td>
</tr>
`;

});

}

/* PAGINATION */

async function loadPagination(){

const res = await fetch("/api/students/count");
const data = await res.json();

const pageCount = Math.ceil(data.total / rowsPerPage);

pagination.innerHTML = "";

for(let i = 1; i <= pageCount; i++){

const btn = document.createElement("button");

btn.innerText = i;

if(i === currentPage){
btn.style.background = "#2ecc71";
}

btn.onclick = () => loadStudents(i);

pagination.appendChild(btn);

}

}

/* ADD OR UPDATE STUDENT */

form.addEventListener("submit", async (e)=>{

e.preventDefault();

const id = document.getElementById("studentId").value;

const student = {
name: document.getElementById("name").value,
roll: document.getElementById("roll").value,
email: document.getElementById("email").value,
phone: document.getElementById("phone").value,
course: document.getElementById("course").value
};

if(id){

await fetch(`/api/students/${id}`,{
method:"PUT",
headers:{"Content-Type":"application/json"},
body: JSON.stringify(student)
});

}else{

await fetch("/api/students",{
method:"POST",
headers:{"Content-Type":"application/json"},
body: JSON.stringify(student)
});

}

form.reset();
document.getElementById("studentId").value = "";

loadStudents(currentPage);
loadStats();

});

/* EDIT STUDENT */

function editStudent(id,name,roll,email,phone,course){

document.getElementById("studentId").value = id;
document.getElementById("name").value = name;
document.getElementById("roll").value = roll;
document.getElementById("email").value = email;
document.getElementById("phone").value = phone;
document.getElementById("course").value = course;

window.scrollTo({top:0,behavior:"smooth"});

}

/* DELETE STUDENT */

async function deleteStudent(id){

const confirmDelete = confirm("Are you sure you want to delete this student?");

if(confirmDelete){

await fetch(`/api/students/${id}`,{
method:"DELETE"
});

loadStudents(currentPage);
loadStats();

}

}

/* SEARCH */

searchInput.addEventListener("input", ()=>{

const keyword = searchInput.value.toLowerCase();

const filtered = students.filter(student =>
student.name.toLowerCase().includes(keyword) ||
student.roll.toLowerCase().includes(keyword)
);

table.innerHTML = "";

filtered.forEach(student => {

table.innerHTML += `
<tr>
<td>${student.id}</td>
<td>${student.name}</td>
<td>${student.roll}</td>
<td>${student.email}</td>
<td>${student.phone}</td>
<td>${student.course}</td>
<td>
<button onclick="editStudent(${student.id},'${student.name}','${student.roll}','${student.email}','${student.phone}','${student.course}')">Edit</button>
<button class="delete" onclick="deleteStudent(${student.id})">Delete</button>
</td>
</tr>
`;

});

});

/* LOAD STATS */

async function loadStats(){

const res = await fetch("/api/stats");
const data = await res.json();

document.getElementById("totalStudents").innerText = data.students;

}

/* INITIAL LOAD */

loadStudents();
loadStats();