console.log("JS Loaded");

const form = document.getElementById("studentForm");
const table = document.getElementById("studentTable");
const searchInput = document.getElementById("search");
const resetSearch = document.getElementById("resetSearch");
const pagination = document.getElementById("pagination");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");

let students = [];
let currentPage = 1;
let currentSort = { key: null, order: "asc" };
const rowsPerPage = 5;

/* ------------------------ */
/* LOAD STUDENTS */
async function loadStudents(page = 1){
  currentPage = page;
  const res = await fetch(`/api/students?page=${page}&limit=${rowsPerPage}`);
  students = await res.json();
  applySort();
  displayStudents(students);
  loadPagination();
  loadStats();
}

/* ------------------------ */
/* DISPLAY STUDENTS */
function displayStudents(data){
  table.innerHTML = "";
  data.forEach(student => {
    table.innerHTML += `
      <tr>
        <td><input type="checkbox" class="selectStudent" data-id="${student.id}"></td>
        <td>${student.id}</td>
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

  const selectAll = document.getElementById("selectAll");
  const checkboxes = document.querySelectorAll(".selectStudent");
  if(selectAll){
    selectAll.checked = false;
    selectAll.addEventListener("change", () => {
      checkboxes.forEach(cb => cb.checked = selectAll.checked);
    });
  }
}

/* ------------------------ */
/* SORTING */
document.querySelectorAll("thead th[data-key]").forEach(th=>{
  th.addEventListener("click", ()=>{
    const key = th.dataset.key;
    if(currentSort.key === key){
      currentSort.order = currentSort.order === "asc" ? "desc" : "asc";
    } else {
      currentSort.key = key;
      currentSort.order = "asc";
    }
    applySort();
    displayStudents(students);
    updateSortIcons();
  });
});

function applySort(){
  if(!currentSort.key) return;
  students.sort((a,b)=>{
    let valA = a[currentSort.key].toString().toLowerCase();
    let valB = b[currentSort.key].toString().toLowerCase();
    if(valA < valB) return currentSort.order === "asc" ? -1 : 1;
    if(valA > valB) return currentSort.order === "asc" ? 1 : -1;
    return 0;
  });
}

function updateSortIcons(){
  document.querySelectorAll("thead th").forEach(th=>{
    th.classList.remove("sort-asc","sort-desc");
    if(th.dataset.key === currentSort.key){
      th.classList.add(currentSort.order === "asc" ? "sort-asc" : "sort-desc");
    }
  });
}

/* ------------------------ */
/* PAGINATION */
async function loadPagination(){
  const res = await fetch("/api/students/count");
  const data = await res.json();
  const pageCount = Math.ceil(data.total / rowsPerPage);
  pagination.innerHTML = "";

  const firstBtn = document.createElement("button");
  firstBtn.innerText = "<<";
  firstBtn.onclick = () => loadStudents(1);
  pagination.appendChild(firstBtn);

  for(let i = 1; i <= pageCount; i++){
    const btn = document.createElement("button");
    btn.innerText = i;
    if(i === currentPage) btn.classList.add("current");
    btn.onclick = () => loadStudents(i);
    pagination.appendChild(btn);
  }

  const lastBtn = document.createElement("button");
  lastBtn.innerText = ">>";
  lastBtn.onclick = () => loadStudents(pageCount);
  pagination.appendChild(lastBtn);
}

/* ------------------------ */
/* ADD / UPDATE STUDENT */
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
  } else {
    await fetch("/api/students",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(student)
    });
  }

  form.reset();
  document.getElementById("studentId").value = "";
  loadStudents(currentPage);
});

/* ------------------------ */
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

/* ------------------------ */
/* DELETE SINGLE STUDENT */
async function deleteStudent(id){
  if(confirm("Are you sure you want to delete this student?")){
    await fetch(`/api/students/${id}`,{ method:"DELETE" });
    loadStudents(currentPage);
  }
}

/* ------------------------ */
/* BULK DELETE */
deleteSelectedBtn.addEventListener("click", async () => {
  const selected = Array.from(document.querySelectorAll(".selectStudent"))
                        .filter(cb => cb.checked)
                        .map(cb => cb.dataset.id);
  if(selected.length === 0){ alert("Select at least one student."); return; }
  if(!confirm(`Delete ${selected.length} students?`)) return;

  await fetch("/api/students/bulk-delete", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ids: selected})
  });
  loadStudents(currentPage);
});

/* ------------------------ */
/* LIVE SEARCH */
searchInput.addEventListener("input", ()=>filterStudents());
resetSearch.addEventListener("click", ()=>{
  searchInput.value = "";
  filterStudents();
});

function filterStudents(){
  const keyword = searchInput.value.toLowerCase();
  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(keyword) ||
    s.roll.toLowerCase().includes(keyword) ||
    s.email.toLowerCase().includes(keyword) ||
    s.phone.toLowerCase().includes(keyword) ||
    s.course.toLowerCase().includes(keyword)
  );
  displayStudents(filtered);
}

/* ------------------------ */
/* IMPORT STUDENTS FROM EXCEL */
importBtn.addEventListener("click", async ()=>{
  if(importFile.files.length === 0){ alert("Select an Excel file."); return; }

  const formData = new FormData();
  formData.append("file", importFile.files[0]);

  const res = await fetch("/api/students/import", { method:"POST", body: formData });
  const data = await res.json();
  alert(data.message);
  importFile.value = "";
  loadStudents(currentPage);
});

/* ------------------------ */
/* LOAD STATS */
async function loadStats(){
  const res = await fetch("/api/stats");
  const data = await res.json();
  document.getElementById("totalStudents").innerText = data.students;
}

/* ------------------------ */
/* INITIAL LOAD */
loadStudents();