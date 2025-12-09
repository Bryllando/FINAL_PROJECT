// ============================================
// ATTENDANCE.HTML - ATTENDANCE MANAGEMENT FUNCTIONS
// ============================================

// Attendance variables
let currentSelectedStudent = null;
let currentDate = new Date().toISOString().split('T')[0];

// Initialize attendance page
function initializeAttendance() {
    // Set today's date as default
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) {
        dateInput.value = currentDate;
        dateInput.max = new Date().toISOString().split('T')[0]; // Don't allow future dates
        loadAttendance(currentDate);
    }

    // Go button click handler
    const goBtn = document.getElementById('goBtn');
    if (goBtn) {
        goBtn.addEventListener('click', function () {
            const selectedDate = dateInput.value;
            if (selectedDate) {
                currentDate = selectedDate;
                loadAttendance(selectedDate);
            }
        });
    }

    // Export button click handler
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAttendance);
    }
}

// Load attendance for a specific date
async function loadAttendance(date) {
    try {
        const response = await fetch(`/api/attendance/${date}`);
        const data = await response.json();

        if (data.success) {
            displayAttendance(data.attendance);
            updateStats(data.stats);
        } else {
            showError('Failed to load attendance: ' + data.message);
        }
    } catch (error) {
        console.error('Error loading attendance:', error);
        showError('Error loading attendance data');
    }
}

// Display attendance in table
function displayAttendance(attendanceRecords) {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (attendanceRecords.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                    No students found
                </td>
            </tr>
        `;
        return;
    }

    attendanceRecords.forEach(record => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        const statusClass = getStatusClass(record.status);
        const statusBadge = `
            <span class="${statusClass} px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 cursor-pointer hover:opacity-80">
                ${getStatusIcon(record.status)}
                ${record.status}
            </span>
        `;

        row.innerHTML = `
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-blue-600 font-semibold">${record.idno}</td>
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">${record.time_in || '-'}</td>
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">${record.time_out || '-'}</td>
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">${record.Firstname} ${record.Lastname}</td>
            <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">${record.course} - ${record.level}</td>
            <td class="px-3 sm:px-4 py-3 text-center">
                ${statusBadge}
            </td>
        `;

        tbody.appendChild(row);

        // Add click event listener to the status badge
        const statusSpan = row.querySelector('span');
        statusSpan.addEventListener('click', function () {
            toggleStatus(record.idno, record.status);
        });
    });
}

// Update statistics
function updateStats(stats) {
    const totalEl = document.getElementById('totalStudents');
    const presentEl = document.getElementById('presentCount');
    const lateEl = document.getElementById('lateCount');
    const absentEl = document.getElementById('absentCount');

    if (totalEl) totalEl.textContent = stats.total || 0;
    if (presentEl) presentEl.textContent = stats.present || 0;
    if (lateEl) lateEl.textContent = stats.late || 0;
    if (absentEl) absentEl.textContent = stats.absent || 0;
}

// Update attendance table (called from scanner)
function updateAttendanceTable() {
    if (typeof loadAttendance === 'function') {
        loadAttendance(currentDate);
    }
}

// Get status badge class
function getStatusClass(status) {
    switch (status) {
        case 'PRESENT':
            return 'bg-green-100 text-green-700';
        case 'LATE':
            return 'bg-yellow-100 text-yellow-700';
        case 'ABSENT':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

// Get status icon
function getStatusIcon(status) {
    switch (status) {
        case 'PRESENT':
            return '<svg class="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        case 'LATE':
            return '<svg class="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        case 'ABSENT':
            return '<svg class="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        default:
            return '';
    }
}

// Toggle status on click (ABSENT -> PRESENT -> LATE -> ABSENT)
async function toggleStatus(studentIdno, currentStatus) {
    // Determine next status in cycle
    let newStatus;
    switch (currentStatus) {
        case 'ABSENT':
            newStatus = 'PRESENT';
            break;
        case 'PRESENT':
            newStatus = 'LATE';
            break;
        case 'LATE':
            newStatus = 'ABSENT';
            break;
        default:
            newStatus = 'PRESENT';
    }

    try {
        const currentTime = getCurrentTime();

        const response = await fetch('/api/attendance/update_status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_idno: studentIdno,
                date: currentDate,
                status: newStatus,
                time_in: newStatus !== 'ABSENT' ? currentTime : null,
                time_out: null
            })
        });

        const data = await response.json();

        if (data.success) {
            loadAttendance(currentDate); // Reload attendance
        } else {
            showError('Failed to update status: ' + data.message);
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showError('Error updating attendance status');
    }
}

// Get current time in HH:MM format
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Export attendance to CSV
function exportAttendance() {
    const date = currentDate;
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');

    if (rows.length === 0 || rows[0].cells.length === 1) {
        showError('No data to export');
        return;
    }

    let csv = 'ID,Time In,Time Out,Full Name,Course & Level,Status\n';

    rows.forEach(row => {
        const cells = row.cells;
        const csvRow = [
            cells[0].textContent,
            cells[1].textContent,
            cells[2].textContent,
            cells[3].textContent,
            cells[4].textContent,
            cells[5].textContent.trim()
        ].join(',');
        csv += csvRow + '\n';
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showSuccess('Attendance exported successfully');
}

// Show success message
function showSuccess(message) {
    alert(message);
}

// Show error message
function showError(message) {
    alert(message);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Helper function to get year level text
function getYearLevel(level) {
    const levels = {
        '1': '1st Year',
        '2': '2nd Year',
        '3': '3rd Year',
        '4': '4th Year',
        '1st Year': '1st Year',
        '2nd Year': '2nd Year',
        '3rd Year': '3rd Year',
        '4th Year': '4th Year'
    };
    return levels[level] || level;
}

// Download QR Code function
function downloadQRCode() {
    const qrContainer = document.getElementById('qrCodeContainer');
    if (!qrContainer) return;

    const canvas = qrContainer.querySelector('canvas');
    if (canvas) {
        // Get student ID for filename
        const studentId = document.getElementById('studentId').value || 'student';

        // Convert canvas to image
        const url = canvas.toDataURL('image/png');

        // Create download link
        const link = document.createElement('a');
        link.download = `QR_${studentId}.png`;
        link.href = url;
        link.click();
    } else {
        alert('QR Code not generated yet');
    }
}

// Helper function to create modal
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="px-6 py-4">
                ${content}
            </div>
            <div class="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                <button onclick="this.closest('.fixed').remove()" 
                    class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition">
                    Close
                </button>
            </div>
        </div>
    `;

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    return modal;
}

// Form validation for student form
function validateStudentForm() {
    const idNo = document.getElementById('studentId')?.value.trim();
    const lastName = document.getElementById('lastName')?.value.trim();
    const firstName = document.getElementById('firstName')?.value.trim();
    const course = document.getElementById('course')?.value;
    const level = document.getElementById('level')?.value;

    if (!idNo) {
        alert('Please enter ID Number');
        document.getElementById('studentId')?.focus();
        return false;
    }

    if (!lastName) {
        alert('Please enter Last Name');
        document.getElementById('lastName')?.focus();
        return false;
    }

    if (!firstName) {
        alert('Please enter First Name');
        document.getElementById('firstName')?.focus();
        return false;
    }

    if (!course) {
        alert('Please select a Course');
        document.getElementById('course')?.focus();
        return false;
    }

    if (!level) {
        alert('Please select a Level');
        document.getElementById('level')?.focus();
        return false;
    }

    return true;
}

// Form validation for user form
function validateUserForm() {
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');

    if (!emailInput || !passwordInput) return true;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
        alert('Please enter email address');
        emailInput.focus();
        return false;
    }

    // Email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        emailInput.focus();
        return false;
    }

    if (!password) {
        alert('Please enter password');
        passwordInput.focus();
        return false;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        passwordInput.focus();
        return false;
    }

    return true;
}


// ============================================
// INITIALIZATION
// ============================================

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on the attendance page
    if (document.getElementById('attendanceTableBody')) {
        initializeAttendance();
    }

    // Check if we need to load student for editing (from sessionStorage)
    const editStudentId = sessionStorage.getItem('editStudentId');
    if (editStudentId && document.getElementById('studentForm')) {
        // We're on the student form page and need to edit a student
        editStudent(editStudentId);
        // Clear the sessionStorage after loading
        sessionStorage.removeItem('editStudentId');
    }

    // Student form validation
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', function (e) {
            if (!validateStudentForm()) {
                e.preventDefault();
            }
        });

        // Cancel button handler
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', cancelStudentForm);
        }
    }

    // User form validation
    const userForms = document.querySelectorAll('form[action="/add_user"], form[action="/update_user"]');
    userForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            if (!validateUserForm()) {
                e.preventDefault();
            }
        });
    });

    // Add Student button handler (if exists on page)
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', addNewStudent);
    }

    // Edit button handler for Student_mngt.html
    const editFormBtn = document.getElementById('editFormBtn');
    if (editFormBtn) {
        editFormBtn.addEventListener('click', function () {
            editStudentRedirect();
        });
    }

    // Clear form button handler for Student_mngt.html
    const clearFormBtn = document.getElementById('clearFormBtn');
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', clearStudentViewForm);
    }
});