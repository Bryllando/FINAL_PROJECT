// ============================================
// SIDEBAR MANAGEMENT
// ============================================
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

// Toggle sidebar and overlay
menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
});

// Close sidebar when clicking overlay
overlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
});

// Close sidebar on window resize to desktop size
window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
});

// Close sidebar on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
});

// ============================================
// PAGE NAVIGATION SYSTEM
// ============================================
const pages = {
    users: document.getElementById('adminContent'),
    studentManagement: document.getElementById('StudentManagementContent'),
    students: document.getElementById('StudentContent'),
    attendance: document.getElementById('attendanceContent')
};

// Get all navigation links
const navLinks = document.querySelectorAll('nav a[data-page]');

// Function to show a specific page
function showPage(pageName) {
    // Hide all pages
    Object.values(pages).forEach(page => {
        if (page) page.classList.add('hidden');
    });

    // Show selected page
    if (pages[pageName]) {
        pages[pageName].classList.remove('hidden');
    }

    // Update active state on navigation links
    navLinks.forEach(link => {
        if (link.dataset.page === pageName) {
            link.classList.add('bg-[#3182ce]');
        } else {
            link.classList.remove('bg-[#3182ce]');
        }
    });

    // Close sidebar and overlay after navigation
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');

    // Re-render attendance table if switching to attendance page
    if (pageName === 'attendance') {
        setTimeout(renderTable, 100);
    }

    // Initialize student management table if switching to that page
    if (pageName === 'studentManagement') {
        setTimeout(renderStudentManagementTable, 100);
    }

    // Initialize student form features if switching to students page
    if (pageName === 'students') {
        setTimeout(initializeStudentForm, 100);
    }
}

// Add click event listeners to navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageName = link.dataset.page;
        showPage(pageName);
    });
});

// ============================================
// STUDENT MANAGEMENT (Student_mngt.html)
// ============================================
let managedStudents = [
    { id: 1, idNo: '2021-001', lastName: 'DURANO', firstName: 'DENNIS', course: 'BSIT', level: '3', image: null },
    { id: 2, idNo: '2021-002', lastName: 'DELA CRUZ', firstName: 'MARIA', course: 'BSCS', level: '2', image: null },
    { id: 3, idNo: '2021-003', lastName: 'REYES', firstName: 'JUAN', course: 'BSIS', level: '4', image: null },
];

let currentEditingStudentId = null;

function renderStudentManagementTable() {
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    managedStudents.forEach((student) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition';

        row.innerHTML = `
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800 font-semibold">${student.idNo}</td>
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">${student.lastName}</td>
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">${student.firstName}</td>
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">${student.course}</td>
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">${student.level}${getOrdinalSuffix(student.level)} Year</td>
            <td class="px-3 sm:px-4 py-3">
                <div class="flex justify-center gap-1 sm:gap-2">
                    <button onclick="editStudent(${student.id})"
                        class="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition">
                        Edit
                    </button>
                    <button onclick="deleteStudent(${student.id})"
                        class="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition">
                        Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getOrdinalSuffix(num) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
}

function editStudent(id) {
    const student = managedStudents.find(s => s.id === id);
    if (!student) return;

    // Navigate to student form page (Student.html - the detailed form)
    showPage('students');

    // Wait for page to be visible, then populate form
    setTimeout(() => {
        currentEditingStudentId = id;

        // Populate form fields on Student.html
        const studentIdInput = document.querySelector('#StudentContent #studentId');
        const lastNameInput = document.querySelector('#StudentContent #lastName');
        const firstNameInput = document.querySelector('#StudentContent #firstName');
        const courseSelect = document.querySelector('#StudentContent #course');
        const levelSelect = document.querySelector('#StudentContent #level');

        if (studentIdInput) studentIdInput.value = student.idNo;
        if (lastNameInput) lastNameInput.value = student.lastName;
        if (firstNameInput) firstNameInput.value = student.firstName;
        if (courseSelect) courseSelect.value = student.course;
        if (levelSelect) levelSelect.value = student.level + 'st Year';

        // Update button text
        const submitBtn = document.querySelector('#StudentContent #submitBtn');
        if (submitBtn) {
            const buttonText = submitBtn.querySelector('svg').nextSibling;
            if (buttonText) buttonText.textContent = ' UPDATE';
            submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            submitBtn.classList.add('bg-green-500', 'hover:bg-green-600');
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
}

function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        managedStudents = managedStudents.filter(s => s.id !== id);
        renderStudentManagementTable();
    }
}

// Add Student Button Handler
const addStudentBtn = document.getElementById('addStudentBtn');
if (addStudentBtn) {
    addStudentBtn.addEventListener('click', () => {
        // Navigate to the student form page (Student.html - the detailed form)
        showPage('students');

        // Reset the form after navigation
        setTimeout(() => {
            resetStudentForm();
        }, 100);
    });
}

// Student Management Inline Form Handler (on Student_mngt.html)
const studentManagementForm = document.querySelector('#StudentManagementContent #studentForm');
if (studentManagementForm) {
    studentManagementForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const idNo = document.querySelector('#StudentManagementContent #idNo').value;
        const lastName = document.querySelector('#StudentManagementContent #lastName').value;
        const firstName = document.querySelector('#StudentManagementContent #firstName').value;
        const course = document.querySelector('#StudentManagementContent #course').value;
        const level = document.querySelector('#StudentManagementContent #level').value;

        if (!idNo || !lastName || !firstName || !course || !level) {
            alert('Please fill in all fields');
            return;
        }

        if (currentEditingStudentId) {
            // Update existing student
            const student = managedStudents.find(s => s.id === currentEditingStudentId);
            if (student) {
                student.idNo = idNo;
                student.lastName = lastName.toUpperCase();
                student.firstName = firstName.toUpperCase();
                student.course = course;
                student.level = level;
            }
        } else {
            // Add new student
            const newId = managedStudents.length > 0 ? Math.max(...managedStudents.map(s => s.id)) + 1 : 1;
            managedStudents.push({
                id: newId,
                idNo,
                lastName: lastName.toUpperCase(),
                firstName: firstName.toUpperCase(),
                course,
                level,
                image: null
            });
        }

        renderStudentManagementTable();
        resetStudentManagementForm();
        alert(currentEditingStudentId ? 'Student updated successfully!' : 'Student added successfully!');
        currentEditingStudentId = null;
    });
}

function resetStudentManagementForm() {
    currentEditingStudentId = null;
    const form = document.querySelector('#StudentManagementContent #studentForm');
    if (form) form.reset();

    const submitBtn = document.querySelector('#StudentManagementContent #submitBtn');
    if (submitBtn) {
        submitBtn.textContent = 'SAVE';
        submitBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
        submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
    }

    // Reset image preview
    const imagePreview = document.querySelector('#StudentManagementContent #imagePreview');
    if (imagePreview) {
        imagePreview.innerHTML = `
            <svg class="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
        `;
    }
}

// ============================================
// STUDENT FORM (Student.html) - The main add student page
// ============================================
function initializeStudentForm() {
    const cameraBtn = document.querySelector('#StudentContent #cameraBtn');
    const fileUpload = document.querySelector('#StudentContent #fileUpload');
    const cancelBtn = document.querySelector('#StudentContent #cancelBtn');
    const video = document.querySelector('#StudentContent #video');
    const canvas = document.querySelector('#StudentContent #canvas');
    const studentFormMain = document.querySelector('#StudentContent #studentForm');

    let stream = null;
    let cameraActive = false;

    // Camera toggle
    if (cameraBtn) {
        cameraBtn.addEventListener('click', async () => {
            if (!cameraActive) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    video.srcObject = stream;
                    video.classList.remove('hidden');
                    document.querySelector('#StudentContent #cameraPlaceholder').classList.add('hidden');
                    await video.play();
                    cameraActive = true;
                    document.querySelector('#StudentContent #cameraBtnText').textContent = 'Capture Photo';
                    cameraBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                    cameraBtn.classList.add('bg-red-500', 'hover:bg-red-600');
                } catch (err) {
                    alert('Could not access camera: ' + err.message);
                }
            } else {
                // Capture photo
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);

                const capturedPhoto = document.querySelector('#StudentContent #capturedPhoto');
                const profileIcon = document.querySelector('#StudentContent #profileIcon');
                capturedPhoto.src = canvas.toDataURL('image/png');
                capturedPhoto.classList.remove('hidden');
                profileIcon.src = canvas.toDataURL('image/png');
                profileIcon.classList.remove('hidden');
                document.querySelector('#StudentContent #photoPlaceholder').classList.add('hidden');
                document.querySelector('#StudentContent #profilePlaceholder').classList.add('hidden');

                // Stop camera
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                video.classList.add('hidden');
                document.querySelector('#StudentContent #cameraPlaceholder').classList.remove('hidden');
                cameraActive = false;
                document.querySelector('#StudentContent #cameraBtnText').textContent = 'Camera Off';
                cameraBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
                cameraBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
            }
        });
    }

    // File upload
    if (fileUpload) {
        fileUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const uploadedImage = document.querySelector('#StudentContent #uploadedImage');
                    const capturedPhoto = document.querySelector('#StudentContent #capturedPhoto');
                    const profileIcon = document.querySelector('#StudentContent #profileIcon');

                    uploadedImage.src = event.target.result;
                    uploadedImage.classList.remove('hidden');
                    capturedPhoto.src = event.target.result;
                    capturedPhoto.classList.remove('hidden');
                    profileIcon.src = event.target.result;
                    profileIcon.classList.remove('hidden');

                    document.querySelector('#StudentContent #cameraPlaceholder').classList.add('hidden');
                    document.querySelector('#StudentContent #photoPlaceholder').classList.add('hidden');
                    document.querySelector('#StudentContent #profilePlaceholder').classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Cancel button - go back to student management page
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            showPage('studentManagement');
        });
    }

    // Form submission for Student.html
    if (studentFormMain) {
        // Remove old event listener by cloning
        const newForm = studentFormMain.cloneNode(true);
        studentFormMain.parentNode.replaceChild(newForm, studentFormMain);

        newForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const studentId = document.querySelector('#StudentContent #studentId').value;
            const lastName = document.querySelector('#StudentContent #lastName').value;
            const firstName = document.querySelector('#StudentContent #firstName').value;
            const course = document.querySelector('#StudentContent #course').value;
            const level = document.querySelector('#StudentContent #level').value;

            if (!studentId || !lastName || !firstName || !course || !level) {
                alert('Please fill in all fields');
                return;
            }

            // Extract level number (e.g., "1st Year" -> "1")
            const levelNumber = level.match(/\d+/)?.[0] || level;

            if (currentEditingStudentId) {
                // Update existing student
                const student = managedStudents.find(s => s.id === currentEditingStudentId);
                if (student) {
                    student.idNo = studentId;
                    student.lastName = lastName.toUpperCase();
                    student.firstName = firstName.toUpperCase();
                    student.course = course;
                    student.level = levelNumber;
                }
                alert('Student updated successfully!');
            } else {
                // Add new student
                const newId = managedStudents.length > 0 ? Math.max(...managedStudents.map(s => s.id)) + 1 : 1;
                managedStudents.push({
                    id: newId,
                    idNo: studentId,
                    lastName: lastName.toUpperCase(),
                    firstName: firstName.toUpperCase(),
                    course: course,
                    level: levelNumber,
                    image: null
                });
                alert('Student added successfully!');
            }

            // Clear editing state and go back to student management
            currentEditingStudentId = null;
            showPage('studentManagement');
            setTimeout(() => {
                renderStudentManagementTable();
            }, 100);
        });
    }
}

function resetStudentForm() {
    currentEditingStudentId = null;
    const form = document.querySelector('#StudentContent #studentForm');
    if (form) form.reset();

    const submitBtn = document.querySelector('#StudentContent #submitBtn');
    if (submitBtn) {
        const buttonText = submitBtn.querySelector('svg').nextSibling;
        if (buttonText) buttonText.textContent = ' SAVE';
        submitBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
        submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
    }

    // Reset all images
    const uploadedImage = document.querySelector('#StudentContent #uploadedImage');
    const capturedPhoto = document.querySelector('#StudentContent #capturedPhoto');
    const profileIcon = document.querySelector('#StudentContent #profileIcon');
    const cameraPlaceholder = document.querySelector('#StudentContent #cameraPlaceholder');
    const photoPlaceholder = document.querySelector('#StudentContent #photoPlaceholder');
    const profilePlaceholder = document.querySelector('#StudentContent #profilePlaceholder');

    if (uploadedImage) uploadedImage.classList.add('hidden');
    if (capturedPhoto) capturedPhoto.classList.add('hidden');
    if (profileIcon) profileIcon.classList.add('hidden');
    if (cameraPlaceholder) cameraPlaceholder.classList.remove('hidden');
    if (photoPlaceholder) photoPlaceholder.classList.remove('hidden');
    if (profilePlaceholder) profilePlaceholder.classList.remove('hidden');
}

// ============================================
// ATTENDANCE MANAGEMENT
// ============================================
let students = [
    { id: 1, timeIn: '8:15 AM', timeOut: '-', fullname: 'DURANO, DENNIS', course: 'BSIT-3', status: 'PRESENT' },
    { id: 2, timeIn: '-', timeOut: '-', fullname: 'DELA CRUZ, MARIA', course: 'BSIT-3', status: 'ABSENT' },
    { id: 3, timeIn: '8:00 AM', timeOut: '10:20 AM', fullname: 'REYES, JUAN', course: 'BSIT-3', status: 'PRESENT' },
    { id: 4, timeIn: '8:45 AM', timeOut: '-', fullname: 'SANTOS, PEDRO', course: 'BSIT-3', status: 'LATE' },
    { id: 5, timeIn: '-', timeOut: '-', fullname: 'GARCIA, ANA', course: 'BSIT-3', status: 'ABSENT' },
    { id: 6, timeIn: '8:10 AM', timeOut: '10:25 AM', fullname: 'LOPEZ, CARLOS', course: 'BSIT-3', status: 'PRESENT' },
];

let currentStudentIndex = -1;

// Render attendance table
function renderTable() {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    students.forEach((student, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition';

        const statusClass = getStatusClass(student.status);
        const statusIcon = getStatusIcon(student.status);

        row.innerHTML = `
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800 font-semibold">${student.id}</td>
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">${student.timeIn}</td>
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">${student.timeOut}</td>
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800 font-medium">${student.fullname}</td>
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">${student.course}</td>
            <td class="px-3 sm:px-4 py-3 text-center">
                <button onclick="openModal(${index})" 
                    class="${statusClass} px-3 py-1.5 rounded-full font-semibold text-xs sm:text-sm transition hover:opacity-80 flex items-center justify-center gap-1 mx-auto">
                    ${statusIcon}
                    ${student.status}
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updateStatistics();
}

function getStatusClass(status) {
    switch (status) {
        case 'PRESENT':
            return 'bg-green-100 text-green-800 hover:bg-green-200';
        case 'LATE':
            return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
        case 'ABSENT':
            return 'bg-red-100 text-red-800 hover:bg-red-200';
        default:
            return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
}

function getStatusIcon(status) {
    switch (status) {
        case 'PRESENT':
            return '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        case 'LATE':
            return '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        case 'ABSENT':
            return '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        default:
            return '';
    }
}

function updateStatistics() {
    const total = students.length;
    const present = students.filter(s => s.status === 'PRESENT').length;
    const late = students.filter(s => s.status === 'LATE').length;
    const absent = students.filter(s => s.status === 'ABSENT').length;

    const totalEl = document.getElementById('totalStudents');
    const presentEl = document.getElementById('presentCount');
    const lateEl = document.getElementById('lateCount');
    const absentEl = document.getElementById('absentCount');

    if (totalEl) totalEl.textContent = total;
    if (presentEl) presentEl.textContent = present;
    if (lateEl) lateEl.textContent = late;
    if (absentEl) absentEl.textContent = absent;
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function openModal(index) {
    currentStudentIndex = index;
    const modalName = document.getElementById('modalStudentName');
    const modal = document.getElementById('statusModal');

    if (modalName && modal) {
        modalName.textContent = students[index].fullname;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('statusModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    currentStudentIndex = -1;
}

function changeStatus(newStatus) {
    if (currentStudentIndex !== -1) {
        students[currentStudentIndex].status = newStatus;

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        if (newStatus === 'PRESENT' || newStatus === 'LATE') {
            if (students[currentStudentIndex].timeIn === '-') {
                students[currentStudentIndex].timeIn = timeString;
            }
        } else if (newStatus === 'ABSENT') {
            students[currentStudentIndex].timeIn = '-';
            students[currentStudentIndex].timeOut = '-';
        }

        renderTable();
        closeModal();
    }
}

// Close modal when clicking outside
const statusModal = document.getElementById('statusModal');
if (statusModal) {
    statusModal.addEventListener('click', (e) => {
        if (e.target.id === 'statusModal') {
            closeModal();
        }
    });
}

// ============================================
// EXPORT FUNCTION
// ============================================
const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const dateInput = document.getElementById('attendanceDate');
        const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
        let csv = 'ID,Time In,Time Out,Full Name,Course & Level,Status\n';

        students.forEach(student => {
            csv += `${student.id},"${student.timeIn}","${student.timeOut}","${student.fullname}","${student.course}","${student.status}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${date}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    });
}

// ============================================
// FORM HANDLERS
// ============================================
// Cancel button handler for user form
const cancelBtnUser = document.querySelector('form[action="/add_user"] button[type="button"].bg-red-500');
if (cancelBtnUser && cancelBtnUser.textContent.trim() === 'CANCEL') {
    cancelBtnUser.addEventListener('click', () => {
        const form = document.querySelector('form[action="/add_user"]');
        if (form) {
            form.reset();
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    showPage('users'); // Show users page by default

    // Initialize the student management table on load
    renderStudentManagementTable();
});