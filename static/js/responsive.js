// Responsive sidebar toggle
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
});

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

// Page Navigation System
const pages = {
    dashboard: document.getElementById('dashboardContent'),
    users: document.getElementById('adminContent'),
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
            link.classList.remove('hover:bg-[#3182ce]');
        } else {
            link.classList.remove('bg-[#3182ce]');
            link.classList.add('hover:bg-[#3182ce]');
        }
    });

    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
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

// Show dashboard by default on page load
document.addEventListener('DOMContentLoaded', () => {
    showPage('dashboard');
});


const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
});

overlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
});

window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
});

// Attendance Data
let students = [
    { id: 1, timeIn: '8:15 AM', timeOut: '-', fullname: 'DURANO, DENNIS', course: 'BSIT-3', status: 'PRESENT' },
    { id: 2, timeIn: '-', timeOut: '-', fullname: 'DELA CRUZ, MARIA', course: 'BSIT-3', status: 'ABSENT' },
    { id: 3, timeIn: '8:00 AM', timeOut: '10:20 AM', fullname: 'REYES, JUAN', course: 'BSIT-3', status: 'PRESENT' },
    { id: 4, timeIn: '8:45 AM', timeOut: '-', fullname: 'SANTOS, PEDRO', course: 'BSIT-3', status: 'LATE' },
    { id: 5, timeIn: '-', timeOut: '-', fullname: 'GARCIA, ANA', course: 'BSIT-3', status: 'ABSENT' },
    { id: 6, timeIn: '8:10 AM', timeOut: '10:25 AM', fullname: 'LOPEZ, CARLOS', course: 'BSIT-3', status: 'PRESENT' },
];

let currentStudentIndex = -1;

// Render Table
function renderTable() {
    const tbody = document.getElementById('attendanceTableBody');
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

    document.getElementById('totalStudents').textContent = total;
    document.getElementById('presentCount').textContent = present;
    document.getElementById('lateCount').textContent = late;
    document.getElementById('absentCount').textContent = absent;
}

// Modal Functions
function openModal(index) {
    currentStudentIndex = index;
    document.getElementById('modalStudentName').textContent = students[index].fullname;
    document.getElementById('statusModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('statusModal').classList.add('hidden');
    currentStudentIndex = -1;
}

function changeStatus(newStatus) {
    if (currentStudentIndex !== -1) {
        students[currentStudentIndex].status = newStatus;

        // Update time based on status
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

// Export Function
document.getElementById('exportBtn').addEventListener('click', () => {
    const date = document.getElementById('attendanceDate').value;
    let csv = 'ID,Time In,Time Out,Full Name,Course & Level,Status\n';

    students.forEach(student => {
        csv += `${student.id},"${student.timeIn}","${student.timeOut}","${student.fullname}","${student.course}","${student.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
});

// Close modal when clicking outside
document.getElementById('statusModal').addEventListener('click', (e) => {
    if (e.target.id === 'statusModal') {
        closeModal();
    }
});

// Initialize
renderTable();