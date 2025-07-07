// Global Variables
let loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')) || null;
let authToken = localStorage.getItem('authToken') || null;

// DOM Elements - Initialize as null
let studentNameElement = null;
let studentProfileElement = null;
let courseListElement = null;
let resultListElement = null;
let cgpaDisplayElement = null;

// API Base URL
const API_BASE_URL = 'http://localhost:5001/api';

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API call failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// --- Common UI Functions ---
function showModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
        modalElement.style.display = 'flex';
        console.log(`Modal '${modalId}' opened.`);
        document.addEventListener('keydown', handleEscapeKey);
    } else {
        console.error(`Error: Modal element with ID '${modalId}' not found.`);
    }
}

function closeModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
        modalElement.style.display = 'none';
        console.log(`Modal '${modalId}' closed.`);
        document.removeEventListener('keydown', handleEscapeKey);
    } else {
        console.error(`Error: Modal element with ID '${modalId}' not found for closing.`);
    }
}

function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        console.log('Escape key pressed.');
        if (document.getElementById('studentModal').style.display === 'flex') {
            closeStudentModal();
        } else if (document.getElementById('courseModal').style.display === 'flex') {
            closeCourseModal();
        } else if (document.getElementById('resultViewModal').style.display === 'flex') {
            closeResultViewModal();
        } else if (document.getElementById('confirmModal').style.display === 'flex') {
            closeConfirmModal();
        }
    }
}

// --- Logout Function ---
function logout() {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('authToken');
    loggedInUser = null;
    authToken = null;
    alert('Logged out successfully!');
    window.location.href = 'login.html';
    console.log('Logout initiated.');
}

// --- Student Management (Admin Only) ---
async function renderStudents() {
    const studentListDiv = document.getElementById('studentList');
    if (!studentListDiv) { console.error("studentList div not found."); return; }

    try {
        const response = await apiCall('/users');
        const students = response.data.filter(user => user.role === 'student');

    studentListDiv.innerHTML = '';
    if (students.length === 0) {
        studentListDiv.innerHTML = '<p>No students added yet.</p>';
        console.log('No students to render.');
        return;
    }

    students.forEach(student => {
        const studentDiv = document.createElement('div');
            studentDiv.className = 'admin-list-item';
        studentDiv.innerHTML = `
                <span>${student.name} (${student.studentId || 'N/A'})<br><small>${student.department || 'N/A'}</small></span>
                <div class="admin-action-buttons">
                    <button onclick="editStudent('${student._id}')" class="btn btn-primary">Edit</button>
                    <button onclick="confirmDelete('student', '${student._id}')" class="btn btn-danger">Delete</button>
                </div>
        `;
        studentListDiv.appendChild(studentDiv);
    });
    populateStudentSelect();
    console.log('Students rendered.');
    } catch (error) {
        console.error('Error loading students:', error);
        studentListDiv.innerHTML = '<p>Error loading students.</p>';
    }
}

async function openStudentModal(studentId = '') {
    const studentModal = document.getElementById('studentModal');
    const studentForm = document.getElementById('studentForm');
    const studentPasswordInput = document.getElementById('studentPassword');
    const studentIdInput = document.getElementById('studentId');
    const studentNameInput = document.getElementById('studentName');
    const studentEmailInput = document.getElementById('studentEmail');
    const studentSpecializationSelect = document.getElementById('studentSpecialization');
    const studentSemesterInput = document.getElementById('studentSemester');
    const studentRollNoInput = document.getElementById('studentRollNo');

    if (!studentModal || !studentForm || !studentPasswordInput || !studentIdInput || !studentNameInput || !studentEmailInput || !studentSpecializationSelect || !studentSemesterInput || !studentRollNoInput) {
        console.error("One or more student modal elements not found.");
        return;
    }

    studentForm.reset();

    if (studentId) {
        try {
            const response = await apiCall(`/users/${studentId}`);
            const student = response.data;
            
            studentIdInput.value = student._id;
            studentNameInput.value = student.name;
            studentEmailInput.value = student.email;
            studentRollNoInput.value = student.studentId || '';
            studentPasswordInput.removeAttribute('required');
            studentSpecializationSelect.value = student.department || '';
            studentSemesterInput.value = student.semester || '';
            studentModal.querySelector('h2').textContent = 'Edit Student';
            console.log(`Opening student modal for editing: ${student.name}`);
        } catch (error) {
            console.error('Error loading student:', error);
            alert('Error loading student data.');
            return;
        }
    } else {
        studentIdInput.value = '';
        studentRollNoInput.value = '';
        studentModal.querySelector('h2').textContent = 'Add New Student';
        studentPasswordInput.setAttribute('required', 'required');
        studentSemesterInput.value = '';
        console.log('Opening student modal for adding new student.');
    }
    showModal('studentModal');
}

function closeStudentModal() {
    closeModal('studentModal');
    document.getElementById('studentPassword').removeAttribute('required');
    console.log('Student modal closed.');
}

async function handleStudentSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('studentId').value;
    const name = document.getElementById('studentName').value;
    const email = document.getElementById('studentEmail').value;
    const rollNo = document.getElementById('studentRollNo').value;
    const password = document.getElementById('studentPassword').value;
    const specialization = document.getElementById('studentSpecialization').value;
    const semester = document.getElementById('studentSemester').value;

    try {
    if (id) {
            // Update existing student
            const updateData = {
                name,
                email,
                studentId: rollNo,
                department: specialization
            };
            if (password) updateData.password = password;
            if (semester) updateData.semester = Number(semester);

            await apiCall(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            alert('Student updated successfully!');
            console.log(`Student ${name} updated.`);
    } else {
            // Create new student
            await apiCall('/users/register', {
                method: 'POST',
                body: JSON.stringify({
            name,
            email,
                    studentId: rollNo,
            password,
                    role: 'student',
                    department: specialization,
                    semester: semester ? Number(semester) : undefined
                })
            });
        alert('Student added successfully!');
        console.log(`New student ${name} added.`);
    }
        
    renderStudents();
    closeStudentModal();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}
async function deleteStudent(id) {
    try {
        await apiCall(`/users/${id}`, { method: 'DELETE' });
        alert('Student deleted successfully!');
    console.log(`Student with ID ${id} deleted.`);
        renderStudents();
    } catch (error) {
        alert('Error deleting student: ' + error.message);
    }
}

async function editStudent(id) {
    await openStudentModal(id);
}

// --- Course Management ---
async function renderCourses() {
    const courseListDiv = document.getElementById('courseList');
    if (!courseListDiv) { console.error("courseList div not found."); return; }

    try {
        const response = await apiCall('/courses');
        const courses = response.data;

    courseListDiv.innerHTML = '';
    if (courses.length === 0) {
        courseListDiv.innerHTML = '<p>No courses added yet.</p>';
        console.log('No courses to render.');
        return;
    }

    courses.forEach(course => {
        const courseDiv = document.createElement('div');
        courseDiv.className = 'list-item';
        courseDiv.innerHTML = `
                <span>${course.courseName} (${course.courseCode}) - ${course.credits} credits</span>
            <div class="action-buttons">
                    <button onclick="openCourseModal('${course._id}')" class="btn btn-primary">Edit</button>
                    <button onclick="confirmDelete('course', '${course._id}')" class="btn btn-danger">Delete</button>
            </div>
        `;
        courseListDiv.appendChild(courseDiv);
    });
    populateCourseSelect();
    console.log('Courses rendered.');
    } catch (error) {
        console.error('Error loading courses:', error);
        courseListDiv.innerHTML = '<p>Error loading courses.</p>';
    }
}

async function openCourseModal(courseId = '') {
    const courseModal = document.getElementById('courseModal');
    const courseForm = document.getElementById('courseForm');
    const courseIdInput = document.getElementById('courseId');
    const courseNameInput = document.getElementById('courseName');
    const courseCodeInput = document.getElementById('courseCode');
    const courseCreditsInput = document.getElementById('courseCredits');

    if (!courseModal || !courseForm || !courseIdInput || !courseNameInput || !courseCodeInput || !courseCreditsInput) {
        console.error("One or more course modal elements not found.");
        return;
    }

    courseForm.reset();

    if (courseId) {
        try {
            const response = await apiCall(`/courses/${courseId}`);
            const course = response.data;
            
            courseIdInput.value = course._id;
            courseNameInput.value = course.courseName;
            courseCodeInput.value = course.courseCode;
            courseCreditsInput.value = course.credits;
            courseModal.querySelector('h2').textContent = 'Edit Course';
            console.log(`Opening course modal for editing: ${course.courseName}`);
        } catch (error) {
            console.error('Error loading course:', error);
            alert('Error loading course data.');
            return;
        }
    } else {
        courseIdInput.value = '';
        courseModal.querySelector('h2').textContent = 'Add New Course';
        console.log('Opening course modal for adding new course.');
    }
    showModal('courseModal');
}

function closeCourseModal() {
    closeModal('courseModal');
    console.log('Course modal closed.');
}

async function handleCourseSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('courseId').value;
    const name = document.getElementById('courseName').value;
    const code = document.getElementById('courseCode').value;
    const credits = document.getElementById('courseCredits').value; // This should match the HTML

    try {
    if (id) {
            // Update existing course
            await apiCall(`/courses/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    courseName: name,
                    courseCode: code,
                    credits: parseInt(credits)
                })
            });
            alert('Course updated successfully!');
            console.log(`Course ${name} updated.`);
    } else {
            // Create new course
            await apiCall('/courses', {
                method: 'POST',
                body: JSON.stringify({
                    courseName: name,
                    courseCode: code,
                    credits: parseInt(credits)
                })
            });
        alert('Course added successfully!');
        console.log(`New course ${name} added.`);
    }
        
    renderCourses();
    closeCourseModal();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteCourse(id) {
    try {
        await apiCall(`/courses/${id}`, { method: 'DELETE' });
        alert('Course deleted successfully!');
    console.log(`Course with ID ${id} deleted.`);
        renderCourses();
    } catch (error) {
        alert('Error deleting course: ' + error.message);
    }
}

async function populateCourseSelect() {
    const courseSelect = document.getElementById('courseSelect');
    if (!courseSelect) return;

    try {
        const response = await apiCall('/courses');
        const courses = response.data;
        
    courseSelect.innerHTML = '<option value="">Select Course</option>';
    courses.forEach(course => {
            courseSelect.innerHTML += `<option value="${course._id}">${course.courseName} (${course.courseCode})</option>`;
    });
    } catch (error) {
        console.error('Error loading courses for select:', error);
    }
}

async function populateStudentSelect() {
    const studentSelect = document.getElementById('studentSelect');
    if (!studentSelect) return;

    try {
        const response = await apiCall('/users');
        const students = response.data.filter(user => user.role === 'student');
        
    studentSelect.innerHTML = '<option value="">Select Student</option>';
    students.forEach(student => {
            studentSelect.innerHTML += `<option value="${student._id}">${student.name} (${student.email})</option>`;
        });
    } catch (error) {
        console.error('Error loading students for select:', error);
    }
}

// --- Result Management ---
async function submitResult() {
    const studentSelect = document.getElementById('studentSelect');
    const courseSelect = document.getElementById('courseSelect');
    const marksInput = document.getElementById('marks'); // Changed from scoreInput to marks

    if (!studentSelect.value || !courseSelect.value || !marksInput.value) {
        alert('Please fill in all fields.');
        return;
    }

    try {
        await apiCall('/results', {
            method: 'POST',
            body: JSON.stringify({
                userId: studentSelect.value,
                courseId: courseSelect.value,
                score: parseInt(marksInput.value)
            })
        });
        
        alert('Result added successfully!');
        console.log('Result added successfully.');
        
        // Clear form
        studentSelect.value = '';
        courseSelect.value = '';
        marksInput.value = '';
        
        // Refresh results table
    renderResultsTable();
    } catch (error) {
        alert('Error adding result: ' + error.message);
    }
}

async function renderResultsTable() {
    const resultsTableBody = document.getElementById('resultsTableBody');
    if (!resultsTableBody) return;

    try {
        const response = await apiCall('/results');
        const results = response.data;

        resultsTableBody.innerHTML = '';
    if (results.length === 0) {
            resultsTableBody.innerHTML = '<tr><td colspan="5">No results available.</td></tr>';
        return;
    }

        results.forEach(result => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${result.userId?.name || 'N/A'}</td>
                <td>${result.userId?.studentId || 'N/A'}</td>
                <td>${result.courseId?.courseName || 'N/A'}</td>
                <td>${result.score}</td>
                <td>${result.grade}</td>
                <td>
                    <button onclick="editResult('${result._id}')" class="btn btn-primary">Edit</button>
                    <button onclick="deleteResult('${result._id}')" class="btn btn-danger">Delete</button>
                    </td>
            `;
            resultsTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading results:', error);
        resultsTableBody.innerHTML = '<tr><td colspan="5">Error loading results.</td></tr>';
    }
}

async function editResult(resultId) {
    try {
        const response = await apiCall(`/results/${resultId}`);
        const result = response.data;
        
        // Populate form for editing
        document.getElementById('studentSelect').value = result.userId._id;
        document.getElementById('courseSelect').value = result.courseId._id;
        document.getElementById('marks').value = result.score; // Changed from scoreInput to marks
        
        // Change submit button to update
        const submitBtn = document.querySelector('button[onclick="submitResult()"]');
        submitBtn.textContent = 'Update Result';
        submitBtn.onclick = () => updateResult(resultId);
        
    } catch (error) {
        alert('Error loading result: ' + error.message);
    }
}

async function updateResult(resultId) {
    const studentSelect = document.getElementById('studentSelect');
    const courseSelect = document.getElementById('courseSelect');
    const marksInput = document.getElementById('marks'); // Changed from scoreInput to marks

    try {
        await apiCall(`/results/${resultId}`, {
            method: 'PUT',
            body: JSON.stringify({
                userId: studentSelect.value,
                courseId: courseSelect.value,
                score: parseInt(marksInput.value)
            })
        });
        
        alert('Result updated successfully!');
        
        // Reset form
        studentSelect.value = '';
        courseSelect.value = '';
        marksInput.value = '';
        
        // Reset submit button
        const submitBtn = document.querySelector('button[onclick="updateResult()"]');
        submitBtn.textContent = 'Add Result';
        submitBtn.onclick = submitResult;
        
        renderResultsTable();
    } catch (error) {
        alert('Error updating result: ' + error.message);
    }
}

async function deleteResult(resultId) {
    if (confirm('Are you sure you want to delete this result?')) {
        try {
            await apiCall(`/results/${resultId}`, { method: 'DELETE' });
            alert('Result deleted successfully!');
            renderResultsTable();
        } catch (error) {
            alert('Error deleting result: ' + error.message);
        }
    }
}

// --- Student Dashboard Functions ---
async function loadStudentProfile() {
    if (!studentNameElement || !studentProfileElement) return;

    try {
        const response = await apiCall('/users/profile');
        const user = response.data;
        
        studentNameElement.textContent = user.name;
        studentProfileElement.innerHTML = `
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Department:</strong> ${user.department || 'N/A'}</p>
            <p><strong>Semester:</strong> ${user.semester || 'N/A'}</p>
        `;
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function loadRegisteredCourses() {
    if (!courseListElement) return;

    try {
        const response = await apiCall('/courses');
        const allCourses = response.data;
        
        // Filter courses where the student is registered
        const registeredCourses = allCourses.filter(course => 
            course.registeredStudents?.includes(loggedInUser.id)
        );

        courseListElement.innerHTML = registeredCourses.length ?
            registeredCourses.map(course => `
                <div class="course-item">
                    <h3>${course.courseName}</h3>
                    <p>Code: ${course.courseCode}</p>
                    <p>Credits: ${course.credits}</p>
                    <button onclick="dropCourse('${course._id}')" class="btn btn-danger">Drop Course</button>
                </div>
            `).join('') :
            '<p>No courses registered yet.</p>';
    } catch (error) {
        console.error('Error loading registered courses:', error);
        courseListElement.innerHTML = '<p>Error loading courses.</p>';
    }
}

async function loadStudentResults() {
    if (!resultListElement || !cgpaDisplayElement) return;

    try {
        const response = await apiCall(`/results/student/${loggedInUser.id}`);
        const data = response.data;
        const results = data.results;
        const cgpa = data.cgpa;

        if (results.length) {
            resultListElement.innerHTML = results.map(result => `
                <div class="result-item">
                    <h3>${result.courseId?.courseName || 'N/A'}</h3>
                    <p>Grade: ${result.grade}</p>
                    <p>Points: ${result.gradePoint}</p>
                    <p>Date: ${result.dateAchieved ? new Date(result.dateAchieved).toLocaleDateString() : 'N/A'}</p>
            </div>
            `).join('');

            cgpaDisplayElement.innerHTML = `<p><strong>CGPA: ${cgpa}</strong></p>`;
    } else {
            resultListElement.innerHTML = '<p>No results available.</p>';
            cgpaDisplayElement.innerHTML = '';
        }
    } catch (error) {
        console.error('Error loading results:', error);
        resultListElement.innerHTML = '<p>Error loading results.</p>';
    }
}

async function registerForCourse(courseId) {
    try {
        await apiCall(`/courses/${courseId}/register`, { method: 'POST' });
        alert('Course registered successfully!');
        loadRegisteredCourses();
    } catch (error) {
        alert('Error registering for course: ' + error.message);
    }
}

async function dropCourse(courseId) {
    if (confirm('Are you sure you want to drop this course?')) {
        try {
            await apiCall(`/courses/${courseId}/register`, { method: 'DELETE' });
            alert('Course dropped successfully!');
            loadRegisteredCourses();
        } catch (error) {
            alert('Error dropping course: ' + error.message);
        }
    }
}

// --- Authentication Functions ---
async function handleSignup(event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };

    try {
        const response = await fetch('http://localhost:5001/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('loggedInUser', JSON.stringify(result.user));
            authToken = result.token;
            loggedInUser = result.user;
            alert('Signup successful!');
            window.location.replace(`${formData.role}-dashboard.html`);
    } else {
            alert(result.error || 'Signup failed!');
    }
    } catch (err) {
        alert('Error connecting to server!');
}
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:5001/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('loggedInUser', JSON.stringify(result.user));
            authToken = result.token;
            loggedInUser = result.user;
            alert('Login successful!');
            window.location.replace(`${result.user.role}-dashboard.html`);
    } else {
            alert(result.error || 'Login failed!');
        }
    } catch (err) {
        alert('Error connecting to server!');
    }
}

// --- Modal Functions ---
function openResultViewModal() {
    console.log('openResultViewModal called');
    try {
        renderResultsTable();
        showModal('resultViewModal');
        const searchInput = document.getElementById('resultSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        console.log('Modal opened successfully');
    } catch (error) {
        console.error('Error opening result view modal:', error);
        alert('Error opening results view: ' + error.message);
    }
}

function closeResultViewModal() {
    closeModal('resultViewModal');
}

function renderResultsTable() {
    console.log('renderResultsTable called');
    const resultTableContainer = document.getElementById('resultTableContainer');
    const searchInput = document.getElementById('resultSearchInput');
    const searchTerm = (searchInput ? searchInput.value.trim().toLowerCase() : '');

    console.log('Making API call to /results');
    apiCall('/results').then(response => {
        console.log('API response received:', response);
        const results = response.data;
        let filteredResults = results;

        if (searchTerm) {
            filteredResults = results.filter(result => {
                const studentName = result.userId?.name?.toLowerCase() || '';
                const rollNo = result.userId?.studentId?.toLowerCase() || '';
                const courseCode = result.courseId?.courseCode?.toLowerCase() || '';
                return (
                    studentName.includes(searchTerm) ||
                    rollNo.includes(searchTerm) ||
                    courseCode.includes(searchTerm)
                );
            });
        }

        let tableHTML = `
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Student Name</th>
                        <th>Roll No</th>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (filteredResults.length === 0) {
            tableHTML += `<tr><td colspan="7" style="text-align:center;">No results found.</td></tr>`;
        } else {
        filteredResults.forEach(result => {
            tableHTML += `
                <tr>
                        <td>${result.userId?.name || 'N/A'}</td>
                        <td>${result.userId?.studentId || 'N/A'}</td>
                        <td>${result.courseId?.courseCode || 'N/A'}</td>
                        <td>${result.courseId?.courseName || 'N/A'}</td>
                        <td>${result.score ?? 'N/A'}</td>
                        <td>${result.grade || 'N/A'}</td>
                        <td>${result.dateAchieved ? new Date(result.dateAchieved).toLocaleDateString() : 'N/A'}</td>
                </tr>
            `;
        });
    }

        tableHTML += `</tbody></table>`;
    resultTableContainer.innerHTML = tableHTML;

        // Attach CSV download handler
        document.getElementById('downloadCsvBtn').onclick = () => downloadResultsCsv(filteredResults);
    }).catch(error => {
        console.error('Error fetching results:', error);
        if (resultTableContainer) {
            resultTableContainer.innerHTML = '<p style="text-align:center;color:red;">Error loading results. Please try again.</p>';
        }
    });
}

function downloadResultsCsv(results) {
    if (!results || results.length === 0) {
        alert('No results to download!');
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student Name,Roll No,Course Code,Course Name,Marks,Grade,Date\n";
    results.forEach(result => {
        csvContent += [
            `"${result.userId?.name || ''}"`,
            `"${result.userId?.studentId || ''}"`,
            `"${result.courseId?.courseCode || ''}"`,
            `"${result.courseId?.courseName || ''}"`,
            result.score ?? '',
            result.grade ?? '',
            result.dateAchieved ? new Date(result.dateAchieved).toLocaleDateString() : ''
        ].join(',') + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "all_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function confirmDelete(type, id) {
    const confirmModal = document.getElementById('confirmModal');
    const messageElement = document.getElementById('confirmMessage');
    const confirmYesBtn = document.getElementById('confirmYesBtn');
    const confirmNoBtn = document.getElementById('confirmNoBtn');

    if (!messageElement || !confirmYesBtn || !confirmNoBtn) {
        console.error("Confirmation modal elements not found.");
        return;
    }

    if (type === 'student') {
        messageElement.textContent = 'Are you sure you want to delete this student and ALL their associated results?';
        confirmYesBtn.onclick = () => { deleteStudent(id); closeConfirmModal(); };
    } else if (type === 'course') {
        messageElement.textContent = 'Are you sure you want to delete this course and ALL associated results?';
        confirmYesBtn.onclick = () => { deleteCourse(id); closeConfirmModal(); };
    } else if (type === 'result') {
        messageElement.textContent = 'Are you sure you want to delete this result?';
        confirmYesBtn.onclick = () => { deleteResult(id); closeConfirmModal(); };
    }

    confirmNoBtn.onclick = closeConfirmModal;
    showModal('confirmModal');
}

function closeConfirmModal() {
    closeModal('confirmModal');
}

async function openCourseRegistration() {
    const modal = document.getElementById('courseRegistrationModal');
    const availableCoursesDiv = document.getElementById('availableCourses');
    if (!modal || !availableCoursesDiv) {
        alert('Course registration modal not found!');
        return;
    }
    try {
        // Fetch all courses from backend
        const response = await apiCall('/courses');
        const allCourses = response.data;
        // Fetch student's registered courses (from backend or from user object)
        // We'll assume registeredStudents is an array of user IDs
        const registeredCourseIds = [];
        // Option 1: If user object has registered courses (not shown in your code)
        // Option 2: If you need to fetch, you can use loadRegisteredCourses logic
        // We'll check by calling /courses and filtering by registeredStudents
        allCourses.forEach(course => {
            if (course.registeredStudents && course.registeredStudents.includes(loggedInUser.id)) {
                registeredCourseIds.push(course._id);
            }
        });
        // Show all courses, with Register/Drop button as appropriate
        availableCoursesDiv.innerHTML = allCourses.length ?
            allCourses.map(course => {
                const isRegistered = course.registeredStudents && course.registeredStudents.includes(loggedInUser.id);
                return `
            <div class="course-item">
                        <h3>${course.courseName}</h3>
                        <p>Code: ${course.courseCode}</p>
                <p>Credits: ${course.credits}</p>
                        <button onclick="${isRegistered ? `dropCourse('${course._id}')` : `registerForCourse('${course._id}')`}" class="btn ${isRegistered ? 'btn-danger' : 'btn-primary'}">
                            ${isRegistered ? 'Drop Course' : 'Register'}
                        </button>
            </div>
                `;
            }).join('') :
            '<p>No courses available for registration.</p>';
        modal.style.display = 'block';
    } catch (error) {
        availableCoursesDiv.innerHTML = '<p>Error loading courses.</p>';
        modal.style.display = 'block';
    }
}

function closeCourseRegistration() {
    const modal = document.getElementById('courseRegistrationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openEditProfile() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        // Pre-fill the form with current user data
        document.getElementById('editName').value = loggedInUser.name;
        document.getElementById('editEmail').value = loggedInUser.email;
        document.getElementById('editSemester').value = loggedInUser.semester || '';
        document.getElementById('editDepartment').value = loggedInUser.department || '';
    modal.style.display = 'block';
    }
}

function closeEditProfile() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Attach to window for HTML access
window.openEditProfile = openEditProfile;
window.closeEditProfile = closeEditProfile;

async function downloadTranscript() {
    try {
        // Get student results from API
        const response = await apiCall(`/results/student/${loggedInUser.id}`);
        const data = response.data;
        const results = data.results;
        const cgpa = data.cgpa;

        if (!results.length) {
            alert('No results to download!');
            return;
        }

        // Prepare table body
        const tableBody = [
            [
                { text: 'Course Name', style: 'tableHeader' },
                { text: 'Course Code', style: 'tableHeader' },
                { text: 'Credits', style: 'tableHeader' },
                { text: 'Grade', style: 'tableHeader' },
                { text: 'Points', style: 'tableHeader' },
                { text: 'Date', style: 'tableHeader' }
            ]
        ];
        
        results.forEach(result => {
            tableBody.push([
                { text: result.courseId?.courseName || 'N/A', style: 'tableCell' },
                { text: result.courseId?.courseCode || 'N/A', style: 'tableCell' },
                { text: result.courseId?.credits?.toString() || 'N/A', style: 'tableCell' },
                { text: result.grade || 'N/A', style: 'tableCell' },
                { text: result.gradePoint?.toString() || 'N/A', style: 'tableCell' },
                { text: result.dateAchieved ? new Date(result.dateAchieved).toLocaleDateString() : 'N/A', style: 'tableCell' }
            ]);
        });

        // Calculate total credits
        const totalCredits = results.reduce((sum, result) => {
            return sum + (result.courseId?.credits || 0);
        }, 0);

        // Build modern PDF definition
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],
            header: {
                columns: [
                    {
                        image: 'data:image/png;base64,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', // your base64 string here
                        width: 60,
                        height: 60,
                        margin: [0, 0, 20, 0]
                    },
                    {
                        text: [
                            { text: 'BALOCHISTAN UNIVERSITY OF ENGINEERING & TECHNOLOGY\n', style: 'universityName' },
                            { text: 'ENGINEERING & TECHNOLOGY\n', style: 'universityName' },
                            { text: 'Khuzdar, Balochistan, Pakistan\n', style: 'universitySubtitle' },
                            { text: 'www.buetk.edu.pk', style: 'universityWebsite' }
                        ],
                        alignment: 'left',
                        margin: [0, 10, 0, 0]
                    }
                ],
                margin: [40, 20, 40, 0]
            },
            footer: {
                columns: [
                    {
                        text: 'This transcript is computer generated and does not require a signature.',
                        alignment: 'center',
                        style: 'footerText',
                        margin: [0, 10, 0, 0]
                    }
                ],
                margin: [40, 0, 40, 20]
            },
            content: [
                // Title
                { text: 'ACADEMIC TRANSCRIPT', style: 'mainTitle' },
                
                // Student Information Section
                {
                    layout: 'noBorders',
                    table: {
                        widths: ['*', '*'],
                        body: [
                            [
                                {
                                    text: [
                                        { text: 'Student Information\n', style: 'sectionTitle' },
                                        { text: 'Name: ', style: 'label' }, { text: loggedInUser.name, style: 'value' }, '\n',
                                        { text: 'Email: ', style: 'label' }, { text: loggedInUser.email, style: 'value' }, '\n',
                                        { text: 'Department: ', style: 'label' }, { text: loggedInUser.department || 'N/A', style: 'value' }, '\n',
                                        { text: 'Semester: ', style: 'label' }, { text: loggedInUser.semester || 'N/A', style: 'value' }
                                    ]
                                },
                                {
                                    text: [
                                        { text: 'Academic Summary\n', style: 'sectionTitle' },
                                        { text: 'Total Courses: ', style: 'label' }, { text: results.length.toString(), style: 'value' }, '\n',
                                        { text: 'Total Credits: ', style: 'label' }, { text: totalCredits.toString(), style: 'value' }, '\n',
                                        { text: 'CGPA: ', style: 'label' }, { text: cgpa || 'N/A', style: 'value' }, '\n',
                                        { text: 'Transcript Date: ', style: 'label' }, { text: new Date().toLocaleDateString(), style: 'value' }
                                    ]
                                }
                            ]
                        ]
                    },
                    margin: [0, 20, 0, 20]
                },
                
                // Results Table
                { text: 'Academic Performance', style: 'sectionTitle' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: tableBody
                    },
                    layout: {
                        hLineWidth: function(i, node) { return 0.5; },
                        vLineWidth: function(i, node) { return 0.5; },
                        hLineColor: function(i, node) { return '#e0e0e0'; },
                        vLineColor: function(i, node) { return '#e0e0e0'; },
                        fillColor: function(rowIndex, node, columnIndex) {
                            return (rowIndex === 0) ? '#f5f5f5' : null;
                        }
                    },
                    margin: [0, 10, 0, 20]
                },
                
                // CGPA Section
                {
                    layout: 'noBorders',
                    table: {
                        widths: ['*'],
                        body: [[
                            {
                                text: [
                                    { text: 'Cumulative Grade Point Average (CGPA): ', style: 'cgpaLabel' },
                                    { text: cgpa || 'N/A', style: 'cgpaValue' }
                                ],
                                alignment: 'center'
                            }
                        ]]
                    },
                    margin: [0, 10, 0, 0]
                },
                
                // Grade Legend
                {
                    text: 'Grade Point System',
                    style: 'sectionTitle',
                    margin: [0, 30, 0, 10]
                },
                {
                    layout: 'noBorders',
                table: {
                        widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                    body: [
                            [
                                { text: 'A+', style: 'gradeLegend' }, { text: 'A', style: 'gradeLegend' }, { text: 'A-', style: 'gradeLegend' },
                                { text: 'B+', style: 'gradeLegend' }, { text: 'B', style: 'gradeLegend' }, { text: 'B-', style: 'gradeLegend' }
                            ],
                            [
                                { text: '4.0', style: 'gradePoints' }, { text: '4.0', style: 'gradePoints' }, { text: '3.7', style: 'gradePoints' },
                                { text: '3.3', style: 'gradePoints' }, { text: '3.0', style: 'gradePoints' }, { text: '2.7', style: 'gradePoints' }
                            ],
                            [
                                { text: 'C+', style: 'gradeLegend' }, { text: 'C', style: 'gradeLegend' }, { text: 'C-', style: 'gradeLegend' },
                                { text: 'D+', style: 'gradeLegend' }, { text: 'D', style: 'gradeLegend' }, { text: 'F', style: 'gradeLegend' }
                            ],
                            [
                                { text: '2.3', style: 'gradePoints' }, { text: '2.0', style: 'gradePoints' }, { text: '1.7', style: 'gradePoints' },
                                { text: '1.3', style: 'gradePoints' }, { text: '1.0', style: 'gradePoints' }, { text: '0.0', style: 'gradePoints' }
                            ]
                        ]
                    },
                    margin: [0, 10, 0, 0]
                }
        ],
        styles: {
                mainTitle: {
                    fontSize: 24,
                    bold: true,
                    alignment: 'center',
                    color: '#1565c0',
                    margin: [0, 0, 0, 20]
                },
                universityName: {
                    fontSize: 16,
                    bold: true,
                    color: '#1565c0'
                },
                universitySubtitle: {
                    fontSize: 12,
                    color: '#666',
                    margin: [0, 5, 0, 0]
                },
                universityWebsite: {
                    fontSize: 10,
                    color: '#888',
                    margin: [0, 5, 0, 0]
                },
                sectionTitle: {
                    fontSize: 14,
                    bold: true,
                    color: '#1565c0',
                    margin: [0, 0, 0, 5]
                },
                label: {
                    fontSize: 10,
                    color: '#666',
                    bold: true
                },
                value: {
                    fontSize: 10,
                    color: '#333'
                },
                tableHeader: {
                    fontSize: 10,
                    bold: true,
                    color: '#1565c0',
                    alignment: 'center',
                    fillColor: '#f5f5f5'
                },
                tableCell: {
                    fontSize: 9,
                    alignment: 'center'
                },
                cgpaLabel: {
                    fontSize: 12,
                    bold: true,
                    color: '#1565c0'
                },
                cgpaValue: {
                    fontSize: 16,
                    bold: true,
                    color: '#1565c0'
                },
                gradeLegend: {
                    fontSize: 10,
                    bold: true,
                    color: '#1565c0',
                    alignment: 'center'
                },
                gradePoints: {
                    fontSize: 10,
                    color: '#666',
                    alignment: 'center'
                },
                footerText: {
                    fontSize: 8,
                    color: '#999',
                    italics: true
                }
            },
            defaultStyle: {
                fontSize: 10,
                color: '#333'
            }
        };
        
        pdfMake.createPdf(docDefinition).download(`${loggedInUser.name.replace(/\s+/g, '_')}_Transcript.pdf`);
    } catch (error) {
        alert('Error downloading transcript: ' + error.message);
    }
}
window.downloadTranscript = downloadTranscript;

// --- Initialization Functions ---
function initializeDOMElements() {
    studentNameElement = document.getElementById('studentName');
    studentProfileElement = document.getElementById('studentProfile');
    courseListElement = document.getElementById('courseList');
    resultListElement = document.getElementById('resultList');
    cgpaDisplayElement = document.getElementById('cgpaDisplay');
}

function handleAuthentication(currentPage) {
    if (!loggedInUser && currentPage !== 'login' && currentPage !== 'signup') {
        window.location.replace('login.html');
        return false;
    }
    return true;
}

function initializeAppropriateView(currentPage) {
    if (currentPage === 'student-dashboard') {
        initializeStudentDashboard();
    } else if (currentPage === 'admin-dashboard') {
        initializeAdminDashboard();
    }
}

// --- Student Dashboard Functions ---
function initializeStudentDashboard() {
    if (!loggedInUser || loggedInUser.role !== 'student') {
        window.location.replace('login.html');
        return;
    }

    loadStudentProfile();
    loadRegisteredCourses();
    loadStudentResults();
}

// --- Admin Dashboard Functions ---
function initializeAdminDashboard() {
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        window.location.replace('login.html');
        return;
    }

        loadStudents();
        loadCourses();
    initializeResultsSection();
}

async function loadStudents() {
    await renderStudents();
}

async function loadCourses() {
    await renderCourses();
}

function initializeResultsSection() {
    populateStudentSelect();
    populateCourseSelect();
    renderResultsTable();
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    
    // Add event listeners for forms
    const signupForm = document.getElementById('signupForm');
    if (signupForm) signupForm.addEventListener('submit', handleSignup);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    // Add event listeners for other forms
    const studentForm = document.getElementById('studentForm');
    if (studentForm) studentForm.addEventListener('submit', handleStudentSubmit);

    const courseForm = document.getElementById('courseForm');
    if (courseForm) courseForm.addEventListener('submit', handleCourseSubmit);

    // Handle the form submission for editing profile
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async function(event) {
    event.preventDefault();
            const newName = document.getElementById('editName').value;
            const newEmail = document.getElementById('editEmail').value;
            const newPassword = document.getElementById('editPassword').value;
            const newSemester = document.getElementById('editSemester').value;
            const newDepartment = document.getElementById('editDepartment').value;

            try {
                const updateData = { name: newName, email: newEmail };
                if (newPassword) updateData.password = newPassword;
                if (newSemester) updateData.semester = Number(newSemester);
                if (newDepartment) updateData.department = newDepartment;

                // Update profile via API
                await apiCall('/users/profile', {
                    method: 'PUT',
                    body: JSON.stringify(updateData)
                });

                // Fetch latest profile and update local user info
                const profileRes = await apiCall('/users/profile');
                if (profileRes && profileRes.data) {
                    loggedInUser = profileRes.data;
                    localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
                }

                loadStudentProfile();
                closeEditProfile();
                alert('Profile updated successfully!');
            } catch (error) {
                alert('Error updating profile: ' + error.message);
            }
        });
    }

    // Initialize based on current page
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    
    if (handleAuthentication(currentPage)) {
        initializeAppropriateView(currentPage);
    }

    const closeStudentModalX = document.getElementById('closeStudentModalX');
    const cancelStudentModalBtn = document.getElementById('cancelStudentModalBtn');
    if (closeStudentModalX) closeStudentModalX.addEventListener('click', closeStudentModal);
    if (cancelStudentModalBtn) cancelStudentModalBtn.addEventListener('click', closeStudentModal);

    const closeCourseModalX = document.getElementById('closeCourseModalX');
    const cancelCourseModalBtn = document.getElementById('cancelCourseModalBtn');
    if (closeCourseModalX) closeCourseModalX.addEventListener('click', closeCourseModal);
    if (cancelCourseModalBtn) cancelCourseModalBtn.addEventListener('click', closeCourseModal);

    // --- Results Modal Logic ---
    document.getElementById('closeResultViewModalX').onclick = closeResultViewModal;
    document.getElementById('closeResultViewModalBtn').onclick = closeResultViewModal;
    document.getElementById('resultSearchInput').addEventListener('input', renderResultsTable);
});

window.openCourseRegistration = openCourseRegistration;
window.closeCourseRegistration = closeCourseRegistration;

