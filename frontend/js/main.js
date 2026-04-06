if (!localStorage.getItem("loggedIn")) {
  window.location.href = "login.html";
}

console.log("JS Loaded");

document.addEventListener("DOMContentLoaded", () => {

const studentTableBody = document.getElementById("studentTableBody");

if (studentTableBody) {
  initStudents();
}

const totalStudentsEl = document.getElementById("totalStudents");
if (totalStudentsEl) {
  loadStats();
}

window.logout = function () {
  localStorage.removeItem("loggedIn");
  window.location.href = "login.html";
};

/* ---------------- STUDENT PAGE ---------------- */

async function initStudents() {

const form = document.getElementById("studentForm");
const table = document.getElementById("studentTableBody");
const searchInput = document.getElementById("search");
const resetSearch = document.getElementById("resetSearch");
const pagination = document.getElementById("pagination");

let students = [];
let currentPage = 1;
const rowsPerPage = 5;

async function loadStudents(page = 1) {

currentPage = page;

const res = await fetch(`/api/students?page=${page}&limit=${rowsPerPage}`);

students = await res.json();

displayStudents(students);

loadPagination();

}

function displayStudents(data) {

table.innerHTML = "";

data.forEach(student => {

table.innerHTML += `
<tr>

<td>${student.id}</td>

<td>
<img src="${student.profile_pic ? '/' + student.profile_pic.replace(/\\\\/g,'/') : 'uploads/default.png'}"
class="profile-pic">
</td>

<td>${student.name}</td>

<td>${student.roll}</td>

<td>${student.email}</td>

<td>${student.phone}</td>

<td>${student.course}</td>

<td>

<button onclick="editStudent(${student.id},'${student.name}','${student.roll}','${student.email}','${student.phone}','${student.course}')">Edit</button>

<button onclick="deleteStudent(${student.id})">Delete</button>

</td>

</tr>
`;

});

}

async function loadPagination() {

const res = await fetch("/api/students/count");

const data = await res.json();

const pageCount = Math.ceil(data.total / rowsPerPage);

pagination.innerHTML = "";

for (let i = 1; i <= pageCount; i++) {

const btn = document.createElement("button");

btn.innerText = i;

btn.onclick = () => loadStudents(i);

pagination.appendChild(btn);

}

}

form.addEventListener("submit", async (e) => {

e.preventDefault();

const id = document.getElementById("studentId").value;

const student = {

name: document.getElementById("name").value,

roll: document.getElementById("roll").value,

email: document.getElementById("email").value,

phone: document.getElementById("phone").value,

course: document.getElementById("course").value

};

if (id) {

await fetch(`/api/students/${id}`, {

method: "PUT",

headers: { "Content-Type": "application/json" },

body: JSON.stringify(student)

});

} else {

await fetch("/api/students", {

method: "POST",

headers: { "Content-Type": "application/json" },

body: JSON.stringify(student)

});

}

form.reset();

document.getElementById("studentId").value = "";

loadStudents(currentPage);

});

window.deleteStudent = async function (id) {

if (confirm("Delete student?")) {

await fetch(`/api/students/${id}`, { method: "DELETE" });

loadStudents(currentPage);

}

};

window.editStudent = function (id, name, roll, email, phone, course) {

document.getElementById("studentId").value = id;

document.getElementById("name").value = name;

document.getElementById("roll").value = roll;

document.getElementById("email").value = email;

document.getElementById("phone").value = phone;

document.getElementById("course").value = course;

window.scrollTo({ top: 0, behavior: "smooth" });

};

searchInput.addEventListener("input", () => {

const keyword = searchInput.value.toLowerCase();

const filtered = students.filter(s =>

s.name.toLowerCase().includes(keyword) ||

s.roll.toLowerCase().includes(keyword) ||

s.email.toLowerCase().includes(keyword) ||

s.phone.toLowerCase().includes(keyword) ||

s.course.toLowerCase().includes(keyword)

);

displayStudents(filtered);

});

resetSearch.addEventListener("click", () => {

searchInput.value = "";

displayStudents(students);

});

loadStudents();

}

/* ---------------- DASHBOARD ---------------- */

async function loadStats() {

const res = await fetch("/api/stats");

const data = await res.json();

const totalStudents = document.getElementById("totalStudents");

if (totalStudents) {
  totalStudents.innerText = data.students;
}

loadCourseChart();
loadGrowthChart();

}

/* -------- Students Per Course Chart -------- */

async function loadCourseChart() {

const canvas = document.getElementById("courseChart");

if (!canvas) return;

const res = await fetch("/api/stats/courses");

const data = await res.json();

const labels = data.map(d => d.course);

const values = data.map(d => d.count);

new Chart(canvas, {

type: "bar",

data: {

labels: labels,

datasets: [{

label: "Students Per Course",

data: values,

backgroundColor: "#3498db"

}]

}

});

}

/* -------- Student Growth Chart -------- */

async function loadGrowthChart() {

const canvas = document.getElementById("growthChart");

if (!canvas) return;

const res = await fetch("/api/stats/growth");

const data = await res.json();

const labels = data.map(d => d.month);

const values = data.map(d => d.count);

new Chart(canvas, {

type: "line",

data: {

labels: labels,

datasets: [{

label: "Student Growth",

data: values,

borderColor: "#2ecc71",

fill: false

}]

}

});

}

});