// ============================================
// STUDENT_MNGT.HTML - ENHANCED LIST MANAGEMENT
// ============================================

// Global variables for sorting and filtering
let studentsData = [];
let currentSortColumn = 'idno';
let currentSortOrder = 'asc';
let searchQuery = '';

// Initialize student list management
function initializeStudentList() {
    // Get all student rows from the table
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    studentsData = [];

    rows.forEach(row => {
        const cells = row.cells;
        if (cells.length > 1) { // Skip "no students" message row
            studentsData.push({
                idno: cells[0].textContent.trim(),
                lastname: cells[1].textContent.trim(),
                firstname: cells[2].textContent.trim(),
                course: cells[3].textContent.trim(),
                level: cells[4].textContent.trim(),
                element: row.cloneNode(true) // Clone to preserve original
            });
        }
    });

    // Add sort functionality to headers
    addSortListeners();

    // Add search functionality
    addSearchListener();

    // Initial render
    renderStudentList();
}

// Add click listeners to table headers for sorting
function addSortListeners() {
    const thead = document.querySelector('thead');
    if (!thead) return;

    const headers = thead.querySelectorAll('th');
    const columns = ['idno', 'lastname', 'firstname', 'course', 'level'];

    headers.forEach((header, index) => {
        if (index < columns.length) { // Skip ACTION column
            header.style.cursor = 'pointer';
            header.style.userSelect = 'none';
            header.classList.add('hover:bg-gray-700', 'transition-colors');

            // Add sort icon
            const iconSpan = document.createElement('span');
            iconSpan.className = 'sort-icon ml-1 inline-block';
            iconSpan.innerHTML = '↕'; // Up-down arrow
            iconSpan.style.opacity = '0.3';
            header.appendChild(iconSpan);

            header.addEventListener('click', () => {
                sortStudents(columns[index]);
            });
        }
    });
}

// Add search input listener
function addSearchListener() {
    const searchInput = document.getElementById('studentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderStudentList();
        });
    }
}

// Sort students by column
function sortStudents(column) {
    if (currentSortColumn === column) {
        // Toggle sort order if clicking same column
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        // New column, start with ascending
        currentSortColumn = column;
        currentSortOrder = 'asc';
    }

    renderStudentList();
    updateSortIcons();
}

// Update sort icons in headers
function updateSortIcons() {
    // Reset all icons
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.innerHTML = '↕';
        icon.style.opacity = '0.3';
    });

    // Update active column icon
    const thead = document.querySelector('thead');
    if (!thead) return;

    const headers = thead.querySelectorAll('th');
    const columnIndex = {
        'idno': 0,
        'lastname': 1,
        'firstname': 2,
        'course': 3,
        'level': 4
    };

    const activeHeader = headers[columnIndex[currentSortColumn]];
    if (activeHeader) {
        const icon = activeHeader.querySelector('.sort-icon');
        if (icon) {
            icon.innerHTML = currentSortOrder === 'asc' ? '↑' : '↓';
            icon.style.opacity = '1';
        }
    }
}

// Filter and sort students, then render
function renderStudentList() {
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;

    // Filter students based on search query
    let filteredStudents = studentsData.filter(student => {
        if (!searchQuery) return true;

        return student.idno.toLowerCase().includes(searchQuery) ||
            student.lastname.toLowerCase().includes(searchQuery) ||
            student.firstname.toLowerCase().includes(searchQuery) ||
            student.course.toLowerCase().includes(searchQuery) ||
            student.level.toLowerCase().includes(searchQuery);
    });

    // Sort filtered students
    filteredStudents.sort((a, b) => {
        let aVal = a[currentSortColumn].toLowerCase();
        let bVal = b[currentSortColumn].toLowerCase();

        // Special handling for level (extract number)
        if (currentSortColumn === 'level') {
            aVal = parseInt(aVal) || 0;
            bVal = parseInt(bVal) || 0;
        }

        if (currentSortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    // Clear tbody
    tbody.innerHTML = '';

    // Render filtered and sorted students
    if (filteredStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                    ${searchQuery ? 'No students found matching your search.' : 'No students found. Add a student to get started.'}
                </td>
            </tr>
        `;
    } else {
        filteredStudents.forEach(student => {
            const row = student.element.cloneNode(true);
            tbody.appendChild(row);
        });

        // Re-attach event listeners to cloned elements
        reattachEventListeners();
    }

    // Update result count
    updateResultCount(filteredStudents.length, studentsData.length);
}

// Re-attach event listeners after rendering
function reattachEventListeners() {
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;

    // Re-attach view button listeners
    tbody.querySelectorAll('button[onclick*="viewStudentInForm"]').forEach(btn => {
        const onclick = btn.getAttribute('onclick');
        if (onclick) {
            const match = onclick.match(/viewStudentInForm\('([^']+)'\)/);
            if (match) {
                const studentId = match[1];
                btn.onclick = function (e) {
                    e.preventDefault();
                    viewStudentInForm(studentId);
                };
            }
        }
    });

    // Re-attach delete button listeners
    tbody.querySelectorAll('button[onclick*="deleteStudent"]').forEach(btn => {
        const onclick = btn.getAttribute('onclick');
        if (onclick) {
            const match = onclick.match(/deleteStudent\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                const studentId = match[1];
                const studentName = match[2];
                btn.onclick = function (e) {
                    e.preventDefault();
                    deleteStudent(studentId, studentName);
                };
            }
        }
    });
}

// Update result count display
function updateResultCount(filtered, total) {
    const countElement = document.getElementById('resultCount');
    if (countElement) {
        if (searchQuery) {
            countElement.textContent = `Showing ${filtered} of ${total} students`;
        } else {
            countElement.textContent = `Total: ${total} students`;
        }
    }
}

// Clear search
function clearSearch() {
    const searchInput = document.getElementById('studentSearch');
    if (searchInput) {
        searchInput.value = '';
        searchQuery = '';
        renderStudentList();
    }
}

// Export filtered students to CSV
function exportFilteredStudents() {
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');

    if (rows.length === 0 || (rows.length === 1 && rows[0].cells.length === 1)) {
        alert('No data to export');
        return;
    }

    let csv = 'ID Number,Last Name,First Name,Course,Level\n';

    rows.forEach(row => {
        if (row.cells.length > 1) {
            const cells = row.cells;
            const csvRow = [
                `"${cells[0].textContent.trim()}"`,
                `"${cells[1].textContent.trim()}"`,
                `"${cells[2].textContent.trim()}"`,
                `"${cells[3].textContent.trim()}"`,
                `"${cells[4].textContent.trim()}"`
            ].join(',');
            csv += csvRow + '\n';
        }
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert('Student list exported successfully!');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStudentList);
} else {
    initializeStudentList();
}