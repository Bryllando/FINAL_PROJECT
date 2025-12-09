// ============================================
// ATTENDANCE.HTML - ATTENDANCE MANAGEMENT FUNCTIONS
// FIXED: Added AM/PM format for time display
// ============================================

// Attendance variables
let currentSelectedStudent = null;
let currentDate = new Date().toISOString().split('T')[0];

// ============================================
// TIME FORMATTING HELPER
// ============================================

/**
 * Convert 24-hour time to 12-hour format with AM/PM
 * @param {string} time24 - Time in HH:MM format (24-hour)
 * @returns {string} - Time in hh:MM AM/PM format
 */
function formatTimeWithAMPM(time24) {
    if (!time24 || time24 === '-' || time24 === '') {
        return '-';
    }

    try {
        // Split time into hours and minutes
        const [hours24, minutes] = time24.split(':');
        let hours = parseInt(hours24, 10);

        // Determine AM or PM
        const period = hours >= 12 ? 'PM' : 'AM';

        // Convert to 12-hour format
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12

        // Pad single digits with leading zero
        const hoursStr = String(hours).padStart(2, '0');

        return `${hoursStr}:${minutes} ${period}`;
    } catch (error) {
        console.error('Error formatting time:', error);
        return time24; // Return original if formatting fails
    }
}


// ============================================
// INITIALIZATION
// ============================================

// Initialize attendance page
function initializeAttendance() {
    console.log('📊 Initializing attendance page...');

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


// ============================================
// ATTENDANCE DATA LOADING
// ============================================

/**
 * Load attendance records for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 */
async function loadAttendance(date) {
    console.log('📥 Loading attendance for date:', date);

    try {
        const response = await fetch(`/api/attendance/${date}`);
        const data = await response.json();

        if (data.success) {
            console.log('✅ Attendance data loaded:', data.attendance.length, 'records');
            displayAttendance(data.attendance);
            updateStats(data.stats);
        } else {
            showError('Failed to load attendance: ' + data.message);
        }
    } catch (error) {
        console.error('❌ Error loading attendance:', error);
        showError('Error loading attendance data');
    }
}


// ============================================
// ATTENDANCE DISPLAY
// ============================================

/**
 * Display attendance records in table with AM/PM format
 * @param {Array} attendanceRecords - Array of attendance records
 */
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
        row.className = 'hover:bg-gray-50 transition';

        const statusClass = getStatusClass(record.status);
        const statusBadge = `
            <span class="${statusClass} px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition">
                ${getStatusIcon(record.status)}
                ${record.status}
            </span>
        `;

        // Format times with AM/PM
        const timeIn = formatTimeWithAMPM(record.time_in);
        const timeOut = formatTimeWithAMPM(record.time_out);
        row.innerHTML = `
    <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-blue-600 font-semibold">${record.idno}</td>
    <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800 font-medium">${timeIn}</td>
    <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">${record.Firstname} ${record.Lastname}</td>
    <td class="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">${record.course} - ${record.level}</td>
    <td class="px-3 sm:px-4 py-3 text-center">
        ${statusBadge}
    </td>
`;

        tbody.appendChild(row);

        // Add click event listener to the status badge for toggling
        const statusSpan = row.querySelector('span');
        statusSpan.addEventListener('click', function () {
            toggleStatus(record.idno, record.status);
        });
    });
}


// ============================================
// STATISTICS UPDATE
// ============================================

/**
 * Update attendance statistics display
 * @param {Object} stats - Statistics object with total, present, late, absent counts
 */
function updateStats(stats) {
    const totalEl = document.getElementById('totalStudents');
    const presentEl = document.getElementById('presentCount');
    const lateEl = document.getElementById('lateCount');
    const absentEl = document.getElementById('absentCount');

    if (totalEl) totalEl.textContent = stats.total || 0;
    if (presentEl) presentEl.textContent = stats.present || 0;
    if (lateEl) lateEl.textContent = stats.late || 0;
    if (absentEl) absentEl.textContent = stats.absent || 0;

    console.log('📊 Stats updated:', stats);
}

/**
 * Update attendance table (called from QR scanner)
 * Reloads the current date's attendance
 */
function updateAttendanceTable() {
    console.log('🔄 Updating attendance table from scanner...');
    if (typeof loadAttendance === 'function') {
        loadAttendance(currentDate);
    }
}


// ============================================
// STATUS MANAGEMENT
// ============================================

/**
 * Get CSS class for status badge
 * @param {string} status - Attendance status (PRESENT, LATE, ABSENT)
 * @returns {string} - CSS classes for badge
 */
function getStatusClass(status) {
    switch (status) {
        case 'PRESENT':
            return 'bg-green-100 text-green-700 border border-green-300';
        case 'LATE':
            return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
        case 'ABSENT':
            return 'bg-red-100 text-red-700 border border-red-300';
        default:
            return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
}

/**
 * Get SVG icon for status
 * @param {string} status - Attendance status
 * @returns {string} - SVG icon HTML
 */
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

/**
 * Toggle attendance status (ABSENT -> PRESENT -> LATE -> ABSENT cycle)
 * @param {string} studentIdno - Student ID number
 * @param {string} currentStatus - Current attendance status
 */
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

    console.log(`🔄 Toggling status for ${studentIdno}: ${currentStatus} -> ${newStatus}`);

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
            console.log('✅ Status updated successfully');
            loadAttendance(currentDate); // Reload attendance
        } else {
            console.error('❌ Failed to update status:', data.message);
            showError('Failed to update status: ' + data.message);
        }
    } catch (error) {
        console.error('❌ Error updating status:', error);
        showError('Error updating attendance status');
    }
}


// ============================================
// TIME UTILITIES
// ============================================

/**
 * Get current time in HH:MM format (24-hour)
 * @returns {string} - Current time
 */
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}


// ============================================
// EXPORT FUNCTIONALITY
// ============================================

/**
 * Export attendance data to CSV file
 * Includes AM/PM formatted times
 */
function exportAttendance() {
    console.log('📥 Exporting attendance...');

    const date = currentDate;
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');

    if (rows.length === 0 || rows[0].cells.length === 1) {
        showError('No data to export');
        return;
    }

    // CSV Header
    let csv = 'ID,Time In,Full Name,Course & Level,Status\n';

    // CSV Rows
    rows.forEach(row => {
        const cells = row.cells;
        const csvRow = [
            cells[0].textContent.trim(),
            cells[1].textContent.trim(),
            cells[2].textContent.trim(),
            `"${cells[3].textContent.trim()}"`, // Quotes for names with commas
            `"${cells[4].textContent.trim()}"`, // Quotes for course info
            cells[5].textContent.trim().replace(/\s+/g, ' ') // Clean up status text
        ].join(',');
        csv += csvRow + '\n';
    });

    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showSuccess('Attendance exported successfully!');
    console.log('✅ Export completed');
}


// ============================================
// USER FEEDBACK
// ============================================

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
    alert('✅ ' + message);
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    alert('❌ ' + message);
}


// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get year level text from number
 * @param {number|string} level - Year level
 * @returns {string} - Formatted year level
 */
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


// ============================================
// INITIALIZATION
// ============================================

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('📋 Attendance page script loaded');

    // Check if we're on the attendance page
    if (document.getElementById('attendanceTableBody')) {
        initializeAttendance();
    }

    // Check if we need to load student for editing (from sessionStorage)
    const editStudentId = sessionStorage.getItem('editStudentId');
    if (editStudentId && document.getElementById('studentForm')) {
        // We're on the student form page and need to edit a student
        if (typeof editStudent === 'function') {
            editStudent(editStudentId);
        }
        // Clear the sessionStorage after loading
        sessionStorage.removeItem('editStudentId');
    }

    // Student form validation
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', function (e) {
            if (typeof validateStudentForm === 'function' && !validateStudentForm()) {
                e.preventDefault();
            }
        });

        // Cancel button handler
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn && typeof cancelStudentForm === 'function') {
            cancelBtn.addEventListener('click', cancelStudentForm);
        }
    }

    // User form validation
    const userForms = document.querySelectorAll('form[action="/add_user"], form[action="/update_user"]');
    userForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            if (typeof validateUserForm === 'function' && !validateUserForm()) {
                e.preventDefault();
            }
        });
    });

    // Add Student button handler (if exists on page)
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn && typeof addNewStudent === 'function') {
        addStudentBtn.addEventListener('click', addNewStudent);
    }

    // Edit button handler for Student_mngt.html
    const editFormBtn = document.getElementById('editFormBtn');
    if (editFormBtn && typeof editStudentRedirect === 'function') {
        editFormBtn.addEventListener('click', function () {
            editStudentRedirect();
        });
    }

    // Clear form button handler for Student_mngt.html
    const clearFormBtn = document.getElementById('clearFormBtn');
    if (clearFormBtn && typeof clearStudentViewForm === 'function') {
        clearFormBtn.addEventListener('click', clearStudentViewForm);
    }
});

console.log('✅ Attendance management script loaded');